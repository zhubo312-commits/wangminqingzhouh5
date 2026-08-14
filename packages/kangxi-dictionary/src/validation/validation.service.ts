import type BetterSqlite3 from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { KangxiConfig } from "../shared/config.js";
import { nowIso } from "../shared/database.js";
import { sha256 } from "../shared/hash.js";

export interface ValidationSummary {
  releaseId: string;
  generatedAt: string;
  integrity: string;
  foreignKeyViolations: number;
  characters: number;
  pages: Record<string, number>;
  assets: Record<string, number>;
  issues: { error: number; warning: number; info: number; open: number; openBlocking: number };
  strokePolicy: StrokePolicySummary;
  reportJsonPath: string;
  reportHtmlPath: string;
  strokeMissingBasicCsvPath: string;
  strokeMissingCommonCsvPath: string;
  passed: boolean;
}

export interface StrokePolicySummary {
  canonicalSource: "kangxizidian.cn";
  modernStrokeRole: "reference_only";
  totalCharacters: number;
  namingAvailable: number;
  strictKangxiAvailable: number;
  bothAvailable: number;
  equalWhenBothAvailable: number;
  conflicts: number;
  basicCharacters: number;
  basicMissingNaming: number;
  basicMissingStrictKangxi: number;
  commonCharacters: number;
  commonMissingNaming: number;
  commonMissingStrictKangxi: number;
}

interface IssueInput {
  runId?: string | null;
  sourcePageId?: number | null;
  sourceAssetId?: number | null;
  characterId?: number | null;
  severity: "error" | "warning" | "info";
  code: string;
  fieldName?: string | null;
  observed?: unknown;
  expected?: unknown;
  message: string;
}

export class ValidationService {
  constructor(
    private readonly database: BetterSqlite3.Database,
    private readonly config?: KangxiConfig,
  ) {}

  validate(releaseId: string): ValidationSummary {
    this.database.transaction(() => {
      this.database.prepare(`
        DELETE FROM validation_issues WHERE release_id = ? AND code LIKE 'AUTO_%' AND resolution_status = 'open'
      `).run(releaseId);
      this.validateFetchCompleteness(releaseId);
      this.validateArtifactHashes(releaseId);
      this.validateReferenceDatasets(releaseId);
      this.validateSourceIdentityUniqueness(releaseId);
      this.validateCharacterFields(releaseId);
      this.validateWebsiteStrokePolicy(releaseId);
      this.validateNamingPercentages(releaseId);
      this.validateIndexCounts(releaseId);
      this.validateInternalTextConflicts(releaseId);
      this.validateKnownStrokeCases(releaseId);
      this.validateMediaCoverage(releaseId);
    })();

    const integrityRows = this.database.pragma("integrity_check") as Array<{ integrity_check: string }>;
    const integrity = integrityRows.map((row) => row.integrity_check).join("; ");
    const foreignKeyViolations = (this.database.pragma("foreign_key_check") as unknown[]).length;
    if (integrity !== "ok") this.addIssue(releaseId, {
      severity: "error", code: "AUTO_SQLITE_INTEGRITY", observed: integrity, expected: "ok",
      message: "SQLite integrity_check failed",
    });
    if (foreignKeyViolations > 0) this.addIssue(releaseId, {
      severity: "error", code: "AUTO_FOREIGN_KEY", observed: foreignKeyViolations, expected: 0,
      message: "SQLite foreign_key_check found violations",
    });

    const generatedAt = nowIso();
    const characters = (this.database.prepare("SELECT COUNT(*) count FROM characters WHERE release_id = ?")
      .get(releaseId) as { count: number }).count;
    const pageRows = this.database.prepare(`
      SELECT p.status, COUNT(*) count FROM source_pages p JOIN crawl_runs r ON r.id = p.run_id
      WHERE r.release_id = ? GROUP BY p.status
    `).all(releaseId) as Array<{ status: string; count: number }>;
    const assetRows = this.database.prepare(`
      SELECT a.status, COUNT(*) count FROM source_assets a JOIN crawl_runs r ON r.id = a.run_id
      WHERE r.release_id = ? GROUP BY a.status
    `).all(releaseId) as Array<{ status: string; count: number }>;
    const issueRows = this.database.prepare(`
      SELECT severity, resolution_status, COUNT(*) count FROM validation_issues WHERE release_id = ? GROUP BY severity, resolution_status
    `).all(releaseId) as Array<{ severity: "error" | "warning" | "info"; resolution_status: string; count: number }>;
    const issues = { error: 0, warning: 0, info: 0, open: 0, openBlocking: 0 };
    for (const row of issueRows) {
      issues[row.severity] += row.count;
      if (row.resolution_status === "open") issues.open += row.count;
      if (row.resolution_status === "open" && row.severity !== "info") issues.openBlocking += row.count;
    }
    const summaryBase = {
      releaseId,
      generatedAt,
      integrity,
      foreignKeyViolations,
      characters,
      pages: Object.fromEntries(pageRows.map((row) => [row.status, row.count])),
      assets: Object.fromEntries(assetRows.map((row) => [row.status, row.count])),
      issues,
      strokePolicy: this.strokePolicySummary(releaseId),
      passed: integrity === "ok" && foreignKeyViolations === 0 && issues.openBlocking === 0,
    };
    const paths = this.writeReports(summaryBase);
    return { ...summaryBase, ...paths };
  }

