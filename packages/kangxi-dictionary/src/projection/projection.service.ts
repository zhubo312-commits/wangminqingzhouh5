import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type BetterSqlite3 from "better-sqlite3";
import { Converter } from "opencc-js";
import type { KangxiConfig } from "../shared/config.js";
import { ReleaseError, ValidationFailedError } from "../shared/errors.js";
import { sha256 } from "../shared/hash.js";

interface CharacterRow {
  id: number;
  glyph: string;
  codepoint: number;
  primary_pinyin: string | null;
  plain_pinyin: string | null;
  radical: string | null;
  naming_strokes: number | null;
  strict_kangxi_strokes: number | null;
  wubi: string | null;
  element: string | null;
  auspiciousness: string | null;
  source_character_id: number | null;
  name_explanation: string | null;
  naming_meaning: string | null;
  naming_implication: string | null;
  recommendation_percent: number | null;
  culture_percent: number | null;
  gender_tendency: number | null;
  common_flag: number | null;
  name_usage_class: string | null;
  usage_count: number | null;
  first_character_percent: number | null;
  male_percent: number | null;
  female_percent: number | null;
  taboos_text: string | null;
}

interface ProjectedRow {
  simplified: string;
  traditional: string;
  plainPinyin: string;
  wubi: string;
  radical: string;
  strokes: number;
  pinyin: string;
  brief: string;
  detail: string;
  element: string;
  auspiciousness: string;
  strictKangxiStrokes: string;
  aliases: string[];
  profile: {
    recommendationPercent: number | null;
    culturePercent: number | null;
    genderTendency: number | null;
    commonFlag: number | null;
    nameUsageClass: string | null;
    nameExplanation: string | null;
    namingMeaning: string | null;
    namingImplication: string | null;
    usageCount: number | null;
    firstCharacterPercent: number | null;
    malePercent: number | null;
    femalePercent: number | null;
    taboosText: string | null;
  };
}

export interface ProjectionResult {
  releaseId: string;
  sqlPath: string;
  manifestPath: string;
  rows: number;
  aliases: number;
  sha256: string;
}

const simplifiedToTraditional = Converter({ from: "cn", to: "t" });
const traditionalToSimplified = Converter({ from: "t", to: "cn" });

export function normalizeSimplifiedGlyph(glyph: string): string {
  return simplifiedToTraditional(glyph);
}

export class ProjectionService {
  constructor(
    private readonly database: BetterSqlite3.Database,
    private readonly config: KangxiConfig,
  ) {}

