import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { CharacterRepository } from "../characters/character.repository.js";
import { CrawlRepository } from "../crawl/crawl.repository.js";
import { ProjectionService } from "../projection/projection.service.js";
import { createKangxiDatabase, type KangxiDatabase } from "../shared/database.js";
import { sha256 } from "../shared/hash.js";
import { createLogger } from "../shared/logger.js";
import { parsedCharacter, testConfig } from "../test/fixture.js";
import { ValidationService } from "../validation/validation.service.js";
import { ReleaseService } from "./release.service.js";
import { ValidationFailedError } from "../shared/errors.js";

const roots: string[] = [];
const databases: KangxiDatabase[] = [];
afterEach(() => {
  for (const database of databases.splice(0)) database.close();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("ReleaseService", () => {
  it("atomically publishes a self-contained snapshot and projects reviewed rows", async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "kangxi-release-"));
    roots.push(root);
    const config = testConfig(root);
    const database = createKangxiDatabase(config.databasePath);
    databases.push(database);
    const crawl = new CrawlRepository(database.raw);
    crawl.ensureRelease("kangxi-cn-test.r1", config.schemaVersion, config.parserVersion, config.baseUrl);
    crawl.ensureRun("run1", "kangxi-cn-test.r1", "pilot", {});
    const pageUrl = "https://www.kangxizidian.cn/kangxi/23394.html";
    const pageId = crawl.upsertPage("run1", pageUrl, "character", "23394");
    const relative = "work/raw/pages/character/source.html";
    mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    writeFileSync(path.join(root, relative), "source");
    crawl.completePage(pageId, {
      resolvedUrl: pageUrl, httpStatus: 200, contentType: "text/html", etag: null, lastModified: null,
      sha256: sha256("source"), localPath: relative,
    });
    new CharacterRepository(database.raw).persist("run1", "kangxi-cn-test.r1", pageId, parsedCharacter());
    expect(database.raw.prepare(`
      SELECT content_kind, absence_reason FROM source_content_absences ORDER BY content_kind
    `).all()).toEqual([
      { content_kind: "modern_dictionary", absence_reason: "source_page_does_not_declare_content" },
      { content_kind: "shuowen", absence_reason: "source_page_does_not_declare_content" },
    ]);
    const validation = new ValidationService(database.raw, config);
    const result = await new ReleaseService(database.raw, config, validation, createLogger("error"))
      .release("kangxi-cn-test.r1");
    expect(existsSync(result.database)).toBe(true);
    expect(readFileSync(result.checksums, "utf8")).toContain("kangxi.sqlite");
    const snapshot = new BetterSqlite3(result.database, { readonly: true });
    try {
      expect(snapshot.prepare("SELECT status, character_count FROM dataset_releases WHERE id = ?").get("kangxi-cn-test.r1"))
        .toEqual({ status: "released", character_count: 1 });
    } finally { snapshot.close(); }
    const projection = new ProjectionService(database.raw, config).project("kangxi-cn-test.r1");
    expect(projection.rows).toBe(1);
    expect(readFileSync(projection.sqlPath, "utf8")).toContain("INSERT INTO chinese_dictionary");
    expect(readFileSync(projection.sqlPath, "utf8")).toContain("INSERT INTO chinese_dictionary_alias");
  });

  it("refuses a chinese_dictionary projection when a required canonical value is absent", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "kangxi-projection-missing-"));
    roots.push(root);
    const config = testConfig(root);
    const database = createKangxiDatabase(config.databasePath);
    databases.push(database);
    const crawl = new CrawlRepository(database.raw);
    crawl.ensureRelease("r-missing", config.schemaVersion, config.parserVersion, config.baseUrl);
    crawl.ensureRun("run-missing", "r-missing", "pilot", {});
    const pageId = crawl.upsertPage("run-missing", "https://www.kangxizidian.cn/kangxi/23394.html", "character", "23394");
    new CharacterRepository(database.raw).persist("run-missing", "r-missing", pageId, parsedCharacter({ strictKangxiStrokes: [] }));
    database.raw.prepare("UPDATE dataset_releases SET status = 'released'").run();
    database.raw.prepare("UPDATE characters SET canonical_status = 'accepted'").run();
    expect(() => new ProjectionService(database.raw, config).project("r-missing"))
      .toThrow(ValidationFailedError);
  });
});