  private validateFetchCompleteness(releaseId: string): void {
    const pages = this.database.prepare(`
      SELECT p.id, p.run_id, p.url, p.status, p.error_code FROM source_pages p JOIN crawl_runs r ON r.id = p.run_id
      WHERE r.release_id = ? AND p.status <> 'success'
    `).all(releaseId) as Array<{ id: number; run_id: string; url: string; status: string; error_code: string | null }>;
    for (const page of pages) this.addIssue(releaseId, {
      runId: page.run_id, sourcePageId: page.id,
      severity: page.status === "source_missing" ? "info" : "error",
      code: page.status === "source_missing" ? "AUTO_PAGE_SOURCE_MISSING" : "AUTO_PAGE_INCOMPLETE",
      observed: { status: page.status, errorCode: page.error_code, url: page.url }, expected: "success",
      message: page.status === "source_missing" ? "Source page is absent and requires manual acceptance" : "Discovered page was not archived successfully",
    });
    const assets = this.database.prepare(`
      SELECT a.id, a.run_id, a.url, a.status, a.error_code FROM source_assets a JOIN crawl_runs r ON r.id = a.run_id
      WHERE r.release_id = ? AND a.status <> 'success'
    `).all(releaseId) as Array<{ id: number; run_id: string; url: string; status: string; error_code: string | null }>;
    for (const asset of assets) this.addIssue(releaseId, {
      runId: asset.run_id, sourceAssetId: asset.id,
      severity: asset.status === "source_missing" ? "info" : "error",
      code: asset.status === "source_missing" ? "AUTO_ASSET_SOURCE_MISSING" : "AUTO_ASSET_INCOMPLETE",
      observed: { status: asset.status, errorCode: asset.error_code, url: asset.url }, expected: "success",
      message: asset.status === "source_missing" ? "Source asset is absent and requires manual acceptance" : "Discovered asset was not archived successfully",
    });
  }

  private validateArtifactHashes(releaseId: string): void {
    if (!this.config) return;
    const rows = this.database.prepare(`
      SELECT 'page' artifact_kind, p.id artifact_id, p.local_path, p.content_sha256
      FROM source_pages p JOIN crawl_runs r ON r.id = p.run_id
      WHERE r.release_id = ? AND p.status = 'success'
      UNION ALL
      SELECT 'asset' artifact_kind, a.id artifact_id, a.local_path, a.content_sha256
      FROM source_assets a JOIN crawl_runs r ON r.id = a.run_id
      WHERE r.release_id = ? AND a.status = 'success'
    `).all(releaseId, releaseId) as Array<{
      artifact_kind: "page" | "asset"; artifact_id: number; local_path: string | null; content_sha256: string | null;
    }>;
    const dataRoot = path.resolve(this.config.dataRoot);
    for (const row of rows) {
      const issueTarget = row.artifact_kind === "page" ? { sourcePageId: row.artifact_id } : { sourceAssetId: row.artifact_id };
      if (!row.local_path || !row.content_sha256) {
        this.addIssue(releaseId, {
          ...issueTarget, severity: "error", code: "AUTO_ARTIFACT_METADATA_MISSING",
          observed: { localPath: row.local_path, sha256: row.content_sha256 }, expected: "path and SHA-256",
          message: "Successful artifact is missing local path or checksum metadata",
        });
        continue;
      }
      const absolute = path.resolve(dataRoot, row.local_path);
      if (absolute !== dataRoot && !absolute.startsWith(`${dataRoot}${path.sep}`)) {
        this.addIssue(releaseId, {
          ...issueTarget, severity: "error", code: "AUTO_ARTIFACT_PATH_ESCAPE", observed: row.local_path,
          expected: "path inside data root", message: "Artifact path escapes the configured data root",
        });
        continue;
      }
      if (!existsSync(absolute)) {
        this.addIssue(releaseId, {
          ...issueTarget, severity: "error", code: "AUTO_ARTIFACT_FILE_MISSING", observed: row.local_path,
          expected: "readable local file", message: "Archived artifact file is absent",
        });
        continue;
      }
      const actual = sha256(readFileSync(absolute));
      if (actual !== row.content_sha256) this.addIssue(releaseId, {
        ...issueTarget, severity: "error", code: "AUTO_ARTIFACT_HASH_MISMATCH",
        observed: actual, expected: row.content_sha256, message: "Archived artifact SHA-256 does not match the database",
      });
    }
  }

