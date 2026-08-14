import type BetterSqlite3 from "better-sqlite3";
import { NotFoundError } from "../shared/errors.js";

export class QueryService {
  constructor(private readonly database: BetterSqlite3.Database) {}

  character(glyph: string, releaseId?: string): Record<string, unknown> {
    const selectedRelease = releaseId ?? this.latestRelease();
    const character = this.database.prepare(`
      SELECT c.id, c.glyph, printf('U+%04X', c.codepoint) codepoint, c.canonical_status, c.absence_reason,
        cp.primary_pinyin, cp.plain_pinyin, cp.radical, cp.modern_strokes, cp.naming_strokes,
        cp.strict_kangxi_strokes, cp.wubi, cp.element, cp.auspiciousness, cp.common_flag,
        cp.confidence_status, cp.source_summary_json, cp.modern_strokes_absence_reason,
        cp.naming_strokes_absence_reason, cp.strict_kangxi_strokes_absence_reason,
        sc.source_character_id website_id, sc.source_url, sc.unicode_label, sc.unicode_block,
        sc.structure, sc.radical_name, sc.radical_strokes, sc.outside_strokes, sc.cangjie, sc.four_corner,
        sc.raw_fields_json, sc.content_sha256 source_content_sha256, sc.absence_reason source_absence_reason
      FROM characters c
      LEFT JOIN canonical_profiles cp ON cp.character_id = c.id
      LEFT JOIN source_characters sc ON sc.id = c.source_character_id
      WHERE c.release_id = ? AND c.glyph = ?
    `).get(selectedRelease, glyph) as Record<string, unknown> | undefined;
    if (!character) throw new NotFoundError("character", `${selectedRelease}:${glyph}`);
    const id = character.id as number;
    return {
      releaseId: selectedRelease,
      character,
      pronunciations: this.database.prepare(`
        SELECT pinyin, plain_pinyin, zhuyin, ordinal, is_primary, source_name,
          pinyin_audio_asset_id, zhuyin_audio_asset_id FROM pronunciations
        WHERE character_id = ? ORDER BY ordinal
      `).all(id),
      strokes: this.database.prepare(`
        SELECT stroke_kind, glyph_context, stroke_count, source_name, source_reference, is_selected
        FROM stroke_observations WHERE character_id = ? ORDER BY stroke_kind, stroke_count
      `).all(id),
      forms: this.database.prepare(`
        SELECT cf.relation_type, cf.source_name, cf.source_reference, cf.is_preferred,
          source.glyph source_glyph, target.glyph target_glyph
        FROM character_forms cf JOIN characters source ON source.id = cf.from_character_id
        JOIN characters target ON target.id = cf.to_character_id
        WHERE cf.from_character_id = ? OR cf.to_character_id = ? ORDER BY cf.relation_type, source.glyph, target.glyph
      `).all(id, id),
      naming: this.database.prepare(`
        SELECT np.* FROM naming_profiles np JOIN source_characters sc ON sc.id = np.source_character_id
        JOIN characters c ON c.source_character_id = sc.id WHERE c.id = ?
      `).get(id) ?? null,
      sections: this.database.prepare(`
        SELECT ds.section_type, ds.title, ds.ordinal, ds.plain_text, ds.content_sha256
        FROM dictionary_sections ds JOIN source_characters sc ON sc.id = ds.source_character_id
        JOIN characters c ON c.source_character_id = sc.id WHERE c.id = ? ORDER BY ds.section_type, ds.ordinal
      `).all(id),
      contentAbsences: this.database.prepare(`
        SELECT sca.content_kind, sca.absence_reason
        FROM source_content_absences sca JOIN source_characters sc ON sc.id = sca.source_character_id
        JOIN characters c ON c.source_character_id = sc.id WHERE c.id = ? ORDER BY sca.content_kind
      `).all(id),
      assets: this.database.prepare(`
        SELECT a.asset_kind, spa.role, a.url, a.status, a.content_type, a.byte_length, a.content_sha256, a.local_path
        FROM characters c JOIN source_characters sc ON sc.id = c.source_character_id
        JOIN source_page_assets spa ON spa.page_id = sc.source_page_id
        JOIN source_assets a ON a.id = spa.asset_id WHERE c.id = ? ORDER BY a.asset_kind, a.url
      `).all(id),
      scanReferences: this.database.prepare(`
        SELECT sr.edition_key, sr.page_number, sr.source_url, sr.label, bp.source_url archived_page_url
        FROM characters c JOIN source_characters sc ON sc.id = c.source_character_id
        JOIN scan_references sr ON sr.source_character_id = sc.id
        LEFT JOIN book_pages bp ON bp.id = sr.book_page_id WHERE c.id = ? ORDER BY sr.edition_key, sr.page_number
      `).all(id),
      referenceObservations: this.database.prepare(`
        SELECT ro.property_name, ro.raw_value, ro.normalized_value_json, ro.source_file,
          ro.source_line, ro.source_reference, rd.id reference_dataset_id,
          rd.source_name, rd.source_version, rd.source_url, rd.license_url, rd.artifact_sha256
        FROM reference_observations ro
        JOIN reference_datasets rd ON rd.id = ro.reference_dataset_id
        WHERE ro.release_id = ? AND ro.character_id = ?
        ORDER BY rd.source_name, rd.source_version, ro.property_name
      `).all(selectedRelease, id),
      issues: this.database.prepare(`
        SELECT id, severity, code, field_name, observed_json, expected_json, message, resolution_status, resolution_note
        FROM validation_issues WHERE release_id = ? AND character_id = ? ORDER BY id
      `).all(selectedRelease, id),
    };
  }

  search(query: string, limit = 20, releaseId?: string): unknown[] {
    const selectedRelease = releaseId ?? this.latestRelease();
    return this.database.prepare(`
      SELECT c.glyph, cp.primary_pinyin, cp.naming_strokes, cp.element,
        snippet(characters_fts, 4, '<mark>', '</mark>', '…', 20) snippet
      FROM characters_fts JOIN characters c ON c.id = CAST(characters_fts.character_id AS INTEGER)
      LEFT JOIN canonical_profiles cp ON cp.character_id = c.id
      WHERE c.release_id = ? AND characters_fts MATCH ? ORDER BY rank LIMIT ?
    `).all(selectedRelease, query.replace(/["']/g, " ").trim(), limit);
  }

  latestRelease(): string {
    const row = this.database.prepare(`
      SELECT id FROM dataset_releases ORDER BY CASE status WHEN 'released' THEN 0 ELSE 1 END, created_at DESC LIMIT 1
    `).get() as { id: string } | undefined;
    if (!row) throw new NotFoundError("dataset release", "latest");
    return row.id;
  }
}
