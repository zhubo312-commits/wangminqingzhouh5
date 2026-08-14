import type BetterSqlite3 from "better-sqlite3";
import type { ParsedCharacterPage } from "../domain/types.js";
import { nowIso } from "../shared/database.js";
import { sha256 } from "../shared/hash.js";
import { plainPinyin } from "../shared/unicode.js";

export class CharacterRepository {
  constructor(private readonly database: BetterSqlite3.Database) {}

  persist(runId: string, releaseId: string, sourcePageId: number, parsed: ParsedCharacterPage): number {
    return this.database.transaction(() => {
      const now = nowIso();
      const rawJson = JSON.stringify(parsed);
      const rawFieldsJson = JSON.stringify(parsed.rawFields);
      this.database.prepare(`
        INSERT INTO source_characters (
          run_id, source_page_id, source_character_id, source_url, glyph, codepoint, unicode_label, unicode_block,
          structure, radical, radical_name, modern_strokes, website_naming_strokes, strict_kangxi_strokes_json,
          radical_strokes, outside_strokes, wubi, cangjie, four_corner, pinyin_json, zhuyin_json,
          raw_fields_json, raw_json, content_sha256, absence_reason, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(run_id, source_character_id) DO UPDATE SET
          source_page_id = excluded.source_page_id, source_url = excluded.source_url, glyph = excluded.glyph,
          codepoint = excluded.codepoint, unicode_label = excluded.unicode_label, unicode_block = excluded.unicode_block,
          structure = excluded.structure, radical = excluded.radical, radical_name = excluded.radical_name,
          modern_strokes = excluded.modern_strokes, website_naming_strokes = excluded.website_naming_strokes,
          strict_kangxi_strokes_json = excluded.strict_kangxi_strokes_json, radical_strokes = excluded.radical_strokes,
          outside_strokes = excluded.outside_strokes, wubi = excluded.wubi, cangjie = excluded.cangjie,
          four_corner = excluded.four_corner, pinyin_json = excluded.pinyin_json, zhuyin_json = excluded.zhuyin_json,
          raw_fields_json = excluded.raw_fields_json, raw_json = excluded.raw_json, content_sha256 = excluded.content_sha256,
          absence_reason = excluded.absence_reason, updated_at = excluded.updated_at
      `).run(
        runId, sourcePageId, parsed.sourceCharacterId, parsed.sourceUrl, parsed.glyph, parsed.codepoint,
        parsed.unicodeLabel, parsed.unicodeBlock, parsed.structure, parsed.radical, parsed.radicalName,
        parsed.modernStrokes, parsed.websiteNamingStrokes, JSON.stringify(parsed.strictKangxiStrokes),
        parsed.radicalStrokes, parsed.outsideStrokes, parsed.wubi, parsed.cangjie, parsed.fourCorner,
        JSON.stringify(parsed.pinyin), JSON.stringify(parsed.zhuyin), rawFieldsJson, rawJson, sha256(rawJson),
        parsed.absenceReason, now, now,
      );
      const sourceCharacterId = (this.database.prepare(`
        SELECT id FROM source_characters WHERE run_id = ? AND source_character_id = ?
      `).get(runId, parsed.sourceCharacterId) as { id: number }).id;

      this.replaceSourceDetails(sourceCharacterId, parsed, now);
      const characterId = this.upsertCanonical(releaseId, sourceCharacterId, parsed, now);
      this.replaceCanonicalDetails(releaseId, characterId, sourceCharacterId, parsed, now);
      return characterId;
    })();
  }