  private validateReferenceDatasets(releaseId: string): void {
    if (!this.config) return;
    const files = this.database.prepare(`
      SELECT DISTINCT rd.id reference_dataset_id, rdf.file_name, rdf.local_path,
        rdf.content_sha256, rdf.byte_length
      FROM reference_observations ro
      JOIN reference_datasets rd ON rd.id = ro.reference_dataset_id
      JOIN reference_dataset_files rdf ON rdf.reference_dataset_id = rd.id
      WHERE ro.release_id = ?
    `).all(releaseId) as Array<{
      reference_dataset_id: string;
      file_name: string;
      local_path: string;
      content_sha256: string;
      byte_length: number;
    }>;
    const dataRoot = path.resolve(this.config.dataRoot);
    const failures: Array<Record<string, unknown>> = [];
    for (const file of files) {
      const absolute = path.resolve(dataRoot, file.local_path);
      if (absolute !== dataRoot && !absolute.startsWith(`${dataRoot}${path.sep}`)) {
        failures.push({ ...file, reason: "path_escape" });
        continue;
      }
      if (!existsSync(absolute)) {
        failures.push({ ...file, reason: "file_missing" });
        continue;
      }
      const bytes = readFileSync(absolute);
      const actual = sha256(bytes);
      if (actual !== file.content_sha256 || bytes.byteLength !== file.byte_length) failures.push({
        ...file,
        reason: "checksum_or_length_mismatch",
        actualSha256: actual,
        actualByteLength: bytes.byteLength,
      });
    }
    if (failures.length > 0) this.addIssue(releaseId, {
      severity: "error",
      code: "AUTO_REFERENCE_ARTIFACT_INVALID",
      observed: { count: failures.length, samples: failures.slice(0, 20) },
      expected: "all referenced source artifacts readable with matching SHA-256 and length",
      message: "One or more external reference artifacts failed provenance validation",
    });

    const invalidObservations = this.database.prepare(`
      SELECT COUNT(*) count FROM reference_observations
      WHERE release_id = ? AND (
        json_valid(normalized_value_json) = 0
        OR (property_name IN ('kTotalStrokes', 'kAlternateTotalStrokes')
          AND NOT (property_name = 'kAlternateTotalStrokes' AND raw_value = '-')
          AND NOT EXISTS (
          SELECT 1 FROM json_each(normalized_value_json)
          WHERE json_each.type = 'integer' AND CAST(json_each.value AS INTEGER) > 0
        ))
      )
    `).get(releaseId) as { count: number };
    if (invalidObservations.count > 0) this.addIssue(releaseId, {
      severity: "error",
      code: "AUTO_REFERENCE_OBSERVATION_INVALID",
      observed: invalidObservations.count,
      expected: 0,
      message: "External reference observations contain invalid normalized values",
    });

    const conflictCount = (this.database.prepare(`
      SELECT COUNT(*) count
      FROM reference_observations ro
      JOIN canonical_profiles cp ON cp.character_id = ro.character_id
      WHERE ro.release_id = ? AND ro.property_name = 'kTotalStrokes'
        AND cp.modern_strokes IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM json_each(ro.normalized_value_json)
          WHERE CAST(json_each.value AS INTEGER) = cp.modern_strokes
        )
    `).get(releaseId) as { count: number }).count;
    if (conflictCount > 0) {
      const samples = this.database.prepare(`
        SELECT c.glyph, cp.modern_strokes website_modern_strokes, ro.raw_value unihan_total_strokes
        FROM reference_observations ro
        JOIN characters c ON c.id = ro.character_id
        JOIN canonical_profiles cp ON cp.character_id = ro.character_id
        WHERE ro.release_id = ? AND ro.property_name = 'kTotalStrokes'
          AND cp.modern_strokes IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM json_each(ro.normalized_value_json)
            WHERE CAST(json_each.value AS INTEGER) = cp.modern_strokes
          )
        ORDER BY c.codepoint LIMIT 20
      `).all(releaseId);
      this.addIssue(releaseId, {
        severity: "info",
        code: "AUTO_REFERENCE_MODERN_STROKE_CONFLICT_SUMMARY",
        fieldName: "modern_strokes",
        observed: { count: conflictCount, samples },
        expected: "source-specific values retained without silent overwrite",
        message: "Website and Unihan modern stroke observations differ; existing canonical values were preserved",
      });
    }
  }

