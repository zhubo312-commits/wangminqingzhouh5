import type BetterSqlite3 from "better-sqlite3";
import type { AssetKind, IndexEntry, IndexGroup, PageKind, PageStatus } from "../domain/types.js";
import { NotFoundError } from "../shared/errors.js";
import { nowIso } from "../shared/database.js";

export interface SourcePageRow {
  id: number;
  run_id: string;
  url: string;
  resolved_url: string | null;
  page_kind: PageKind;
  source_key: string | null;
  status: PageStatus;
  etag: string | null;
  last_modified: string | null;
  local_path: string | null;
  content_sha256: string | null;
  attempt_count: number;
}

export interface SourceAssetRow {
  id: number;
  run_id: string;
  url: string;
  asset_kind: AssetKind;
  status: PageStatus;
  etag: string | null;
  last_modified: string | null;
  local_path: string | null;
  content_sha256: string | null;
  attempt_count: number;
}

export interface FetchedResult {
  resolvedUrl: string;
  httpStatus: number;
  contentType: string | null;
  etag: string | null;
  lastModified: string | null;
  sha256: string;
  localPath: string;
}

export class CrawlRepository {
  constructor(private readonly database: BetterSqlite3.Database) {}

  ensureRelease(id: string, schemaVersion: string, parserVersion: string, sourceBaseUrl: string): void {
    const now = nowIso();
    this.database.prepare(`
      INSERT INTO dataset_releases (
        id, schema_version, parser_version, status, source_base_url, authorization_basis, created_at, updated_at
      ) VALUES (?, ?, ?, 'candidate', ?, 'user-confirmed authorized archival', ?, ?)
      ON CONFLICT(id) DO UPDATE SET parser_version = excluded.parser_version, updated_at = excluded.updated_at
    `).run(id, schemaVersion, parserVersion, sourceBaseUrl, now, now);
  }

  ensureRun(id: string, releaseId: string, mode: string, config: unknown): void {
    const now = nowIso();
    this.database.prepare(`
      INSERT INTO crawl_runs (id, release_id, mode, status, config_json, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET mode = excluded.mode, config_json = excluded.config_json, updated_at = excluded.updated_at
    `).run(id, releaseId, mode, JSON.stringify(config), now, now);
  }

  startRun(id: string): void {
    const now = nowIso();
    this.database.prepare(`
      UPDATE crawl_runs SET status = 'running', started_at = COALESCE(started_at, ?), updated_at = ? WHERE id = ?
    `).run(now, now, id);
  }

  resetInterrupted(runId: string): void {
    const now = nowIso();
    this.database.prepare(`
      UPDATE source_pages SET status = 'failed', error_code = 'INTERRUPTED', error_message = 'Previous process stopped while fetching', updated_at = ?
      WHERE run_id = ? AND status = 'fetching'
    `).run(now, runId);
    this.database.prepare(`
      UPDATE source_assets SET status = 'failed', error_code = 'INTERRUPTED', error_message = 'Previous process stopped while fetching', updated_at = ?
      WHERE run_id = ? AND status = 'fetching'
    `).run(now, runId);
  }

  resetParserFailures(runId: string): void {
    const now = nowIso();
    this.database.prepare(`
      UPDATE source_pages
      SET status = 'failed', attempt_count = 0, updated_at = ?
      WHERE run_id = ? AND status = 'failed' AND error_code IN ('PARSE_ERROR', 'UNEXPECTED_ERROR')
    `).run(now, runId);
  }

  resetFailed(runId: string): void {
    const now = nowIso();
    this.database.prepare(`
      UPDATE source_pages SET status = 'failed', attempt_count = 0, updated_at = ?
      WHERE run_id = ? AND status = 'failed'
    `).run(now, runId);
    this.database.prepare(`
      UPDATE source_assets SET status = 'failed', attempt_count = 0, updated_at = ?
      WHERE run_id = ? AND status = 'failed'
    `).run(now, runId);
  }

  finishRun(id: string, status: "succeeded" | "failed" | "cancelled"): void {
    const now = nowIso();
    this.database.prepare("UPDATE crawl_runs SET status = ?, finished_at = ?, updated_at = ? WHERE id = ?")
      .run(status, now, now, id);
  }

  releaseIdForRun(runId: string): string {
    const row = this.database.prepare("SELECT release_id FROM crawl_runs WHERE id = ?").get(runId) as { release_id: string } | undefined;
    if (!row) throw new NotFoundError("crawl run", runId);
    return row.release_id;
  }