  project(releaseId: string, outputDirectory?: string, previousSqlPath?: string): ProjectionResult {
    const release = this.database.prepare("SELECT status, manifest_sha256 FROM dataset_releases WHERE id = ?")
      .get(releaseId) as { status: string; manifest_sha256: string | null } | undefined;
    if (!release || release.status !== "released") throw new ReleaseError("Projection requires a published dataset release", { releaseId, status: release?.status });
    const rows = this.loadRows(releaseId);
    this.assertWebsiteStrokePolicy(releaseId);
    const { rows: projected, normalizationGaps } = this.buildProjection(releaseId, rows);
    const chunks: string[] = [
      "-- Generated from the versioned Kangxi dictionary master dataset.",
      `-- Release: ${releaseId}; manifest: ${release.manifest_sha256 ?? "unknown"}.`,
      "-- Do not edit by hand. Re-run project-chinese after publishing a reviewed master snapshot.",
      "",
    ];
    for (let index = 0; index < projected.length; index += 500) {
      const batch = projected.slice(index, index + 500);
      chunks.push("INSERT INTO chinese_dictionary (jtz, zi, py, wubi, bushou, bihua, pinyin, jijie, xiangjie, wx, jx, kx_bihua) VALUES");
      chunks.push(batch.map((row) => `(${[
        row.simplified, row.traditional, row.plainPinyin, row.wubi, row.radical, row.strokes,
        row.pinyin, row.brief, row.detail, row.element, row.auspiciousness, row.strictKangxiStrokes,
      ].map(sqlValue).join(", ")})`).join(",\n") + ";\n");
    }
    for (let index = 0; index < projected.length; index += 500) {
      const batch = projected.slice(index, index + 500);
      chunks.push("INSERT INTO chinese_dictionary_profile (zi, recommendation_percent, culture_percent, gender_tendency, common_flag, name_usage_class, name_explanation, naming_meaning, naming_implication, usage_count, first_character_percent, male_percent, female_percent, taboos_text, source_version) VALUES");
      chunks.push(batch.map((row) => `(${[
        row.traditional, row.profile.recommendationPercent, row.profile.culturePercent,
        row.profile.genderTendency, row.profile.commonFlag, row.profile.nameUsageClass,
        row.profile.nameExplanation, row.profile.namingMeaning, row.profile.namingImplication,
        row.profile.usageCount, row.profile.firstCharacterPercent, row.profile.malePercent,
        row.profile.femalePercent, row.profile.taboosText, releaseId,
      ].map(sqlNullableValue).join(", ")})`).join(",\n") + ";\n");
    }
    const aliasTargets = new Map<string, string>();
    for (const row of projected) for (const alias of row.aliases) {
      const existing = aliasTargets.get(alias);
      if (existing && existing !== row.traditional) {
        const normalized = normalizeSimplifiedGlyph(alias);
        if (normalized === existing) continue;
        if (normalized !== row.traditional) throw new ValidationFailedError("Alias maps to multiple canonical targets", {
          alias, targets: [existing, row.traditional], normalized,
        });
      }
      aliasTargets.set(alias, row.traditional);
    }
    const aliases = [...aliasTargets].map(([alias, target]) => ({ alias, target }));
    for (let index = 0; index < aliases.length; index += 500) {
      const batch = aliases.slice(index, index + 500);
      chunks.push("INSERT INTO chinese_dictionary_alias (alias, target_zi, relation_type, source_version) VALUES");
      chunks.push(batch.map((entry) => `(${sqlValue(entry.alias)}, ${sqlValue(entry.target)}, 'canonical', ${sqlValue(releaseId)})`).join(",\n") + ";\n");
    }
    const sql = `${chunks.join("\n").trim()}\n`;
    const directory = path.resolve(outputDirectory ?? path.join(this.config.dataRoot, "derived", releaseId));
    mkdirSync(directory, { recursive: true });
    const sqlPath = path.join(directory, "xingming-dictionary-data.sql");
    const previous = previousSqlPath && existsSync(previousSqlPath) ? {
      path: path.resolve(previousSqlPath),
      sha256: sha256(readFileSync(previousSqlPath)),
      changed: sha256(readFileSync(previousSqlPath)) !== sha256(sql),
    } : null;
    writeFileSync(sqlPath, sql, "utf8");
    const openConflicts = this.database.prepare(`
      SELECT code, field_name, message, resolution_status, resolution_note FROM validation_issues
      WHERE release_id = ? AND severity IN ('error', 'warning') ORDER BY id
    `).all(releaseId);
    const manifest = {
      releaseId,
      sourceManifestSha256: release.manifest_sha256,
      generatedAt: new Date().toISOString(),
      target: "services/paipan H2 MySQL mode",
      output: { file: path.basename(sqlPath), sha256: sha256(sql), rows: projected.length, aliases: aliases.length },
      mapping: {
        "zi/jtz": "accepted traditional glyph and preferred simplified form; aliases normalize input to traditional",
        "py/pinyin": "canonical primary pinyin without/with tone marks",
        "wubi/bushou": "canonical website code and radical",
        bihua: "strict Kangxi strokes of the normalized traditional glyph used by the naming calculation",
        kx_bihua: "same strict Kangxi stroke value, retained for explicit provenance and compatibility",
        "wx/jx": "reviewed naming element and auspiciousness",
        "jijie/xiangjie": "sanitized naming summary and titled dictionary sections",
        chinese_dictionary_profile: "optional naming explanations, audited taboos, and source-site usage statistics",
      },
      previous,
      reviewedConflicts: openConflicts,
      normalizationPolicy: "opencc-js@1.4.1 s2t per character; merge only into an accepted target or a relation confirmed by the authorized website",
      normalizationGaps,
    };
    const manifestPath = path.join(directory, "projection-manifest.json");
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    return { releaseId, sqlPath, manifestPath, rows: projected.length, aliases: aliases.length, sha256: sha256(sql) };
  }

  private loadRows(releaseId: string): CharacterRow[] {
    return this.database.prepare(`
      SELECT c.id, c.glyph, c.codepoint, cp.primary_pinyin, cp.plain_pinyin, cp.radical,
        cp.naming_strokes, cp.strict_kangxi_strokes, cp.wubi, cp.element, cp.auspiciousness,
        c.source_character_id, np.name_explanation, np.naming_meaning, np.naming_implication,
        np.recommendation_percent, np.culture_percent, np.gender_tendency, np.common_flag,
        np.name_usage_class, np.usage_count, np.first_character_percent, np.male_percent,
        np.female_percent, np.taboos_text
      FROM characters c JOIN canonical_profiles cp ON cp.character_id = c.id
      LEFT JOIN source_characters sc ON sc.id = c.source_character_id
      LEFT JOIN naming_profiles np ON np.source_character_id = sc.id
      WHERE c.release_id = ? AND c.canonical_status = 'accepted' ORDER BY c.codepoint
    `).all(releaseId) as CharacterRow[];
  }