  private validateSourceIdentityUniqueness(releaseId: string): void {
    const inconsistentIds = this.database.prepare(`
      SELECT sc.source_character_id, COUNT(DISTINCT sc.glyph || ':' || sc.codepoint) variants,
        group_concat(DISTINCT sc.glyph) glyphs
      FROM source_characters sc JOIN crawl_runs r ON r.id = sc.run_id
      WHERE r.release_id = ? GROUP BY sc.source_character_id HAVING variants > 1
    `).all(releaseId) as Array<{ source_character_id: string; variants: number; glyphs: string }>;
    for (const row of inconsistentIds) this.addIssue(releaseId, {
      severity: "error", code: "AUTO_SOURCE_IDENTITY_CONFLICT", observed: row,
      expected: "one glyph and code point per website ID", message: "A website character ID resolves to inconsistent character identities",
    });
    const duplicateGlyphs = this.database.prepare(`
      SELECT sc.glyph, COUNT(DISTINCT sc.source_character_id) website_ids,
        group_concat(DISTINCT sc.source_character_id) ids
      FROM source_characters sc JOIN crawl_runs r ON r.id = sc.run_id
      WHERE r.release_id = ? GROUP BY sc.glyph HAVING website_ids > 1
    `).all(releaseId) as Array<{ glyph: string; website_ids: number; ids: string }>;
    for (const row of duplicateGlyphs) this.addIssue(releaseId, {
      severity: "error", code: "AUTO_GLYPH_WEBSITE_ID_DUPLICATE", observed: row,
      expected: "one website ID per glyph", message: "A glyph is represented by multiple website IDs",
    });
  }

  private validateCharacterFields(releaseId: string): void {
    const rows = this.database.prepare(`
      SELECT c.id, c.glyph, c.codepoint, c.canonical_status, cp.primary_pinyin, cp.naming_strokes, cp.strict_kangxi_strokes, cp.element,
        cp.naming_strokes_absence_reason, cp.strict_kangxi_strokes_absence_reason
      FROM characters c LEFT JOIN canonical_profiles cp ON cp.character_id = c.id WHERE c.release_id = ?
    `).all(releaseId) as Array<Record<string, string | number | null>>;
    for (const row of rows) {
      if (!row.glyph || typeof row.codepoint !== "number") this.addIssue(releaseId, {
        characterId: row.id as number, severity: "error", code: "AUTO_CHARACTER_IDENTITY",
        observed: row, expected: "one Unicode character with code point", message: "Character identity is incomplete",
      });
      const accepted = row.canonical_status === "accepted";
      if (!row.primary_pinyin && accepted) this.addIssue(releaseId, {
        characterId: row.id as number, severity: "error", code: "AUTO_PINYIN_MISSING", fieldName: "primary_pinyin",
        observed: null, expected: "non-empty for official naming subset", message: "Primary pinyin is missing from an accepted naming character",
      });
      for (const field of ["naming_strokes", "strict_kangxi_strokes"] as const) {
        if (accepted && (typeof row[field] !== "number" || Number(row[field]) <= 0)) this.addIssue(releaseId, {
          characterId: row.id as number, severity: "error", code: `AUTO_${field.toUpperCase()}_SOURCE_MISSING`, fieldName: field,
          observed: { value: row[field], absenceReason: row[`${field}_absence_reason`] },
          expected: "positive integer or manually accepted source absence", message: `${field} is unavailable in the source page`,
        });
      }
      if (row.element !== null && !["金", "木", "水", "火", "土"].includes(String(row.element))) this.addIssue(releaseId, {
        characterId: row.id as number, severity: "error", code: "AUTO_ELEMENT_INVALID", fieldName: "element",
        observed: row.element, expected: ["金", "木", "水", "火", "土"], message: "Element value is invalid",
      });
    }
  }

