import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CharacterRepository } from "../characters/character.repository.js";
import { CrawlRepository } from "../crawl/crawl.repository.js";
import { createKangxiDatabase, type KangxiDatabase } from "../shared/database.js";
import { sha256 } from "../shared/hash.js";
import { parsedCharacter, testConfig } from "../test/fixture.js";
import { IssueService } from "./issue.service.js";
import { ValidationService } from "./validation.service.js";

const roots: string[] = [];
const databases: KangxiDatabase[] = [];
afterEach(() => {
  for (const database of databases.splice(0)) database.close();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("ValidationService", () => {
  it("blocks a same-glyph mismatch between website naming and Kangxi strokes", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "kangxi-validation-strokes-"));
    roots.push(root);
    const config = testConfig(root);
    const database = createKangxiDatabase(config.databasePath);
    databases.push(database);
    const crawl = new CrawlRepository(database.raw);
    crawl.ensureRelease("r-strokes", config.schemaVersion, config.parserVersion, config.baseUrl);
    crawl.ensureRun("run-strokes", "r-strokes", "pilot", {});
    const pageId = crawl.upsertPage("run-strokes", "https://www.kangxizidian.cn/kangxi/1.html", "character", "1");
    new CharacterRepository(database.raw).persist("run-strokes", "r-strokes", pageId, parsedCharacter({
      websiteNamingStrokes: 7,
      strictKangxiStrokes: [{ glyph: "辰", strokes: 8 }],
    }));
    const summary = new ValidationService(database.raw, config).validate("r-strokes");
    expect(summary.strokePolicy).toMatchObject({ bothAvailable: 1, conflicts: 1 });
    expect(database.raw.prepare(`
      SELECT severity FROM validation_issues
      WHERE code = 'AUTO_WEBSITE_NAMING_KANGXI_STROKE_CONFLICT'
    `).get()).toEqual({ severity: "error" });
  });

  it("records structured-versus-text element conflicts without overwriting source evidence", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "kangxi-validation-"));
    roots.push(root);
    const config = testConfig(root);
    const database = createKangxiDatabase(config.databasePath);
    databases.push(database);
    const crawl = new CrawlRepository(database.raw);
    crawl.ensureRelease("r1", config.schemaVersion, config.parserVersion, config.baseUrl);
    crawl.ensureRun("run1", "r1", "pilot", {});
    const pageId = crawl.upsertPage("run1", "https://www.kangxizidian.cn/kangxi/1.html", "character", "1");
    const relative = "work/raw/pages/character/source.html";
    mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    writeFileSync(path.join(root, relative), "source");
    crawl.completePage(pageId, {
      resolvedUrl: "https://www.kangxizidian.cn/kangxi/1.html", httpStatus: 200, contentType: "text/html",
      etag: null, lastModified: null, sha256: sha256("source"), localPath: relative,
    });
    new CharacterRepository(database.raw).persist("run1", "r1", pageId, parsedCharacter({
      sourceCharacterId: "1", sourceUrl: "https://www.kangxizidian.cn/kangxi/1.html", glyph: "一", codepoint: 0x4e00,
      radical: "一", radicalName: "一部", modernStrokes: 1, websiteNamingStrokes: 1,
      strictKangxiStrokes: [{ glyph: "一", strokes: 1 }], radicalStrokes: 1, wubi: "ggll",
      pinyin: [{ value: "yī", audioUrl: null }], zhuyin: [{ value: "ㄧ", audioUrl: null }],
      naming: { ...parsedCharacter().naming, element: "土", taboosText: "一字五行属性为水。" },
    }));
    const summary = new ValidationService(database.raw, config).validate("r1");
    expect(summary.passed).toBe(true);
    const issue = database.raw.prepare("SELECT severity, observed_json FROM validation_issues WHERE code = 'AUTO_ELEMENT_TEXT_CONFLICT'").get() as { severity: string; observed_json: string };
    expect(issue.severity).toBe("info");
    expect(JSON.parse(issue.observed_json)).toEqual({ structured: "土", tabooText: "水" });
    const issueId = (database.raw.prepare("SELECT id FROM validation_issues WHERE code = 'AUTO_ELEMENT_TEXT_CONFLICT'").get() as { id: number }).id;
    new IssueService(database.raw).resolve(issueId, "structured field reviewed");
    database.raw.prepare("UPDATE naming_profiles SET element = '木'").run();
    new ValidationService(database.raw, config).validate("r1");
    expect(database.raw.prepare("SELECT resolution_status, resolution_note FROM validation_issues WHERE id = ?").get(issueId))
      .toEqual({ resolution_status: "open", resolution_note: null });
  });

  it("detects immutable source artifacts whose bytes no longer match their recorded SHA-256", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "kangxi-validation-hash-"));
    roots.push(root);
    const config = testConfig(root);
    const database = createKangxiDatabase(config.databasePath);
    databases.push(database);
    const crawl = new CrawlRepository(database.raw);
    crawl.ensureRelease("r-hash", config.schemaVersion, config.parserVersion, config.baseUrl);
    crawl.ensureRun("run-hash", "r-hash", "pilot", {});
    const pageId = crawl.upsertPage("run-hash", "https://www.kangxizidian.cn/kangxi/23394.html", "character", "23394");
    const relative = "work/raw/pages/character/source.html";
    mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    writeFileSync(path.join(root, relative), "original");
    crawl.completePage(pageId, {
      resolvedUrl: "https://www.kangxizidian.cn/kangxi/23394.html", httpStatus: 200, contentType: "text/html",
      etag: null, lastModified: null, sha256: sha256("original"), localPath: relative,
    });
    new CharacterRepository(database.raw).persist("run-hash", "r-hash", pageId, parsedCharacter());
    writeFileSync(path.join(root, relative), "tampered");
    new ValidationService(database.raw, config).validate("r-hash");
    expect(database.raw.prepare("SELECT severity FROM validation_issues WHERE code = 'AUTO_ARTIFACT_HASH_MISMATCH'").get())
      .toEqual({ severity: "error" });
  });
});