  private assertWebsiteStrokePolicy(releaseId: string): void {
    const rows = this.database.prepare(`
      SELECT c.glyph, policy.field_name, expected.expected_value, policy.rule_code
      FROM characters c
      JOIN canonical_profiles cp ON cp.character_id = c.id
      CROSS JOIN (
        SELECT 'naming_strokes' field_name, 'KANGXI_CN_WEBSITE_NAMING_STROKES' rule_code
        UNION ALL
        SELECT 'strict_kangxi_strokes', 'KANGXI_CN_WEBSITE_STRICT_KANGXI_STROKES'
      ) policy
      JOIN (
        SELECT character_id, 'naming_strokes' field_name, naming_strokes expected_value
        FROM canonical_profiles WHERE naming_strokes IS NOT NULL
        UNION ALL
        SELECT character_id, 'strict_kangxi_strokes', strict_kangxi_strokes
        FROM canonical_profiles WHERE strict_kangxi_strokes IS NOT NULL
      ) expected ON expected.character_id = c.id AND expected.field_name = policy.field_name
      WHERE c.release_id = ? AND c.canonical_status = 'accepted' AND NOT EXISTS (
        SELECT 1 FROM canonical_decisions decision
        WHERE decision.release_id = c.release_id
          AND decision.character_id = c.id
          AND decision.field_name = policy.field_name
          AND decision.rule_code = policy.rule_code
          AND CAST(json_extract(decision.selected_value_json, '$') AS INTEGER) = expected.expected_value
      )
      ORDER BY c.codepoint LIMIT 50
    `).all(releaseId) as Array<Record<string, unknown>>;
    if (rows.length > 0) throw new ValidationFailedError(
      "Projection contains website stroke values without matching policy decisions",
      { releaseId, examples: rows },
    );
  }