  private validateWebsiteStrokePolicy(releaseId: string): void {
    const conflicts = this.database.prepare(`
      SELECT c.id, c.glyph, cp.naming_strokes, cp.strict_kangxi_strokes
      FROM characters c JOIN canonical_profiles cp ON cp.character_id = c.id
      WHERE c.release_id = ?
        AND cp.naming_strokes IS NOT NULL
        AND cp.strict_kangxi_strokes IS NOT NULL
        AND cp.naming_strokes <> cp.strict_kangxi_strokes
    `).all(releaseId) as Array<{
      id: number;
      glyph: string;
      naming_strokes: number;
      strict_kangxi_strokes: number;
    }>;
    for (const row of conflicts) this.addIssue(releaseId, {
      characterId: row.id,
      severity: "error",
      code: "AUTO_WEBSITE_NAMING_KANGXI_STROKE_CONFLICT",
      fieldName: "naming_strokes/strict_kangxi_strokes",
      observed: { naming: row.naming_strokes, strictKangxi: row.strict_kangxi_strokes },
      expected: "equal values for the same website glyph",
      message: `${row.glyph} has different website naming and strict Kangxi stroke values`,
    });

    const missingDecisions = this.database.prepare(`
      SELECT c.id, c.glyph, policy.field_name, expected.expected_value, policy.rule_code
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
      WHERE c.release_id = ? AND NOT EXISTS (
        SELECT 1 FROM canonical_decisions decision
        WHERE decision.release_id = c.release_id
          AND decision.character_id = c.id
          AND decision.field_name = policy.field_name
          AND decision.rule_code = policy.rule_code
          AND CAST(json_extract(decision.selected_value_json, '$') AS INTEGER) = expected.expected_value
      )
    `).all(releaseId) as Array<{
      id: number;
      glyph: string;
      field_name: string;
      expected_value: number;
      rule_code: string;
    }>;
    for (const row of missingDecisions) this.addIssue(releaseId, {
      characterId: row.id,
      severity: "error",
      code: "AUTO_WEBSITE_STROKE_POLICY_DECISION_MISSING",
      fieldName: row.field_name,
      observed: { value: row.expected_value, ruleCode: row.rule_code },
      expected: "matching canonical_decisions record",
      message: `${row.glyph} has a website stroke value without a matching canonical policy decision`,
    });
  }

  private strokePolicySummary(releaseId: string): StrokePolicySummary {
    const row = this.database.prepare(`
      SELECT
        COUNT(*) total_characters,
        SUM(CASE WHEN cp.naming_strokes IS NOT NULL THEN 1 ELSE 0 END) naming_available,
        SUM(CASE WHEN cp.strict_kangxi_strokes IS NOT NULL THEN 1 ELSE 0 END) strict_available,
        SUM(CASE WHEN cp.naming_strokes IS NOT NULL AND cp.strict_kangxi_strokes IS NOT NULL THEN 1 ELSE 0 END) both_available,
        SUM(CASE WHEN cp.naming_strokes IS NOT NULL AND cp.strict_kangxi_strokes IS NOT NULL
          AND cp.naming_strokes = cp.strict_kangxi_strokes THEN 1 ELSE 0 END) equal_both,
        SUM(CASE WHEN cp.naming_strokes IS NOT NULL AND cp.strict_kangxi_strokes IS NOT NULL
          AND cp.naming_strokes <> cp.strict_kangxi_strokes THEN 1 ELSE 0 END) conflicts,
        SUM(CASE WHEN c.codepoint BETWEEN 19968 AND 40959 THEN 1 ELSE 0 END) basic_characters,
        SUM(CASE WHEN c.codepoint BETWEEN 19968 AND 40959 AND cp.naming_strokes IS NULL THEN 1 ELSE 0 END) basic_missing_naming,
        SUM(CASE WHEN c.codepoint BETWEEN 19968 AND 40959 AND cp.strict_kangxi_strokes IS NULL THEN 1 ELSE 0 END) basic_missing_strict,
        SUM(CASE WHEN cp.common_flag = 1 THEN 1 ELSE 0 END) common_characters,
        SUM(CASE WHEN cp.common_flag = 1 AND cp.naming_strokes IS NULL THEN 1 ELSE 0 END) common_missing_naming,
        SUM(CASE WHEN cp.common_flag = 1 AND cp.strict_kangxi_strokes IS NULL THEN 1 ELSE 0 END) common_missing_strict
      FROM characters c JOIN canonical_profiles cp ON cp.character_id = c.id
      WHERE c.release_id = ?
    `).get(releaseId) as Record<string, number>;
    return {
      canonicalSource: "kangxizidian.cn",
      modernStrokeRole: "reference_only",
      totalCharacters: row.total_characters ?? 0,
      namingAvailable: row.naming_available ?? 0,
      strictKangxiAvailable: row.strict_available ?? 0,
      bothAvailable: row.both_available ?? 0,
      equalWhenBothAvailable: row.equal_both ?? 0,
      conflicts: row.conflicts ?? 0,
      basicCharacters: row.basic_characters ?? 0,
      basicMissingNaming: row.basic_missing_naming ?? 0,
      basicMissingStrictKangxi: row.basic_missing_strict ?? 0,
      commonCharacters: row.common_characters ?? 0,
      commonMissingNaming: row.common_missing_naming ?? 0,
      commonMissingStrictKangxi: row.common_missing_strict ?? 0,
    };
  }

