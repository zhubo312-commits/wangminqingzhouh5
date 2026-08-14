import type BetterSqlite3 from "better-sqlite3";
import type { ParsedScanPage } from "../domain/types.js";
import { nowIso } from "../shared/database.js";

export class BookRepository {
  constructor(private readonly database: BetterSqlite3.Database) {}

  persist(releaseId: string, sourcePageId: number, parsed: ParsedScanPage): void {
    const now = nowIso();
    this.database.transaction(() => {
      this.database.prepare(`
        INSERT INTO book_editions (release_id, edition_key, title, source_base_url, created_at, updated_at)
        VALUES (?, ?, ?, 'https://www.kangxizidian.cn/tupian/', ?, ?)
        ON CONFLICT(release_id, edition_key) DO UPDATE SET title = excluded.title, updated_at = excluded.updated_at
      `).run(releaseId, parsed.editionKey, parsed.title, now, now);
      const editionId = (this.database.prepare("SELECT id FROM book_editions WHERE release_id = ? AND edition_key = ?")
        .get(releaseId, parsed.editionKey) as { id: number }).id;
      const imageAsset = parsed.imageUrl
        ? this.database.prepare("SELECT id FROM source_assets WHERE url = ? ORDER BY id DESC LIMIT 1").get(parsed.imageUrl) as { id: number } | undefined
        : undefined;
      this.database.prepare(`
        INSERT INTO book_pages (
          edition_id, page_number, source_page_id, image_asset_id, source_url, previous_url, next_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(edition_id, page_number) DO UPDATE SET
          source_page_id = excluded.source_page_id, image_asset_id = COALESCE(excluded.image_asset_id, book_pages.image_asset_id),
          source_url = excluded.source_url, previous_url = excluded.previous_url, next_url = excluded.next_url,
          updated_at = excluded.updated_at
      `).run(
        editionId, parsed.pageNumber, sourcePageId, imageAsset?.id ?? null,
        `https://www.kangxizidian.cn/tupian/${parsed.editionKey}_${parsed.pageNumber}.html`,
        parsed.previousUrl, parsed.nextUrl, now, now,
      );
      const bookPageId = (this.database.prepare("SELECT id FROM book_pages WHERE edition_id = ? AND page_number = ?")
        .get(editionId, parsed.pageNumber) as { id: number }).id;
      this.database.prepare(`
        UPDATE scan_references SET book_page_id = ?, updated_at = ?
        WHERE edition_key = ? AND page_number = ?
      `).run(bookPageId, now, parsed.editionKey, parsed.pageNumber);
    })();
  }
}