  upsertPage(
    runId: string,
    url: string,
    pageKind: PageKind,
    sourceKey: string | null = null,
    discoveredFromPageId: number | null = null,
  ): number {
    const now = nowIso();
    this.database.prepare(`
      INSERT INTO source_pages (
        run_id, url, page_kind, source_key, discovered_from_page_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(run_id, url) DO UPDATE SET
        page_kind = CASE WHEN source_pages.page_kind = 'unknown' THEN excluded.page_kind ELSE source_pages.page_kind END,
        source_key = COALESCE(source_pages.source_key, excluded.source_key),
        discovered_from_page_id = COALESCE(source_pages.discovered_from_page_id, excluded.discovered_from_page_id),
        updated_at = excluded.updated_at
    `).run(runId, url, pageKind, sourceKey, discoveredFromPageId, now, now);
    return (this.database.prepare("SELECT id FROM source_pages WHERE run_id = ? AND url = ?").get(runId, url) as { id: number }).id;
  }

  pendingPages(runId: string, kinds: PageKind[], limit: number, maxAttempts: number): SourcePageRow[] {
    const placeholders = kinds.map(() => "?").join(",");
    return this.database.prepare(`
      SELECT id, run_id, url, resolved_url, page_kind, source_key, status, etag, last_modified, local_path, content_sha256, attempt_count
      FROM source_pages
      WHERE run_id = ? AND page_kind IN (${placeholders})
        AND status IN ('pending', 'failed') AND attempt_count < ?
      ORDER BY id LIMIT ?
    `).all(runId, ...kinds, maxAttempts, limit) as SourcePageRow[];
  }

  markPageFetching(id: number): void {
    this.database.prepare(`
      UPDATE source_pages SET status = 'fetching', attempt_count = attempt_count + 1, updated_at = ? WHERE id = ?
    `).run(nowIso(), id);
  }

  completePage(id: number, result: FetchedResult, sourceKey?: string | null): void {
    const now = nowIso();
    this.database.prepare(`
      UPDATE source_pages SET status = 'success', resolved_url = ?, http_status = ?, content_type = ?, etag = ?,
        last_modified = ?, content_sha256 = ?, local_path = ?, source_key = COALESCE(source_key, ?),
        error_code = NULL, error_message = NULL, fetched_at = ?, updated_at = ? WHERE id = ?
    `).run(
      result.resolvedUrl, result.httpStatus, result.contentType, result.etag, result.lastModified, result.sha256,
      result.localPath, sourceKey ?? null, now, now, id,
    );
  }

  markPageParsed(id: number): void {
    const now = nowIso();
    this.database.prepare("UPDATE source_pages SET parsed_at = ?, updated_at = ? WHERE id = ?").run(now, now, id);
  }

  failPage(id: number, status: "source_missing" | "failed", code: string, message: string, httpStatus?: number): void {
    this.database.prepare(`
      UPDATE source_pages SET status = ?, http_status = COALESCE(?, http_status), error_code = ?, error_message = ?, updated_at = ?
      WHERE id = ?
    `).run(status, httpStatus ?? null, code, message.slice(0, 2000), nowIso(), id);
  }

  upsertAsset(runId: string, url: string, kind: AssetKind, pageId: number, role: string): number {
    const now = nowIso();
    this.database.prepare(`
      INSERT INTO source_assets (run_id, url, asset_kind, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(run_id, url) DO UPDATE SET updated_at = excluded.updated_at
    `).run(runId, url, kind, now, now);
    const assetId = (this.database.prepare("SELECT id FROM source_assets WHERE run_id = ? AND url = ?").get(runId, url) as { id: number }).id;
    this.database.prepare(`
      INSERT OR IGNORE INTO source_page_assets (page_id, asset_id, role, created_at) VALUES (?, ?, ?, ?)
    `).run(pageId, assetId, role, now);
    return assetId;
  }

  pendingAssets(runId: string, limit: number, maxAttempts: number): SourceAssetRow[] {
    return this.database.prepare(`
      SELECT id, run_id, url, asset_kind, status, etag, last_modified, local_path, content_sha256, attempt_count
      FROM source_assets WHERE run_id = ? AND status IN ('pending', 'failed') AND attempt_count < ? ORDER BY id LIMIT ?
    `).all(runId, maxAttempts, limit) as SourceAssetRow[];
  }

  markAssetFetching(id: number): void {
    this.database.prepare(`UPDATE source_assets SET status = 'fetching', attempt_count = attempt_count + 1, updated_at = ? WHERE id = ?`)
      .run(nowIso(), id);
  }