  private validateNamingPercentages(releaseId: string): void {
    const rows = this.database.prepare(`
      SELECT c.id character_id, c.glyph, np.male_percent, np.female_percent
      FROM characters c JOIN source_characters sc ON sc.id = c.source_character_id
      JOIN naming_profiles np ON np.source_character_id = sc.id
      WHERE c.release_id = ? AND np.male_percent IS NOT NULL AND np.female_percent IS NOT NULL
        AND np.male_percent + np.female_percent <> 100
    `).all(releaseId) as Array<{ character_id: number; glyph: string; male_percent: number; female_percent: number }>;
    for (const row of rows) this.addIssue(releaseId, {
      characterId: row.character_id, severity: "error", code: "AUTO_GENDER_PERCENT_TOTAL_INVALID",
      observed: { male: row.male_percent, female: row.female_percent }, expected: { total: 100 },
      message: `${row.glyph} male/female percentages do not total 100`,
    });
  }

  private validateIndexCounts(releaseId: string): void {
    const groups = this.database.prepare(`
      SELECT g.id, g.page_id, g.group_key, g.declared_count, g.seo_declared_count,
        CASE WHEN instr(g.group_key, ':') > 0 THEN CAST(substr(g.group_key, 1, instr(g.group_key, ':') - 1) AS INTEGER) END stroke_count,
        CASE WHEN instr(g.group_key, ':') > 0 THEN substr(g.group_key, instr(g.group_key, ':') + 1) END element
      FROM source_index_groups g JOIN source_pages p ON p.id = g.page_id JOIN crawl_runs r ON r.id = p.run_id
      WHERE r.release_id = ?
    `).all(releaseId) as Array<{ id: number; page_id: number; group_key: string; declared_count: number | null; seo_declared_count: number | null; stroke_count: number | null; element: string | null }>;
    const actualRows = this.database.prepare(`
      SELECT e.stroke_count, e.element, COUNT(DISTINCT e.character_url) count
      FROM source_index_entries e JOIN crawl_runs r ON r.id = e.run_id
      WHERE r.release_id = ? AND e.stroke_count IS NOT NULL AND e.element IS NOT NULL
      GROUP BY e.stroke_count, e.element
    `).all(releaseId) as Array<{ stroke_count: number; element: string; count: number }>;
    const actualByStrokeElement = new Map(
      actualRows.map((row) => [`${row.stroke_count}:${row.element}`, row.count]),
    );
    for (const group of groups) {
      if (group.declared_count !== null && group.stroke_count && group.element) {
        const actual = actualByStrokeElement.get(`${group.stroke_count}:${group.element}`) ?? 0;
        if (actual < group.declared_count) this.addIssue(releaseId, {
          sourcePageId: group.page_id, severity: "info", code: "AUTO_INDEX_COUNT_SHORTFALL",
          observed: actual, expected: group.declared_count,
          message: `Index ${group.group_key} exposes fewer unique character links than declared`,
        });
      }
      if (group.seo_declared_count !== null && group.declared_count !== null && group.seo_declared_count !== group.declared_count) {
        this.addIssue(releaseId, {
          sourcePageId: group.page_id, severity: "info", code: "AUTO_SEO_COUNT_CONFLICT",
          observed: group.seo_declared_count, expected: group.declared_count,
          message: "SEO description count conflicts with the structured index count and is not trusted",
        });
      }
    }
  }

  private validateInternalTextConflicts(releaseId: string): void {
    const rows = this.database.prepare(`
      SELECT c.id character_id, c.glyph, np.element, np.taboos_text
      FROM characters c JOIN source_characters sc ON sc.id = c.source_character_id
      JOIN naming_profiles np ON np.source_character_id = sc.id WHERE c.release_id = ? AND np.taboos_text IS NOT NULL
    `).all(releaseId) as Array<{ character_id: number; glyph: string; element: string | null; taboos_text: string }>;
    for (const row of rows) {
      const stated = row.taboos_text.match(/五行属性为([金木水火土])/)?.[1] ?? null;
      if (row.element && stated && row.element !== stated) this.addIssue(releaseId, {
        characterId: row.character_id, severity: "info", code: "AUTO_ELEMENT_TEXT_CONFLICT", fieldName: "element",
        observed: { structured: row.element, tabooText: stated }, expected: "same element",
        message: `${row.glyph} has conflicting element values between structured fields and taboo text`,
      });
    }
  }