  private replaceSourceDetails(sourceCharacterId: number, parsed: ParsedCharacterPage, now: string): void {
    this.database.prepare("DELETE FROM source_form_candidates WHERE source_character_id = ?").run(sourceCharacterId);
    const formCandidateStatement = this.database.prepare(`
      INSERT INTO source_form_candidates (
        source_character_id, target_glyph, relation_type, ordinal, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const [ordinal, form] of parsed.formCandidates.entries()) formCandidateStatement.run(
      sourceCharacterId, form.glyph, form.relationType, ordinal, now, now,
    );

    this.database.prepare("DELETE FROM naming_profiles WHERE source_character_id = ?").run(sourceCharacterId);
    const naming = parsed.naming;
    this.database.prepare(`
      INSERT INTO naming_profiles (
        source_character_id, recommendation_percent, culture_percent, gender_tendency, element, auspiciousness,
        common_flag, name_usage_class, name_explanation, naming_meaning, naming_implication, usage_count,
        first_character_percent, male_percent, female_percent, taboos_text, raw_json, absence_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sourceCharacterId, naming.recommendationPercent, naming.culturePercent, naming.genderTendency,
      naming.element, naming.auspiciousness, naming.commonFlag === null ? null : Number(naming.commonFlag),
      naming.nameUsageClass, naming.nameExplanation, naming.namingMeaning, naming.namingImplication,
      naming.usageCount, naming.firstCharacterPercent, naming.malePercent, naming.femalePercent,
      naming.taboosText, JSON.stringify(naming), naming.absenceReason, now, now,
    );

    this.database.prepare("DELETE FROM dictionary_sections WHERE source_character_id = ?").run(sourceCharacterId);
    const sectionStatement = this.database.prepare(`
      INSERT INTO dictionary_sections (
        source_character_id, section_type, title, ordinal, source_html, sanitized_html, plain_text,
        content_sha256, absence_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const section of parsed.sections) sectionStatement.run(
      sourceCharacterId, section.type, section.title, section.ordinal, section.sourceHtml, section.sanitizedHtml,
      section.plainText, sha256(section.plainText), null, now, now,
    );

    this.database.prepare("DELETE FROM source_content_absences WHERE source_character_id = ?").run(sourceCharacterId);
    const availableContentKinds = new Set(parsed.sections.map((section) => {
      if (section.type === "kangxi") return "kangxi";
      if (section.type.startsWith("shuowen_")) return "shuowen";
      if (section.type === "modern_dictionary") return "modern_dictionary";
      return null;
    }).filter((kind): kind is "kangxi" | "shuowen" | "modern_dictionary" => kind !== null));
    const absenceStatement = this.database.prepare(`
      INSERT INTO source_content_absences (
        source_character_id, content_kind, absence_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `);
    for (const contentKind of ["kangxi", "shuowen", "modern_dictionary"] as const) {
      if (!availableContentKinds.has(contentKind)) absenceStatement.run(
        sourceCharacterId, contentKind, "source_page_does_not_declare_content", now, now,
      );
    }

    this.database.prepare("DELETE FROM character_relations WHERE source_character_id = ?").run(sourceCharacterId);
    const relationStatement = this.database.prepare(`
      INSERT INTO character_relations (
        source_character_id, relation_type, target_source_character_id, target_glyph, target_url, ordinal, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const relation of parsed.relations) relationStatement.run(
      sourceCharacterId, relation.type, relation.targetSourceCharacterId, relation.targetGlyph,
      relation.targetUrl, relation.ordinal, now, now,
    );

    this.database.prepare("DELETE FROM scan_references WHERE source_character_id = ?").run(sourceCharacterId);
    const scanStatement = this.database.prepare(`
      INSERT INTO scan_references (
        source_character_id, edition_key, page_number, source_url, label, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const scan of parsed.scanReferences) scanStatement.run(
      sourceCharacterId, scan.editionKey, scan.pageNumber, scan.sourceUrl, scan.label, now, now,
    );
  }

  private upsertCanonical(
    releaseId: string,
    sourceCharacterId: number,
    parsed: ParsedCharacterPage,
    now: string,
  ): number {
    this.database.prepare(`
      INSERT INTO characters (
        release_id, glyph, codepoint, source_character_id, canonical_status, absence_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'candidate', ?, ?, ?)
      ON CONFLICT(release_id, glyph) DO UPDATE SET
        codepoint = excluded.codepoint, source_character_id = excluded.source_character_id,
        absence_reason = excluded.absence_reason, updated_at = excluded.updated_at
    `).run(releaseId, parsed.glyph, parsed.codepoint, sourceCharacterId, parsed.absenceReason, now, now);
    return (this.database.prepare("SELECT id FROM characters WHERE release_id = ? AND glyph = ?").get(
      releaseId, parsed.glyph,
    ) as { id: number }).id;
  }

  private replaceCanonicalDetails(
    releaseId: string,
    characterId: number,
    sourceCharacterId: number,
    parsed: ParsedCharacterPage,
    now: string,
  ): void {
    this.database.prepare("DELETE FROM pronunciations WHERE character_id = ? AND source_name = 'kangxizidian.cn'")
      .run(characterId);
    const pronunciationStatement = this.database.prepare(`
      INSERT INTO pronunciations (
        character_id, pinyin, plain_pinyin, zhuyin, ordinal, is_primary, source_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'kangxizidian.cn', ?, ?)
    `);
    const maxLength = Math.max(parsed.pinyin.length, parsed.zhuyin.length);
    for (let index = 0; index < maxLength; index += 1) {
      const pinyin = parsed.pinyin[index]?.value ?? null;
      const zhuyin = parsed.zhuyin[index]?.value ?? null;
      pronunciationStatement.run(
        characterId, pinyin, pinyin ? plainPinyin(pinyin) : null, zhuyin, index, index === 0 ? 1 : 0, now, now,
      );
    }

    this.database.prepare("DELETE FROM stroke_observations WHERE character_id = ? AND source_name = 'kangxizidian.cn'")
      .run(characterId);
    const strokeStatement = this.database.prepare(`
      INSERT OR IGNORE INTO stroke_observations (
        character_id, stroke_kind, glyph_context, stroke_count, source_name, source_reference, is_selected, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'kangxizidian.cn', ?, ?, ?, ?)
    `);
    const addStroke = (kind: string, glyph: string, strokes: number | null, selected: boolean) => {
      if (strokes !== null && strokes > 0) strokeStatement.run(
        characterId, kind, glyph, strokes, parsed.sourceUrl, selected ? 1 : 0, now, now,
      );
    };
    addStroke("modern", parsed.glyph, parsed.modernStrokes, true);
    addStroke("website_naming", parsed.glyph, parsed.websiteNamingStrokes, true);
    addStroke("radical", parsed.radical ?? parsed.glyph, parsed.radicalStrokes, false);
    addStroke("outside", parsed.glyph, parsed.outsideStrokes, false);
    for (const entry of parsed.strictKangxiStrokes) addStroke("strict_kangxi", entry.glyph, entry.strokes, entry.glyph === parsed.glyph);

    const primary = parsed.pinyin[0]?.value ?? null;
    const positiveStrict = parsed.strictKangxiStrokes.filter((entry) => entry.strokes > 0);
    const canonicalStrictStrokes = positiveStrict.find((entry) => entry.glyph === parsed.glyph)?.strokes
      ?? positiveStrict[0]?.strokes ?? null;
    this.database.prepare(`
      INSERT INTO canonical_profiles (
        character_id, primary_pinyin, plain_pinyin, radical, modern_strokes, naming_strokes,
        strict_kangxi_strokes, wubi, element, auspiciousness, common_flag, confidence_status,
        source_summary_json, modern_strokes_absence_reason, naming_strokes_absence_reason,
        strict_kangxi_strokes_absence_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unverified', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(character_id) DO UPDATE SET
        primary_pinyin = excluded.primary_pinyin, plain_pinyin = excluded.plain_pinyin, radical = excluded.radical,
        modern_strokes = excluded.modern_strokes, naming_strokes = excluded.naming_strokes,
        strict_kangxi_strokes = excluded.strict_kangxi_strokes, wubi = excluded.wubi,
        element = excluded.element, auspiciousness = excluded.auspiciousness, common_flag = excluded.common_flag,
        confidence_status = 'unverified', source_summary_json = excluded.source_summary_json,
        modern_strokes_absence_reason = excluded.modern_strokes_absence_reason,
        naming_strokes_absence_reason = excluded.naming_strokes_absence_reason,
        strict_kangxi_strokes_absence_reason = excluded.strict_kangxi_strokes_absence_reason,
        updated_at = excluded.updated_at
    `).run(
      characterId, primary, primary ? plainPinyin(primary) : null, parsed.radical, parsed.modernStrokes,
      parsed.websiteNamingStrokes, canonicalStrictStrokes,
      parsed.wubi, parsed.naming.element, parsed.naming.auspiciousness,
      parsed.naming.commonFlag === null ? null : Number(parsed.naming.commonFlag),
      JSON.stringify({ website: parsed.sourceUrl, sourceCharacterId }),
      parsed.modernStrokes === null ? "source_page_does_not_declare_modern_strokes" : null,
      parsed.websiteNamingStrokes === null ? "source_page_does_not_declare_naming_strokes" : null,
      canonicalStrictStrokes === null ? "source_page_does_not_declare_positive_strict_kangxi_strokes" : null,
      now, now,
    );

    this.replaceWebsiteStrokeDecisions(releaseId, characterId, parsed, canonicalStrictStrokes, now);

    this.refreshFts(characterId, parsed, sourceCharacterId);
  }

  private replaceWebsiteStrokeDecisions(
    releaseId: string,
    characterId: number,
    parsed: ParsedCharacterPage,
    canonicalStrictStrokes: number | null,
    now: string,
  ): void {
    this.database.prepare(`
      DELETE FROM canonical_decisions
      WHERE release_id = ? AND character_id = ?
        AND rule_code IN (
          'KANGXI_CN_WEBSITE_NAMING_STROKES',
          'KANGXI_CN_WEBSITE_STRICT_KANGXI_STROKES'
        )
    `).run(releaseId, characterId);
    const statement = this.database.prepare(`
      INSERT INTO canonical_decisions (
        release_id, character_id, field_name, selected_value_json, rule_code,
        rationale, decided_by, decided_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'kangxi-cn-stroke-policy.v1', ?, ?, ?)
    `);
    if (parsed.websiteNamingStrokes !== null) statement.run(
      releaseId,
      characterId,
      "naming_strokes",
      JSON.stringify(parsed.websiteNamingStrokes),
      "KANGXI_CN_WEBSITE_NAMING_STROKES",
      "Use the authorized website naming stroke field for chinese_dictionary.bihua; modern stroke observations are not equivalent.",
      now,
      now,
      now,
    );
    if (canonicalStrictStrokes !== null) statement.run(
      releaseId,
      characterId,
      "strict_kangxi_strokes",
      JSON.stringify(canonicalStrictStrokes),
      "KANGXI_CN_WEBSITE_STRICT_KANGXI_STROKES",
      "Use the authorized website Kangxi stroke field for chinese_dictionary.kx_bihua; Unihan Kangxi properties are page indexes, not stroke counts.",
      now,
      now,
      now,
    );
  }

  rebuildForms(releaseId: string): number {
    return this.database.transaction(() => {
      const now = nowIso();
      this.database.prepare(`
        DELETE FROM character_forms
        WHERE release_id = ? AND source_name = 'kangxizidian.cn-modern-dictionary'
      `).run(releaseId);
      return this.database.prepare(`
        INSERT OR IGNORE INTO character_forms (
          release_id, from_character_id, to_character_id, relation_type, source_name,
          source_reference, is_preferred, created_at, updated_at
        )
        SELECT source.release_id, source.id, target.id, candidate.relation_type,
          'kangxizidian.cn-modern-dictionary', source_record.source_url, 1, ?, ?
        FROM source_form_candidates candidate
        JOIN source_characters source_record ON source_record.id = candidate.source_character_id
        JOIN characters source ON source.source_character_id = source_record.id AND source.release_id = ?
        JOIN characters target ON target.release_id = source.release_id AND target.glyph = candidate.target_glyph
        WHERE source.id <> target.id
      `).run(now, now, releaseId).changes;
    })();
  }

  private refreshFts(characterId: number, parsed: ParsedCharacterPage, sourceCharacterId: number): void {
    this.database.prepare("DELETE FROM characters_fts WHERE character_id = ?").run(String(characterId));
    const summary = [
      parsed.naming.nameExplanation,
      parsed.naming.namingMeaning,
      parsed.naming.namingImplication,
    ].filter(Boolean).join(" ");
    const content = parsed.sections.map((section) => section.plainText).join("\n");
    this.database.prepare(`
      INSERT INTO characters_fts (character_id, glyph, pinyin, summary, content) VALUES (?, ?, ?, ?, ?)
    `).run(String(characterId), parsed.glyph, parsed.pinyin.map((entry) => entry.value).join(" "), summary, content);
    void sourceCharacterId;
  }
}
