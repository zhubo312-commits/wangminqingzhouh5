import { afterEach, describe, expect, it } from "vitest";
import type { KangxiDatabase } from "./database.js";
import { createKangxiDatabase } from "./database.js";

const databases: KangxiDatabase[] = [];
afterEach(() => { for (const database of databases.splice(0)) database.close(); });

describe("Kangxi SQLite schema", () => {
  it("migrates from scratch with foreign keys and FTS5 enabled", () => {
    const database = createKangxiDatabase(":memory:");
    databases.push(database);
    expect((database.raw.prepare("SELECT COUNT(*) count FROM schema_migrations").get() as { count: number }).count).toBe(7);
    expect(database.raw.pragma("foreign_keys", { simple: true })).toBe(1);
    database.raw.prepare("INSERT INTO characters_fts (character_id, glyph, pinyin, summary, content) VALUES ('1', '辰', 'chén', '星辰', '康熙正文')")
      .run();
    expect(database.raw.prepare("SELECT glyph FROM characters_fts WHERE characters_fts MATCH '星辰'").get()).toEqual({ glyph: "辰" });
  });

  it("enforces unique source URLs and valid element values", () => {
    const database = createKangxiDatabase(":memory:");
    databases.push(database);
    const now = new Date().toISOString();
    database.raw.prepare("INSERT INTO dataset_releases (id, schema_version, parser_version, status, source_base_url, authorization_basis, created_at, updated_at) VALUES ('r', 'v', 'p', 'candidate', 'https://example.test', 'test', ?, ?)").run(now, now);
    database.raw.prepare("INSERT INTO crawl_runs (id, release_id, mode, status, config_json, created_at, updated_at) VALUES ('run', 'r', 'pilot', 'pending', '{}', ?, ?)").run(now, now);
    const insert = database.raw.prepare("INSERT INTO source_pages (run_id, url, page_kind, created_at, updated_at) VALUES ('run', 'https://example.test/a', 'character', ?, ?)");
    insert.run(now, now);
    expect(() => insert.run(now, now)).toThrow();
  });
});