  private validateKnownStrokeCases(releaseId: string): void {
    const rows = this.database.prepare(`
      SELECT c.id, c.glyph, cp.naming_strokes, cp.strict_kangxi_strokes FROM characters c
      JOIN canonical_profiles cp ON cp.character_id = c.id WHERE c.release_id = ? AND c.glyph IN ('阳', '陽')
    `).all(releaseId) as Array<{ id: number; glyph: string; naming_strokes: number | null; strict_kangxi_strokes: number | null }>;
    const simple = rows.find((row) => row.glyph === "阳");
    const traditional = rows.find((row) => row.glyph === "陽");
    if (simple && traditional && simple.naming_strokes !== traditional.strict_kangxi_strokes) this.addIssue(releaseId, {
      characterId: simple.id, severity: "info", code: "AUTO_YANG_STROKE_DISTINCTION",
      observed: { simplifiedNaming: simple.naming_strokes, traditionalStrict: traditional.strict_kangxi_strokes },
      expected: "kept as separate stroke observations", message: "阳/陽 stroke distinction is preserved instead of overwritten",
    });
  }

  private validateMediaCoverage(releaseId: string): void {
    const missing = this.database.prepare(`
      SELECT spa.page_id, spa.asset_id, spa.role FROM source_page_assets spa
      JOIN source_pages p ON p.id = spa.page_id JOIN crawl_runs r ON r.id = p.run_id
      LEFT JOIN source_assets a ON a.id = spa.asset_id
      WHERE r.release_id = ? AND (a.id IS NULL OR a.status <> 'success')
    `).all(releaseId) as Array<{ page_id: number; asset_id: number; role: string }>;
    for (const row of missing) this.addIssue(releaseId, {
      sourcePageId: row.page_id, sourceAssetId: row.asset_id, severity: "info", code: "AUTO_DECLARED_MEDIA_UNAVAILABLE",
      observed: row.role, expected: "successfully archived asset", message: "A page-declared media resource is unavailable locally",
    });
    const malformed = this.database.prepare(`
      SELECT a.id, a.asset_kind, a.content_type, a.byte_length FROM source_assets a
      JOIN crawl_runs r ON r.id = a.run_id WHERE r.release_id = ? AND a.status = 'success' AND (
        COALESCE(a.byte_length, 0) <= 0
        OR (a.asset_kind IN ('glyph', 'inline_glyph') AND COALESCE(a.content_type, '') NOT LIKE 'image/%')
        OR (a.asset_kind IN ('pinyin_audio', 'zhuyin_audio') AND COALESCE(a.content_type, '') NOT LIKE 'audio/%')
        OR (a.asset_kind = 'scan_image' AND COALESCE(a.content_type, '') NOT LIKE 'image/%')
      )
    `).all(releaseId) as Array<{ id: number; asset_kind: string; content_type: string | null; byte_length: number | null }>;
    for (const row of malformed) this.addIssue(releaseId, {
      sourceAssetId: row.id, severity: "error", code: "AUTO_MEDIA_FORMAT_INVALID",
      observed: row, expected: "non-empty media with matching content type",
      message: "Archived media cannot be validated as the declared resource type",
    });
  }