  private buildProjection(releaseId: string, rows: CharacterRow[]): {
    rows: ProjectedRow[];
    normalizationGaps: Array<{ input: string; openccTarget: string; resolution: string }>;
  } {
    const byGlyph = new Map(rows.map((row) => [row.glyph, row]));
    const websitePreferred = new Set((this.database.prepare(`
      SELECT source.glyph || char(0) || target.glyph mapping
      FROM character_forms forms
      JOIN characters source ON source.id = forms.from_character_id
      JOIN characters target ON target.id = forms.to_character_id
      WHERE forms.release_id = ? AND forms.relation_type = 'traditional'
        AND forms.is_preferred = 1 AND forms.source_name LIKE 'kangxizidian.cn-%'
    `).all(releaseId) as Array<{ mapping: string }>).map((row) => row.mapping));
    const sourcesByTarget = new Map<string, CharacterRow[]>();
    const normalizationGaps: Array<{ input: string; openccTarget: string; resolution: string }> = [];
    for (const row of rows) {
      const converted = normalizeSimplifiedGlyph(row.glyph);
      const acceptedTarget = [...converted].length === 1 ? byGlyph.get(converted) : undefined;
      const websiteConfirms = websitePreferred.has(`${row.glyph}\0${converted}`);
      const targetGlyph = acceptedTarget || websiteConfirms ? converted : row.glyph;
      if (converted !== row.glyph && !acceptedTarget && !websiteConfirms) {
        normalizationGaps.push({ input: row.glyph, openccTarget: converted, resolution: "kept_as_self_target_not_in_accepted_corpus" });
      }
      const sources = sourcesByTarget.get(targetGlyph) ?? [];
      sources.push(row);
      sourcesByTarget.set(targetGlyph, sources);
    }
    const output: ProjectedRow[] = [];
    const unavailable: Array<Record<string, unknown>> = [];
    for (const [traditionalGlyph, sourceRows] of [...sourcesByTarget].sort((a, b) => a[1][0]!.codepoint - b[1][0]!.codepoint)) {
      const traditional = byGlyph.get(traditionalGlyph) ?? sourceRows[0]!;
      const openccSimplified = traditionalToSimplified(traditionalGlyph);
      const simplified = sourceRows.find((row) => row.glyph === openccSimplified)
        ?? sourceRows.find((row) => row.glyph !== traditionalGlyph)
        ?? traditional;
      const required = {
        pinyin: simplified.primary_pinyin ?? traditional.primary_pinyin,
        plainPinyin: simplified.plain_pinyin ?? traditional.plain_pinyin,
        namingStrokes: simplified.naming_strokes ?? traditional.naming_strokes,
        strictKangxiStrokes: traditional.strict_kangxi_strokes ?? simplified.strict_kangxi_strokes,
        element: simplified.element ?? traditional.element,
      };
      if (!required.pinyin || !required.plainPinyin || !required.namingStrokes || !required.strictKangxiStrokes || !required.element) {
        unavailable.push({ glyph: traditionalGlyph, simplified: simplified.glyph, ...required });
        continue;
      }
      const sourceCharacterId = traditional.source_character_id ?? simplified.source_character_id;
      const sections = sourceCharacterId === null ? [] : this.database.prepare(`
        SELECT title, plain_text FROM dictionary_sections WHERE source_character_id = ? ORDER BY
          CASE section_type WHEN 'kangxi' THEN 0 WHEN 'shuowen_classic' THEN 1 WHEN 'shuowen_plain' THEN 2
            WHEN 'shuowen_annotation' THEN 3 WHEN 'modern_dictionary' THEN 4 ELSE 5 END, ordinal
      `).all(sourceCharacterId) as Array<{ title: string; plain_text: string }>;
      const profileSource = traditional.source_character_id === sourceCharacterId ? traditional : simplified;
      const brief = [profileSource.name_explanation, profileSource.naming_meaning, profileSource.naming_implication]
        .filter((value): value is string => Boolean(value)).join("\n");
      const detail = sections.map((section) => `【${section.title}】\n${section.plain_text}`).join("\n\n");
      output.push({
        simplified: simplified.glyph,
        traditional: traditionalGlyph,
        plainPinyin: required.plainPinyin,
        wubi: simplified.wubi ?? traditional.wubi ?? "",
        radical: simplified.radical ?? traditional.radical ?? "",
        strokes: required.strictKangxiStrokes,
        pinyin: required.pinyin,
        brief,
        detail,
        element: traditional.element ?? simplified.element ?? required.element,
        auspiciousness: traditional.auspiciousness ?? simplified.auspiciousness ?? "",
        strictKangxiStrokes: String(required.strictKangxiStrokes),
        aliases: [...new Set([
          ...sourceRows.map((row) => row.glyph),
          simplified.glyph,
          traditionalGlyph,
        ])],
        profile: {
          recommendationPercent: profileSource.recommendation_percent,
          culturePercent: profileSource.culture_percent,
          genderTendency: profileSource.gender_tendency,
          commonFlag: profileSource.common_flag,
          nameUsageClass: profileSource.name_usage_class,
          nameExplanation: profileSource.name_explanation,
          namingMeaning: profileSource.naming_meaning,
          namingImplication: profileSource.naming_implication,
          usageCount: profileSource.usage_count,
          firstCharacterPercent: profileSource.first_character_percent,
          malePercent: profileSource.male_percent,
          femalePercent: profileSource.female_percent,
          taboosText: sanitizeTaboos(profileSource.taboos_text, traditional.element ?? simplified.element),
        },
      });
    }
    if (unavailable.length) throw new ValidationFailedError("Projection contains characters without required canonical fields", {
      count: unavailable.length,
      examples: unavailable.slice(0, 50),
    });
    return { rows: output, normalizationGaps };
  }
}

function sqlValue(value: string | number): string {
  if (typeof value === "number") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNullableValue(value: string | number | null): string {
  return value === null ? "NULL" : sqlValue(value);
}

export function sanitizeTaboos(value: string | null, structuredElement: string | null): string | null {
  if (!value || !structuredElement) return value;
  const pattern = /(?:^|[\n\r])?\s*\d+[\u3001.\uff0e]?\s*[^\u3002\uff1b;\n\r]*\u4e94\u884c\u5c5e\u6027\u4e3a([\u91d1\u6728\u6c34\u706b\u571f])[^\u3002\uff1b;\n\r]*[\u3002\uff1b;]?/gu;
  const cleaned = value.replace(pattern, (sentence, stated: string) => stated === structuredElement ? sentence : "")
    .replace(/\n{3,}/g, "\n\n").trim();
  return cleaned || null;
}
