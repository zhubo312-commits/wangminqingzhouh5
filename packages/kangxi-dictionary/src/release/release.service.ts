import { chmodSync, constants, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import type { KangxiConfig } from "../shared/config.js";
import { nowIso } from "../shared/database.js";
import { ReleaseError } from "../shared/errors.js";
import { walkFiles } from "../shared/fs.js";
import { sha256, sha256File } from "../shared/hash.js";
import type { Logger } from "../shared/logger.js";
import { ValidationService } from "../validation/validation.service.js";

export interface ReleaseResult {
  releaseId: string;
  directory: string;
  database: string;
  manifest: string;
  checksums: string;
  counts: { characters: number; pages: number; assets: number };
}

export class ReleaseService {
  constructor(
    private readonly database: BetterSqlite3.Database,
    private readonly config: KangxiConfig,
    private readonly validationService: ValidationService,
    private readonly logger: Logger,
  ) {}

  async release(releaseId: string): Promise<ReleaseResult> {
    const releaseRow = this.database.prepare("SELECT status FROM dataset_releases WHERE id = ?")
      .get(releaseId) as { status: string } | undefined;
    if (!releaseRow) throw new ReleaseError("Candidate release does not exist", { releaseId });
    if (releaseRow.status !== "candidate") throw new ReleaseError("Only candidate releases can be published", { releaseId, status: releaseRow.status });
    this.prepareOfficialNamingSubset(releaseId);
    const validation = this.validationService.validate(releaseId);
    if (!validation.passed) throw new ReleaseError("Validation gates did not pass", {
      releaseId, integrity: validation.integrity, foreignKeyViolations: validation.foreignKeyViolations,
      issues: validation.issues,
    });

    mkdirSync(this.config.releasesRoot, { recursive: true });
    const finalDirectory = path.join(this.config.releasesRoot, releaseId);
    if (existsSync(finalDirectory)) throw new ReleaseError("Release directory already exists", { finalDirectory });
    const temporaryDirectory = mkdtempSync(path.join(this.config.releasesRoot, `.candidate-${releaseId}-`));
    const snapshotPath = path.join(temporaryDirectory, "kangxi.sqlite");
    const now = nowIso();
    const counts = this.counts(releaseId);
    try {
      this.database.transaction(() => {
        this.database.prepare(`
          UPDATE canonical_profiles SET confidence_status = 'verified', updated_at = ?
          WHERE character_id IN (SELECT id FROM characters WHERE release_id = ? AND canonical_status = 'accepted')
        `).run(now, releaseId);
        this.database.prepare(`
          UPDATE dataset_releases SET status = 'released', character_count = ?, page_count = ?, asset_count = ?,
            released_at = ?, updated_at = ? WHERE id = ?
        `).run(counts.characters, counts.pages, counts.assets, now, now, releaseId);
      })();
      this.database.pragma("wal_checkpoint(FULL)");
      await this.database.backup(snapshotPath);
      this.copyReferencedArtifacts(releaseId, temporaryDirectory);
      const manifestData = {
        releaseId,
        schemaVersion: this.config.schemaVersion,
        parserVersion: this.config.parserVersion,
        sourceBaseUrl: this.config.baseUrl,
        authorizationBasis: "user-confirmed authorized archival",
        createdAt: now,
        counts,
        validation: {
          reportJson: validation.reportJsonPath,
          reportHtml: validation.reportHtmlPath,
          integrity: validation.integrity,
          foreignKeyViolations: validation.foreignKeyViolations,
          issues: validation.issues,
        },
        storage: "SQLite snapshot plus content-addressed raw pages and media",
      };
      const manifestText = `${JSON.stringify(manifestData, null, 2)}\n`;
      const manifestPath = path.join(temporaryDirectory, "manifest.json");
      writeFileSync(manifestPath, manifestText, "utf8");
      const manifestSha = sha256(manifestText);
      const snapshot = new BetterSqlite3(snapshotPath);
      try {
        snapshot.prepare("UPDATE dataset_releases SET manifest_sha256 = ? WHERE id = ?").run(manifestSha, releaseId);
        snapshot.pragma("wal_checkpoint(TRUNCATE)");
      } finally {
        snapshot.close();
      }
      this.database.prepare("UPDATE dataset_releases SET manifest_sha256 = ?, updated_at = ? WHERE id = ?")
        .run(manifestSha, nowIso(), releaseId);
      const checksumPath = path.join(temporaryDirectory, "SHA256SUMS");
      const checksumLines = walkFiles(temporaryDirectory)
        .filter((file) => file !== checksumPath && !file.endsWith("-wal") && !file.endsWith("-shm"))
        .map((file) => `${sha256File(file)}  ${path.relative(temporaryDirectory, file)}`);
      writeFileSync(checksumPath, `${checksumLines.join("\n")}\n`, "utf8");
      for (const file of walkFiles(temporaryDirectory)) chmodSync(file, 0o444);
      renameSync(temporaryDirectory, finalDirectory);
      this.logger.info("Kangxi dataset released", { releaseId, finalDirectory, ...counts });
      return {
        releaseId,
        directory: finalDirectory,
        database: path.join(finalDirectory, "kangxi.sqlite"),
        manifest: path.join(finalDirectory, "manifest.json"),
        checksums: path.join(finalDirectory, "SHA256SUMS"),
        counts,
      };
    } catch (error) {
      if (existsSync(temporaryDirectory)) rmSync(temporaryDirectory, { recursive: true, force: true });
      this.database.transaction(() => {
        this.database.prepare("UPDATE dataset_releases SET status = 'candidate', released_at = NULL, manifest_sha256 = NULL, updated_at = ? WHERE id = ?")
          .run(nowIso(), releaseId);
      })();
      if (error instanceof ReleaseError) throw error;
      throw new ReleaseError("Failed to build release artifact", {
        releaseId,
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private counts(releaseId: string): { characters: number; pages: number; assets: number } {
    const characters = (this.database.prepare("SELECT COUNT(*) count FROM characters WHERE release_id = ? AND canonical_status = 'accepted'")
      .get(releaseId) as { count: number }).count;
    const pages = (this.database.prepare(`
      SELECT COUNT(*) count FROM source_pages p JOIN crawl_runs r ON r.id = p.run_id
      WHERE r.release_id = ? AND p.status = 'success'
    `).get(releaseId) as { count: number }).count;
    const assets = (this.database.prepare(`
      SELECT COUNT(*) count FROM source_assets a JOIN crawl_runs r ON r.id = a.run_id
      WHERE r.release_id = ? AND a.status = 'success'
    `).get(releaseId) as { count: number }).count;
    return { characters, pages, assets };
  }

  private prepareOfficialNamingSubset(releaseId: string): void {
    const now = nowIso();
    this.database.transaction(() => {
      this.database.prepare(`
        UPDATE characters SET
          canonical_status = CASE WHEN codepoint BETWEEN 19968 AND 40959 AND EXISTS (
            SELECT 1 FROM canonical_profiles cp WHERE cp.character_id = characters.id
              AND cp.primary_pinyin IS NOT NULL AND cp.plain_pinyin IS NOT NULL
              AND cp.naming_strokes > 0 AND cp.strict_kangxi_strokes > 0
              AND cp.element IN ('金', '木', '水', '火', '土')
          ) THEN 'accepted' ELSE 'quarantined' END,
          absence_reason = CASE WHEN codepoint BETWEEN 19968 AND 40959 AND EXISTS (
            SELECT 1 FROM canonical_profiles cp WHERE cp.character_id = characters.id
              AND cp.primary_pinyin IS NOT NULL AND cp.plain_pinyin IS NOT NULL
              AND cp.naming_strokes > 0 AND cp.strict_kangxi_strokes > 0
              AND cp.element IN ('金', '木', '水', '火', '土')
          ) THEN NULL ELSE COALESCE(absence_reason, 'not_in_official_xingming_subset') END,
          updated_at = ? WHERE release_id = ?
      `).run(now, releaseId);
      this.database.prepare(`
        UPDATE canonical_profiles SET confidence_status = CASE
          WHEN character_id IN (SELECT id FROM characters WHERE release_id = ? AND canonical_status = 'accepted')
            THEN 'verified' ELSE 'unverified' END,
          updated_at = ? WHERE character_id IN (SELECT id FROM characters WHERE release_id = ?)
      `).run(releaseId, now, releaseId);
    })();
  }

  private copyReferencedArtifacts(releaseId: string, targetRoot: string): void {
    const rows = this.database.prepare(`
      SELECT p.local_path FROM source_pages p JOIN crawl_runs r ON r.id = p.run_id
      WHERE r.release_id = ? AND p.status = 'success' AND p.local_path IS NOT NULL
      UNION
      SELECT a.local_path FROM source_assets a JOIN crawl_runs r ON r.id = a.run_id
      WHERE r.release_id = ? AND a.status = 'success' AND a.local_path IS NOT NULL
      UNION
      SELECT rdf.local_path FROM reference_dataset_files rdf
      JOIN reference_datasets rd ON rd.id = rdf.reference_dataset_id
      JOIN reference_observations ro ON ro.reference_dataset_id = rd.id
      WHERE ro.release_id = ?
    `).all(releaseId, releaseId, releaseId) as Array<{ local_path: string }>;
    for (const row of rows) this.copyRelative(row.local_path, targetRoot);
    for (const report of [
      path.join("work", "reports", releaseId, "validation.json"),
      path.join("work", "reports", releaseId, "validation.html"),
      path.join("work", "reports", releaseId, "stroke-missing-basic.csv"),
      path.join("work", "reports", releaseId, "stroke-missing-common.csv"),
    ]) if (existsSync(path.join(this.config.dataRoot, report))) this.copyRelative(report, targetRoot);
  }

  private copyRelative(relative: string, targetRoot: string): void {
    const source = path.resolve(this.config.dataRoot, relative);
    const allowedRoot = `${path.resolve(this.config.dataRoot)}${path.sep}`;
    if (!source.startsWith(allowedRoot)) throw new ReleaseError("Artifact path escapes data root", { relative });
    const target = path.join(targetRoot, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(source, target, constants.COPYFILE_FICLONE);
  }
}