  private addIssue(releaseId: string, issue: IssueInput): void {
    const now = nowIso();
    const observedJson = issue.observed === undefined ? null : JSON.stringify(issue.observed);
    const expectedJson = issue.expected === undefined ? null : JSON.stringify(issue.expected);
    const duplicate = this.database.prepare(`
      SELECT id, observed_json, expected_json, message FROM validation_issues WHERE release_id = ? AND code = ?
        AND COALESCE(run_id, '') = COALESCE(?, '')
        AND COALESCE(source_page_id, -1) = COALESCE(?, -1)
        AND COALESCE(source_asset_id, -1) = COALESCE(?, -1)
        AND COALESCE(character_id, -1) = COALESCE(?, -1)
        LIMIT 1
    `).get(
      releaseId, issue.code, issue.runId ?? null, issue.sourcePageId ?? null,
      issue.sourceAssetId ?? null, issue.characterId ?? null,
    ) as { id: number; observed_json: string | null; expected_json: string | null; message: string } | undefined;
    if (duplicate) {
      if (duplicate.observed_json !== observedJson || duplicate.expected_json !== expectedJson || duplicate.message !== issue.message) {
        this.database.prepare(`
          UPDATE validation_issues SET severity = ?, field_name = ?, observed_json = ?, expected_json = ?, message = ?,
            resolution_status = 'open', resolution_note = NULL, updated_at = ? WHERE id = ?
        `).run(issue.severity, issue.fieldName ?? null, observedJson, expectedJson, issue.message, now, duplicate.id);
      }
      return;
    }
    this.database.prepare(`
      INSERT INTO validation_issues (
        release_id, run_id, source_page_id, source_asset_id, character_id, severity, code, field_name,
        observed_json, expected_json, message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      releaseId, issue.runId ?? null, issue.sourcePageId ?? null, issue.sourceAssetId ?? null,
      issue.characterId ?? null, issue.severity, issue.code, issue.fieldName ?? null,
      observedJson, expectedJson, issue.message, now, now,
    );
  }

  private writeReports(summary: Omit<ValidationSummary, "reportJsonPath" | "reportHtmlPath" | "strokeMissingBasicCsvPath" | "strokeMissingCommonCsvPath">) {
    if (!this.config) return {
      reportJsonPath: "",
      reportHtmlPath: "",
      strokeMissingBasicCsvPath: "",
      strokeMissingCommonCsvPath: "",
    };
    const directory = path.join(this.config.workRoot, "reports", summary.releaseId);
    mkdirSync(directory, { recursive: true });
    const issueRows = this.database.prepare(`
      SELECT id, severity, code, field_name, message, observed_json, expected_json, resolution_status, resolution_note
      FROM validation_issues WHERE release_id = ? ORDER BY CASE severity WHEN 'error' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, id
    `).all(summary.releaseId);
    const report = { ...summary, issuesDetail: issueRows };
    const json = JSON.stringify(report, null, 2);
    const jsonPath = path.join(directory, "validation.json");
    writeFileSync(jsonPath, `${json}\n`, "utf8");
    const rows = (issueRows as Array<Record<string, unknown>>).map((issue) => `<tr><td>${escapeHtml(String(issue.id))}</td><td>${escapeHtml(String(issue.severity))}</td><td>${escapeHtml(String(issue.code))}</td><td>${escapeHtml(String(issue.message))}</td><td>${escapeHtml(String(issue.resolution_status))}</td></tr>`).join("\n");
    const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${escapeHtml(summary.releaseId)} 验证报告</title><style>body{font:14px/1.6 system-ui;margin:32px;color:#222}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f6f3ed}.error{color:#b42318}</style><h1>康熙字典母库验证报告</h1><pre>${escapeHtml(JSON.stringify(summary, null, 2))}</pre><table><thead><tr><th>ID</th><th>级别</th><th>代码</th><th>说明</th><th>状态</th></tr></thead><tbody>${rows}</tbody></table><p>报告 SHA-256：${sha256(json)}</p></html>`;
    const htmlPath = path.join(directory, "validation.html");
    writeFileSync(htmlPath, html, "utf8");
    const basicCsvPath = path.join(directory, "stroke-missing-basic.csv");
    const commonCsvPath = path.join(directory, "stroke-missing-common.csv");
    writeFileSync(basicCsvPath, this.strokeMissingCsv(summary.releaseId, "basic"), "utf8");
    writeFileSync(commonCsvPath, this.strokeMissingCsv(summary.releaseId, "common"), "utf8");
    return {
      reportJsonPath: path.relative(this.config.dataRoot, jsonPath),
      reportHtmlPath: path.relative(this.config.dataRoot, htmlPath),
      strokeMissingBasicCsvPath: path.relative(this.config.dataRoot, basicCsvPath),
      strokeMissingCommonCsvPath: path.relative(this.config.dataRoot, commonCsvPath),
    };
  }

  private strokeMissingCsv(releaseId: string, scope: "basic" | "common"): string {
    const predicate = scope === "basic"
      ? "c.codepoint BETWEEN 19968 AND 40959"
      : "cp.common_flag = 1";
    const rows = this.database.prepare(`
      SELECT c.glyph, printf('U+%04X', c.codepoint) codepoint, cp.primary_pinyin,
        cp.naming_strokes, cp.strict_kangxi_strokes,
        cp.naming_strokes_absence_reason, cp.strict_kangxi_strokes_absence_reason,
        sc.source_url
      FROM characters c JOIN canonical_profiles cp ON cp.character_id = c.id
      LEFT JOIN source_characters sc ON sc.id = c.source_character_id
      WHERE c.release_id = ? AND ${predicate}
        AND (cp.naming_strokes IS NULL OR cp.strict_kangxi_strokes IS NULL)
      ORDER BY c.codepoint
    `).all(releaseId) as Array<Record<string, string | number | null>>;
    const columns = [
      "glyph", "codepoint", "primary_pinyin", "naming_strokes", "strict_kangxi_strokes",
      "naming_strokes_absence_reason", "strict_kangxi_strokes_absence_reason", "source_url",
    ];
    return `${columns.join(",")}\n${rows.map((row) => columns.map((column) => csvValue(row[column])).join(",")).join("\n")}\n`;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function csvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
