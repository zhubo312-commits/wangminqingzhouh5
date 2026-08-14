import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CharacterRepository } from "../characters/character.repository.js";
import { CrawlRepository } from "../crawl/crawl.repository.js";
import { QueryService } from "../query/query.service.js";
import { createKangxiDatabase, type KangxiDatabase } from "../shared/database.js";
import { sha256 } from "../shared/hash.js";
import { parsedCharacter, testConfig } from "../test/fixture.js";
import { ValidationService } from "../validation/validation.service.js";
import { UnihanService } from "./unihan.service.js";

const roots: string[] = [];
const databases: KangxiDatabase[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("UnihanService", () => {
  it("archives observations and only promotes safe pinyin and modern stroke fields", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "kangxi-unihan-"));
    roots.push(root);
    const config = testConfig(root);
    const database = createKangxiDatabase(config.databasePath);
    databases.push(database);
    const crawl = new CrawlRepository(database.raw);
    crawl.ensureRelease("r-unihan", config.schemaVersion, config.parserVersion, config.baseUrl);
    crawl.ensureRun("run-unihan", "r-unihan", "pilot", {});
    const characters = new CharacterRepository(database.raw);
    persistCharacter(crawl, characters, root, "run-unihan", "r-unihan", "9633", "阳", {
      pinyin: [],
      zhuyin: [],
      modernStrokes: null,
      websiteNamingStrokes: 12,
      strictKangxiStrokes: [],
    });
    persistCharacter(crawl, characters, root, "run-unihan", "r-unihan", "967D", "陽", {
      pinyin: [{ value: "yáng", audioUrl: null }],
      modernStrokes: 17,
      websiteNamingStrokes: 17,
      strictKangxiStrokes: [{ glyph: "陽", strokes: 17 }],
    });

    const source = path.join(root, "unihan-source");
    mkdirSync(source, { recursive: true });
    writeFileSync(path.join(source, "Unihan_Readings.txt"), [
      "# fixture",
      "U+9633\tkMandarin\tyáng",
      "U+9633\tkHanyuPinyin\t12345.010:yáng,yǎng",
    ].join("\n"));
    writeFileSync(path.join(source, "Unihan_IRGSources.txt"), [
      "U+9633\tkTotalStrokes\t6",
      "U+967D\tkTotalStrokes\t17",
      "U+967D\tkAlternateTotalStrokes\t-",
      "U+967D\tkIRGKangXi\t0738.010",
    ].join("\n"));
    writeFileSync(path.join(source, "Unihan_DictionaryLikeData.txt"), "U+9633\tkKangXi\t0738.010\n");
    writeFileSync(path.join(source, "Unihan_Variants.txt"), [
      "U+9633\tkTraditionalVariant\tU+967D",
      "U+967D\tkSimplifiedVariant\tU+9633",
    ].join("\n"));

    const service = new UnihanService(database.raw, config);
    const first = service.import("r-unihan", {
      sourcePath: source,
      version: "17.0.0",
      promoteSafe: true,
    });
    expect(first.promoted).toEqual({ primaryPinyin: 1, modernStrokes: 1 });
    expect(first.canonicalDecisions).toEqual({ primaryPinyin: 1, modernStrokes: 1 });
    expect(first.formRelationsStored).toBe(2);
    expect(first.conflicts.modernStrokes).toBe(0);
    expect(database.raw.prepare(`
      SELECT cp.primary_pinyin, cp.modern_strokes, cp.naming_strokes, cp.strict_kangxi_strokes
      FROM characters c JOIN canonical_profiles cp ON cp.character_id = c.id
      WHERE c.release_id = 'r-unihan' AND c.glyph = '阳'
    `).get()).toEqual({
      primary_pinyin: "yáng",
      modern_strokes: 6,
      naming_strokes: 12,
      strict_kangxi_strokes: null,
    });
    const query = new QueryService(database.raw).character("阳", "r-unihan") as {
      referenceObservations: Array<{ property_name: string }>;
    };
    expect(query.referenceObservations.map((row) => row.property_name).sort()).toEqual([
      "kHanyuPinyin",
      "kKangXi",
      "kMandarin",
      "kTotalStrokes",
      "kTraditionalVariant",
    ]);
    expect(database.raw.prepare(`
      SELECT COUNT(*) count FROM stroke_observations WHERE source_name = ? AND stroke_kind = 'strict_kangxi'
    `).get(first.referenceDatasetId)).toEqual({ count: 0 });
    new ValidationService(database.raw, config).validate("r-unihan");
    expect(database.raw.prepare(`
      SELECT COUNT(*) count FROM validation_issues WHERE code = 'AUTO_REFERENCE_OBSERVATION_INVALID'
    `).get()).toEqual({ count: 0 });

    const countsBefore = tableCounts(database, first.referenceDatasetId);
    const second = service.import("r-unihan", { sourcePath: source, version: "17.0.0", promoteSafe: true });
    expect(second.canonicalDecisions).toEqual({ primaryPinyin: 1, modernStrokes: 1 });
    expect(tableCounts(database, first.referenceDatasetId)).toEqual(countsBefore);
  });
});

function persistCharacter(
  crawl: CrawlRepository,
  characters: CharacterRepository,
  root: string,
  runId: string,
  releaseId: string,
  sourceId: string,
  glyph: string,
  overrides: Parameters<typeof parsedCharacter>[0],
): void {
  const url = `https://www.kangxizidian.cn/kangxi/${sourceId}.html`;
  const pageId = crawl.upsertPage(runId, url, "character", sourceId);
  const relative = `work/raw/pages/character/${sourceId}.html`;
  mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
  writeFileSync(path.join(root, relative), glyph);
  crawl.completePage(pageId, {
    resolvedUrl: url,
    httpStatus: 200,
    contentType: "text/html",
    etag: null,
    lastModified: null,
    sha256: sha256(glyph),
    localPath: relative,
  });
  characters.persist(runId, releaseId, pageId, parsedCharacter({
    sourceCharacterId: sourceId,
    sourceUrl: url,
    glyph,
    codepoint: glyph.codePointAt(0)!,
    rawFields: {},
    ...overrides,
  }));
}

function tableCounts(database: KangxiDatabase, sourceName: string): Record<string, number> {
  const count = (table: string): number => (database.raw.prepare(
    `SELECT COUNT(*) count FROM ${table} WHERE ${table === "reference_observations" ? "reference_dataset_id" : "source_name"} = ?`,
  ).get(sourceName) as { count: number }).count;
  return {
    referenceObservations: count("reference_observations"),
    pronunciations: count("pronunciations"),
    strokeObservations: count("stroke_observations"),
    characterForms: count("character_forms"),
    canonicalDecisions: (database.raw.prepare(`
      SELECT COUNT(*) count FROM canonical_decisions WHERE decided_by = ?
    `).get(sourceName) as { count: number }).count,
  };
}
