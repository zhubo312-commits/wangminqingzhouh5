import { afterEach, describe, expect, it } from "vitest";
import { CrawlRepository } from "../crawl/crawl.repository.js";
import { createKangxiDatabase, type KangxiDatabase } from "../shared/database.js";
import { parsedCharacter } from "../test/fixture.js";
import { CharacterRepository } from "./character.repository.js";

const databases: KangxiDatabase[] = [];
afterEach(() => { for (const database of databases.splice(0)) database.close(); });

describe("CharacterRepository form reconciliation", () => {
  it("links a form candidate in one linear rebuild even when its target arrived later", () => {
    const database = createKangxiDatabase(":memory:");
    databases.push(database);
    const crawl = new CrawlRepository(database.raw);
    crawl.ensureRelease("r1", "v1", "p1", "https://example.test");
    crawl.ensureRun("run1", "r1", "full", {});
    const repository = new CharacterRepository(database.raw);

    const simplifiedPage = crawl.upsertPage("run1", "https://example.test/kangxi/1.html", "character", "1");
    repository.persist("run1", "r1", simplifiedPage, parsedCharacter({
      sourceCharacterId: "1",
      sourceUrl: "https://example.test/kangxi/1.html",
      glyph: "阳",
      codepoint: "阳".codePointAt(0)!,
      formCandidates: [{ glyph: "陽", relationType: "traditional" }],
    }));
    const traditionalPage = crawl.upsertPage("run1", "https://example.test/kangxi/2.html", "character", "2");
    repository.persist("run1", "r1", traditionalPage, parsedCharacter({
      sourceCharacterId: "2",
      sourceUrl: "https://example.test/kangxi/2.html",
      glyph: "陽",
      codepoint: "陽".codePointAt(0)!,
      formCandidates: [],
    }));

    expect(repository.rebuildForms("r1")).toBe(1);
    expect(database.raw.prepare(`
      SELECT source.glyph source, target.glyph target, forms.relation_type relation
      FROM character_forms forms
      JOIN characters source ON source.id = forms.from_character_id
      JOIN characters target ON target.id = forms.to_character_id
    `).get()).toEqual({ source: "阳", target: "陽", relation: "traditional" });
    expect(database.raw.prepare(`
      SELECT field_name, selected_value_json, rule_code
      FROM canonical_decisions
      WHERE release_id = 'r1' AND character_id = (
        SELECT id FROM characters WHERE release_id = 'r1' AND glyph = '阳'
      )
      ORDER BY field_name
    `).all()).toEqual([
      {
        field_name: "naming_strokes",
        selected_value_json: "7",
        rule_code: "KANGXI_CN_WEBSITE_NAMING_STROKES",
      },
      {
        field_name: "strict_kangxi_strokes",
        selected_value_json: "7",
        rule_code: "KANGXI_CN_WEBSITE_STRICT_KANGXI_STROKES",
      },
    ]);
  });
});