  completeAsset(id: number, result: FetchedResult, byteLength: number): void {
    const now = nowIso();
    this.database.prepare(`
      UPDATE source_assets SET status = 'success', http_status = ?, content_type = ?, byte_length = ?, etag = ?,
        last_modified = ?, content_sha256 = ?, local_path = ?, error_code = NULL, error_message = NULL,
        fetched_at = ?, updated_at = ? WHERE id = ?
    `).run(
      result.httpStatus, result.contentType, byteLength, result.etag, result.lastModified, result.sha256,
      result.localPath, now, now, id,
    );
    this.linkCompletedAsset(id);
  }

  private linkCompletedAsset(assetId: number): void {
    this.database.prepare(`
      UPDATE pronunciations SET pinyin_audio_asset_id = ?
      WHERE id IN (
        SELECT pronunciation.id FROM pronunciations pronunciation
        JOIN characters character ON character.id = pronunciation.character_id
        JOIN source_characters source_character ON source_character.id = character.source_character_id
        JOIN source_page_assets page_asset ON page_asset.page_id = source_character.source_page_id
        WHERE page_asset.asset_id = ? AND page_asset.role = 'pinyin:' || pronunciation.pinyin
      )
    `).run(assetId, assetId);
    this.database.prepare(`
      UPDATE pronunciations SET zhuyin_audio_asset_id = ?
      WHERE id IN (
        SELECT pronunciation.id FROM pronunciations pronunciation
        JOIN characters character ON character.id = pronunciation.character_id
        JOIN source_characters source_character ON source_character.id = character.source_character_id
        JOIN source_page_assets page_asset ON page_asset.page_id = source_character.source_page_id
        WHERE page_asset.asset_id = ? AND page_asset.role = 'zhuyin:' || pronunciation.zhuyin
      )
    `).run(assetId, assetId);
    this.database.prepare(`
      UPDATE book_pages SET image_asset_id = ?
      WHERE source_page_id IN (
        SELECT page_id FROM source_page_assets WHERE asset_id = ? AND role = 'book_scan'
      )
    `).run(assetId, assetId);
  }

  failAsset(id: number, status: "source_missing" | "failed", code: string, message: string, httpStatus?: number): void {
    this.database.prepare(`
      UPDATE source_assets SET status = ?, http_status = COALESCE(?, http_status), error_code = ?, error_message = ?, updated_at = ?
      WHERE id = ?
    `).run(status, httpStatus ?? null, code, message.slice(0, 2000), nowIso(), id);
  }

  replaceIndexData(pageId: number, runId: string, groups: IndexGroup[], entries: IndexEntry[]): void {
    const now = nowIso();
    this.database.transaction(() => {
      this.database.prepare("DELETE FROM source_index_groups WHERE page_id = ?").run(pageId);
      this.database.prepare("DELETE FROM source_index_entries WHERE page_id = ?").run(pageId);
      const groupStatement = this.database.prepare(`
        INSERT INTO source_index_groups (page_id, group_kind, group_key, declared_count, discovered_count, seo_declared_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const group of groups) groupStatement.run(
        pageId, group.kind, group.key, group.declaredCount, group.discoveredCount, group.seoDeclaredCount, now, now,
      );
      const entryStatement = this.database.prepare(`
        INSERT INTO source_index_entries (
          run_id, page_id, character_url, source_character_id, glyph, pinyin, stroke_count, element, auspiciousness, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const entry of entries) entryStatement.run(
        runId, pageId, entry.characterUrl, entry.sourceCharacterId, entry.glyph, entry.pinyin,
        entry.strokeCount, entry.element, entry.auspiciousness, now, now,
      );
    })();
  }

  counts(runId: string): Record<string, number> {
    const page = this.database.prepare(`
      SELECT COUNT(*) total,
        SUM(status = 'success') success,
        SUM(status = 'failed') failed,
        SUM(status = 'source_missing') source_missing,
        SUM(status = 'pending') pending
      FROM source_pages WHERE run_id = ?
    `).get(runId) as Record<string, number | null>;
    const assets = this.database.prepare(`
      SELECT COUNT(*) total, SUM(status = 'success') success, SUM(status = 'failed') failed,
        SUM(status = 'source_missing') source_missing, SUM(status = 'pending') pending
      FROM source_assets WHERE run_id = ?
    `)
      .get(runId) as Record<string, number | null>;
    return {
      pagesTotal: page.total ?? 0,
      pagesSuccess: page.success ?? 0,
      pagesFailed: page.failed ?? 0,
      pagesSourceMissing: page.source_missing ?? 0,
      pagesPending: page.pending ?? 0,
      assetsTotal: assets.total ?? 0,
      assetsSuccess: assets.success ?? 0,
      assetsFailed: assets.failed ?? 0,
      assetsSourceMissing: assets.source_missing ?? 0,
      assetsPending: assets.pending ?? 0,
    };
  }
}
