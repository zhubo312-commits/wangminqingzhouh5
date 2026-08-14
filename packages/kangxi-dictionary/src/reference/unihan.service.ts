import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type BetterSqlite3 from "better-sqlite3";
import type { KangxiConfig } from "../shared/config.js";
import { nowIso } from "../shared/database.js";
import { KangxiError } from "../shared/errors.js";
import { sha256 } from "../shared/hash.js";
import { plainPinyin } from "../shared/unicode.js";

const SOURCE_NAME = "Unicode Unihan";
const DEFAULT_LICENSE_URL = "https://www.unicode.org/license.txt";
const WANTED_PROPERTIES = new Set([
  "kMandarin",
  "kHanyuPinyin",
  "kTotalStrokes",
  "kAlternateTotalStrokes",
  "kKangXi",
  "kIRGKangXi",
  "kSimplifiedVariant",
  "kTraditionalVariant",
]);

interface SourceFile {
  name: string;
  bytes: Buffer;
}

interface CharacterRow {
  id: number;
  codepoint: number;
  primary_pinyin: string | null;
  modern_strokes: number | null;
  source_summary_json: string | null;
  has_profile: number;
}

interface ParsedObservation {
  characterId: number;
  codepoint: number;
  propertyName: string;
  rawValue: string;
  normalizedValue: unknown;
  sourceFile: string;
  sourceLine: number;
}

interface CharacterReferences {
  mandarin: string[];
  hanyu: string[];
  totalStrokes: number[];
  alternateTotalStrokes: number[];
  simplified: number[];
  traditional: number[];
}

export interface UnihanImportOptions {
  sourcePath: string;
  version: string;
  sourceUrl?: string;
  licenseUrl?: string;
  promoteSafe?: boolean;
}

export interface UnihanImportSummary {
  releaseId: string;
  referenceDatasetId: string;
  version: string;
  artifactSha256: string;
  files: number;
  parsedRows: number;
  matchedObservations: number;
  unmatchedObservations: number;
  pronunciationsStored: number;
  modernStrokeObservationsStored: number;
  formRelationsStored: number;
  unmatchedVariantTargets: number;
  promoted: { primaryPinyin: number; modernStrokes: number };
  canonicalDecisions: { primaryPinyin: number; modernStrokes: number };
  conflicts: { modernStrokes: number };
  propertyCounts: Record<string, number>;
}

export class UnihanService {
  constructor(
    private readonly database: BetterSqlite3.Database,
    private readonly config: KangxiConfig,
  ) {}

  import(releaseId: string, options: UnihanImportOptions): UnihanImportSummary {
    const release = this.database.prepare("SELECT status FROM dataset_releases WHERE id = ?")
      .get(releaseId) as { status: string } | undefined;
    if (!release) throw new KangxiError("dataset release not found", "NOT_FOUND", { releaseId });
    if (release.status !== "candidate") throw new KangxiError(
      "reference data can only be imported into a candidate release",
      "REFERENCE_IMPORT_REJECTED",
      { releaseId, status: release.status },
    );
    if (!/^\d+\.\d+\.\d+$/.test(options.version)) throw new KangxiError(
      "Unihan version must use the major.minor.patch form",
      "CLI_USAGE",
      { version: options.version },
    );

    const absoluteSource = path.resolve(options.sourcePath);
    if (!existsSync(absoluteSource)) throw new KangxiError(
      "Unihan source does not exist",
      "NOT_FOUND",
      { sourcePath: absoluteSource },
    );
    const files = this.loadSourceFiles(absoluteSource);
    if (files.length === 0) throw new KangxiError(
      "Unihan source does not contain any Unihan_*.txt files",
      "REFERENCE_IMPORT_REJECTED",
      { sourcePath: absoluteSource },
    );

    const artifactSha256 = statSync(absoluteSource).isFile()
      ? sha256(readFileSync(absoluteSource))
      : sha256(files.map((file) => `${file.name}\0${sha256(file.bytes)}`).sort().join("\n"));
    const referenceDatasetId = `unicode-unihan-${options.version}.${artifactSha256.slice(0, 12)}`;
    const sourceUrl = options.sourceUrl ?? `https://www.unicode.org/Public/${options.version}/ucd/Unihan.zip`;
    const licenseUrl = options.licenseUrl ?? DEFAULT_LICENSE_URL;
    const archivedFiles = this.archiveSource(absoluteSource, files, options.version, artifactSha256);
    const characterRows = this.database.prepare(`
      SELECT c.id, c.codepoint, cp.primary_pinyin, cp.modern_strokes, cp.source_summary_json,
        CASE WHEN cp.character_id IS NULL THEN 0 ELSE 1 END has_profile
      FROM characters c LEFT JOIN canonical_profiles cp ON cp.character_id = c.id
      WHERE c.release_id = ?
    `).all(releaseId) as CharacterRow[];
    const charactersByCodepoint = new Map(characterRows.map((row) => [row.codepoint, row]));
    const referencesByCharacter = new Map<number, CharacterReferences>();
    const observations: ParsedObservation[] = [];
    const propertyCounts: Record<string, number> = {};
    let parsedRows = 0;
    let unmatchedObservations = 0;

    for (const file of files) {
      const lines = file.bytes.toString("utf8").split(/\r?\n/);
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]!;
        if (!line || line.startsWith("#")) continue;
        const [codepointLabel, propertyName, rawValue] = line.split("\t", 3);
        if (!codepointLabel || !propertyName || rawValue === undefined || !WANTED_PROPERTIES.has(propertyName)) continue;
        const codepoint = parseCodepoint(codepointLabel);
        if (codepoint === null) continue;
        parsedRows += 1;
        propertyCounts[propertyName] = (propertyCounts[propertyName] ?? 0) + 1;
        const character = charactersByCodepoint.get(codepoint);
        if (!character) {
          unmatchedObservations += 1;
          continue;
        }
        const normalizedValue = normalizeProperty(propertyName, rawValue);
        observations.push({
          characterId: character.id,
          codepoint,
          propertyName,
          rawValue,
          normalizedValue,
          sourceFile: file.name,
          sourceLine: index + 1,
        });
        const references = getOrCreateReferences(referencesByCharacter, character.id);
        if (propertyName === "kMandarin") references.mandarin.push(...readPinyinValues(normalizedValue));
        if (propertyName === "kHanyuPinyin") references.hanyu.push(...readPinyinValues(normalizedValue));
        if (propertyName === "kTotalStrokes") references.totalStrokes.push(...readNumberValues(normalizedValue));
        if (propertyName === "kAlternateTotalStrokes") references.alternateTotalStrokes.push(...readNumberValues(normalizedValue));
        if (propertyName === "kSimplifiedVariant") references.simplified.push(...readVariantCodepoints(normalizedValue));
        if (propertyName === "kTraditionalVariant") references.traditional.push(...readVariantCodepoints(normalizedValue));
      }
    }

    const result = this.database.transaction(() => {
      const now = nowIso();
      this.database.prepare(`
        INSERT INTO reference_datasets (
          id, source_name, source_version, source_url, license_url, artifact_sha256,
          metadata_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          source_url = excluded.source_url, license_url = excluded.license_url,
          metadata_json = excluded.metadata_json, updated_at = excluded.updated_at
      `).run(
        referenceDatasetId,
        SOURCE_NAME,
        options.version,
        sourceUrl,
        licenseUrl,
        artifactSha256,
        JSON.stringify({
          selectedProperties: [...WANTED_PROPERTIES],
          safePromotionRules: ["kMandarin -> primary_pinyin when missing", "unambiguous kTotalStrokes -> modern_strokes when missing"],
          excludedPromotions: ["naming_strokes", "strict_kangxi_strokes", "element"],
        }),
        now,
        now,
      );
      const fileStatement = this.database.prepare(`
        INSERT INTO reference_dataset_files (
          reference_dataset_id, file_name, local_path, content_sha256, byte_length, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(reference_dataset_id, file_name) DO UPDATE SET
          local_path = excluded.local_path, content_sha256 = excluded.content_sha256,
          byte_length = excluded.byte_length, updated_at = excluded.updated_at
      `);
      for (const file of archivedFiles) fileStatement.run(
        referenceDatasetId,
        file.name,
        file.localPath,
        file.contentSha256,
        file.byteLength,
        now,
        now,
      );

      const observationStatement = this.database.prepare(`
        INSERT INTO reference_observations (
          release_id, reference_dataset_id, character_id, property_name, raw_value,
          normalized_value_json, source_file, source_line, source_reference, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(release_id, reference_dataset_id, character_id, property_name, raw_value) DO UPDATE SET
          normalized_value_json = excluded.normalized_value_json, source_file = excluded.source_file,
          source_line = excluded.source_line, source_reference = excluded.source_reference,
          updated_at = excluded.updated_at
      `);
      for (const observation of observations) observationStatement.run(
        releaseId,
        referenceDatasetId,
        observation.characterId,
        observation.propertyName,
        observation.rawValue,
        JSON.stringify(observation.normalizedValue),
        observation.sourceFile,
        observation.sourceLine,
        `${sourceUrl}#${observation.propertyName}`,
        now,
        now,
      );

      this.database.prepare(`
        DELETE FROM pronunciations WHERE source_name = ?
          AND character_id IN (SELECT id FROM characters WHERE release_id = ?)
      `).run(referenceDatasetId, releaseId);
      this.database.prepare(`
        DELETE FROM stroke_observations WHERE source_name = ?
          AND character_id IN (SELECT id FROM characters WHERE release_id = ?)
      `).run(referenceDatasetId, releaseId);
      this.database.prepare("DELETE FROM character_forms WHERE release_id = ? AND source_name = ?")
        .run(releaseId, referenceDatasetId);

      const pronunciationStatement = this.database.prepare(`
        INSERT INTO pronunciations (
          character_id, pinyin, plain_pinyin, zhuyin, ordinal, is_primary, source_name, created_at, updated_at
        ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)
      `);
      const strokeStatement = this.database.prepare(`
        INSERT OR IGNORE INTO stroke_observations (
          character_id, stroke_kind, glyph_context, stroke_count, source_name,
          source_reference, is_selected, created_at, updated_at
        ) VALUES (?, 'modern', ?, ?, ?, ?, ?, ?, ?)
      `);
      const formStatement = this.database.prepare(`
        INSERT OR IGNORE INTO character_forms (
          release_id, from_character_id, to_character_id, relation_type, source_name,
          source_reference, is_preferred, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const profileUpdate = this.database.prepare(`
        UPDATE canonical_profiles SET
          primary_pinyin = CASE WHEN primary_pinyin IS NULL OR trim(primary_pinyin) = '' THEN ? ELSE primary_pinyin END,
          plain_pinyin = CASE WHEN plain_pinyin IS NULL OR trim(plain_pinyin) = '' THEN ? ELSE plain_pinyin END,
          modern_strokes = COALESCE(modern_strokes, ?),
          modern_strokes_absence_reason = CASE WHEN modern_strokes IS NULL AND ? IS NOT NULL THEN NULL ELSE modern_strokes_absence_reason END,
          source_summary_json = ?, updated_at = ?
        WHERE character_id = ?
      `);
      const decisionStatement = this.database.prepare(`
        INSERT INTO canonical_decisions (
          release_id, character_id, field_name, selected_value_json, rule_code,
          rationale, decided_by, decided_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(release_id, character_id, field_name, rule_code) DO UPDATE SET
          selected_value_json = excluded.selected_value_json,
          rationale = excluded.rationale,
          decided_by = excluded.decided_by,
          updated_at = excluded.updated_at
      `);

      let pronunciationsStored = 0;
      let modernStrokeObservationsStored = 0;
      let formRelationsStored = 0;
      let unmatchedVariantTargets = 0;
      let promotedPrimaryPinyin = 0;
      let promotedModernStrokes = 0;
      let modernStrokeConflicts = 0;

      for (const row of characterRows) {
        const values = referencesByCharacter.get(row.id);
        if (!values) continue;
        values.mandarin = unique(values.mandarin);
        values.hanyu = unique(values.hanyu);
        values.totalStrokes = unique(values.totalStrokes);
        values.alternateTotalStrokes = unique(values.alternateTotalStrokes);
        values.simplified = unique(values.simplified);
        values.traditional = unique(values.traditional);

        const readings = unique([...values.mandarin, ...values.hanyu]);
        const promotePinyin = Boolean(
          options.promoteSafe && row.has_profile && !row.primary_pinyin && values.mandarin.length > 0,
        );
        for (const [ordinal, pinyin] of readings.entries()) {
          pronunciationStatement.run(
            row.id,
            pinyin,
            plainPinyin(pinyin),
            ordinal,
            promotePinyin && ordinal === 0 ? 1 : 0,
            referenceDatasetId,
            now,
            now,
          );
          pronunciationsStored += 1;
        }

        const promoteStroke = Boolean(
          options.promoteSafe && row.has_profile && row.modern_strokes === null && values.totalStrokes.length === 1,
        );
        for (const strokeCount of values.totalStrokes) {
          strokeStatement.run(
            row.id,
            "unihan:kTotalStrokes",
            strokeCount,
            referenceDatasetId,
            `${sourceUrl}#kTotalStrokes`,
            promoteStroke ? 1 : 0,
            now,
            now,
          );
          modernStrokeObservationsStored += 1;
        }
        for (const strokeCount of values.alternateTotalStrokes) {
          strokeStatement.run(
            row.id,
            "unihan:kAlternateTotalStrokes",
            strokeCount,
            referenceDatasetId,
            `${sourceUrl}#kAlternateTotalStrokes`,
            0,
            now,
            now,
          );
          modernStrokeObservationsStored += 1;
        }
        if (row.modern_strokes !== null && values.totalStrokes.length > 0 && !values.totalStrokes.includes(row.modern_strokes)) {
          modernStrokeConflicts += 1;
        }

        for (const [relationType, targetCodepoints] of [
          ["simplified", values.simplified],
          ["traditional", values.traditional],
        ] as const) {
          for (const targetCodepoint of targetCodepoints) {
            const target = charactersByCodepoint.get(targetCodepoint);
            if (!target || target.id === row.id) {
              unmatchedVariantTargets += 1;
              continue;
            }
            const inserted = formStatement.run(
              releaseId,
              row.id,
              target.id,
              relationType,
              referenceDatasetId,
              `${sourceUrl}#k${relationType === "simplified" ? "Simplified" : "Traditional"}Variant`,
              targetCodepoints.length === 1 ? 1 : 0,
              now,
              now,
            ).changes;
            formRelationsStored += inserted;
          }
        }

        if (promotePinyin || promoteStroke) {
          const promotedPinyin = promotePinyin ? values.mandarin[0]! : null;
          const promotedStroke = promoteStroke ? values.totalStrokes[0]! : null;
          const summary = parseSourceSummary(row.source_summary_json);
          const references = typeof summary.references === "object" && summary.references !== null
            ? summary.references as Record<string, unknown>
            : {};
          references[referenceDatasetId] = {
            sourceUrl,
            pinyinProperty: promotePinyin ? "kMandarin" : null,
            modernStrokeProperty: promoteStroke ? "kTotalStrokes" : null,
          };
          summary.references = references;
          profileUpdate.run(
            promotedPinyin,
            promotedPinyin ? plainPinyin(promotedPinyin) : null,
            promotedStroke,
            promotedStroke,
            JSON.stringify(summary),
            now,
            row.id,
          );
          if (promotePinyin) promotedPrimaryPinyin += 1;
          if (promoteStroke) promotedModernStrokes += 1;
        }

        const currentSummary = parseSourceSummary(row.source_summary_json);
        const currentReferences = typeof currentSummary.references === "object" && currentSummary.references !== null
          ? currentSummary.references as Record<string, unknown>
          : {};
        const priorReference = typeof currentReferences[referenceDatasetId] === "object"
          && currentReferences[referenceDatasetId] !== null
          ? currentReferences[referenceDatasetId] as Record<string, unknown>
          : {};
        const decidedPinyin = promotePinyin ? values.mandarin[0]! : row.primary_pinyin;
        if (promotePinyin || priorReference.pinyinProperty === "kMandarin") decisionStatement.run(
          releaseId,
          row.id,
          "primary_pinyin",
          JSON.stringify(decidedPinyin),
          "UNIHAN_KMANDARIN_FILL_MISSING",
          "The website primary pinyin was missing; Unicode Unihan kMandarin supplied the canonical fallback without overwriting source evidence.",
          referenceDatasetId,
          now,
          now,
          now,
        );
        const decidedModernStrokes = promoteStroke ? values.totalStrokes[0]! : row.modern_strokes;
        if (promoteStroke || priorReference.modernStrokeProperty === "kTotalStrokes") decisionStatement.run(
          releaseId,
          row.id,
          "modern_strokes",
          JSON.stringify(decidedModernStrokes),
          "UNIHAN_KTOTALSTROKES_FILL_MISSING",
          "The website modern stroke count was missing; one unambiguous Unicode Unihan kTotalStrokes value supplied the canonical fallback.",
          referenceDatasetId,
          now,
          now,
          now,
        );
      }

      const decisionRows = this.database.prepare(`
        SELECT rule_code, COUNT(*) count FROM canonical_decisions
        WHERE release_id = ? AND decided_by = ?
          AND rule_code IN ('UNIHAN_KMANDARIN_FILL_MISSING', 'UNIHAN_KTOTALSTROKES_FILL_MISSING')
        GROUP BY rule_code
      `).all(releaseId, referenceDatasetId) as Array<{ rule_code: string; count: number }>;
      const decisionCounts = Object.fromEntries(decisionRows.map((row) => [row.rule_code, row.count]));
      this.database.prepare(`
        UPDATE reference_datasets SET metadata_json = ?, updated_at = ? WHERE id = ?
      `).run(JSON.stringify({
        selectedProperties: [...WANTED_PROPERTIES],
        safePromotionRules: ["kMandarin -> primary_pinyin when missing", "unambiguous kTotalStrokes -> modern_strokes when missing"],
        excludedPromotions: ["naming_strokes", "strict_kangxi_strokes", "element"],
        importCoverage: {
          parsedRows,
          matchedObservations: observations.length,
          unmatchedObservations,
          propertyCounts,
        },
        canonicalDecisions: {
          primaryPinyin: decisionCounts.UNIHAN_KMANDARIN_FILL_MISSING ?? 0,
          modernStrokes: decisionCounts.UNIHAN_KTOTALSTROKES_FILL_MISSING ?? 0,
        },
      }), now, referenceDatasetId);

      return {
        pronunciationsStored,
        modernStrokeObservationsStored,
        formRelationsStored,
        unmatchedVariantTargets,
        promotedPrimaryPinyin,
        promotedModernStrokes,
        modernStrokeConflicts,
        canonicalPinyinDecisions: decisionCounts.UNIHAN_KMANDARIN_FILL_MISSING ?? 0,
        canonicalModernStrokeDecisions: decisionCounts.UNIHAN_KTOTALSTROKES_FILL_MISSING ?? 0,
      };
    })();

    return {
      releaseId,
      referenceDatasetId,
      version: options.version,
      artifactSha256,
      files: archivedFiles.length,
      parsedRows,
      matchedObservations: observations.length,
      unmatchedObservations,
      pronunciationsStored: result.pronunciationsStored,
      modernStrokeObservationsStored: result.modernStrokeObservationsStored,
      formRelationsStored: result.formRelationsStored,
      unmatchedVariantTargets: result.unmatchedVariantTargets,
      promoted: {
        primaryPinyin: result.promotedPrimaryPinyin,
        modernStrokes: result.promotedModernStrokes,
      },
      canonicalDecisions: {
        primaryPinyin: result.canonicalPinyinDecisions,
        modernStrokes: result.canonicalModernStrokeDecisions,
      },
      conflicts: { modernStrokes: result.modernStrokeConflicts },
      propertyCounts,
    };
  }

  private loadSourceFiles(sourcePath: string): SourceFile[] {
    if (statSync(sourcePath).isDirectory()) return readdirSync(sourcePath)
      .filter((name) => /^Unihan_.*\.txt$/.test(name))
      .sort()
      .map((name) => ({ name, bytes: readFileSync(path.join(sourcePath, name)) }));
    if (!sourcePath.toLowerCase().endsWith(".zip")) throw new KangxiError(
      "Unihan source must be an extracted directory or a .zip archive",
      "REFERENCE_IMPORT_REJECTED",
      { sourcePath },
    );
    let entries: string[];
    try {
      entries = execFileSync("unzip", ["-Z1", sourcePath], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
        .split(/\r?\n/)
        .filter((name) => /(^|\/)Unihan_.*\.txt$/.test(name))
        .sort();
    } catch (error) {
      throw new KangxiError("Unable to inspect Unihan zip archive", "REFERENCE_IMPORT_REJECTED", {
        sourcePath,
        cause: error instanceof Error ? error.message : String(error),
      });
    }
    return entries.map((entry) => {
      try {
        return {
          name: path.basename(entry),
          bytes: execFileSync("unzip", ["-p", sourcePath, entry], { maxBuffer: 256 * 1024 * 1024 }),
        };
      } catch (error) {
        throw new KangxiError("Unable to read a Unihan file from the zip archive", "REFERENCE_IMPORT_REJECTED", {
          sourcePath,
          entry,
          cause: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  private archiveSource(
    sourcePath: string,
    files: SourceFile[],
    version: string,
    artifactSha256: string,
  ): Array<{ name: string; localPath: string; contentSha256: string; byteLength: number }> {
    const directory = path.join(this.config.workRoot, "reference", "unicode-unihan", version, artifactSha256);
    mkdirSync(directory, { recursive: true });
    if (statSync(sourcePath).isFile()) {
      const target = path.join(directory, "Unihan.zip");
      if (!existsSync(target)) copyFileSync(sourcePath, target);
      const bytes = readFileSync(target);
      if (sha256(bytes) !== artifactSha256) throw new KangxiError(
        "Archived Unihan zip checksum mismatch",
        "REFERENCE_IMPORT_REJECTED",
        { target },
      );
      return [{
        name: "Unihan.zip",
        localPath: path.relative(this.config.dataRoot, target),
        contentSha256: artifactSha256,
        byteLength: bytes.byteLength,
      }];
    }
    return files.map((file) => {
      const target = path.join(directory, file.name);
      if (!existsSync(target)) writeFileSync(target, file.bytes);
      const archived = readFileSync(target);
      const expected = sha256(file.bytes);
      if (sha256(archived) !== expected) throw new KangxiError(
        "Archived Unihan source file checksum mismatch",
        "REFERENCE_IMPORT_REJECTED",
        { target },
      );
      return {
        name: file.name,
        localPath: path.relative(this.config.dataRoot, target),
        contentSha256: expected,
        byteLength: archived.byteLength,
      };
    });
  }
}

function parseCodepoint(value: string): number | null {
  const match = value.match(/^U\+([0-9A-F]{4,6})$/i);
  if (!match) return null;
  const parsed = Number.parseInt(match[1]!, 16);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 0x10ffff ? parsed : null;
}

function normalizeProperty(propertyName: string, rawValue: string): unknown {
  if (propertyName === "kMandarin") return unique(rawValue.split(/\s+/).filter(Boolean));
  if (propertyName === "kHanyuPinyin") {
    const readings: string[] = [];
    for (const group of rawValue.split(/\s+/)) {
      const separator = group.lastIndexOf(":");
      if (separator < 0) continue;
      readings.push(...group.slice(separator + 1).split(",").filter(Boolean));
    }
    return unique(readings);
  }
  if (propertyName === "kTotalStrokes" || propertyName === "kAlternateTotalStrokes") {
    return unique((rawValue.match(/\d+/g) ?? []).map(Number).filter((value) => value > 0));
  }
  if (propertyName === "kSimplifiedVariant" || propertyName === "kTraditionalVariant") {
    const variants = [...rawValue.matchAll(/U\+([0-9A-F]{4,6})/gi)].map((match) => {
      const codepoint = Number.parseInt(match[1]!, 16);
      return { codepoint, glyph: String.fromCodePoint(codepoint) };
    });
    return uniqueBy(variants, (variant) => variant.codepoint);
  }
  return rawValue.split(/\s+/).filter(Boolean);
}

function readPinyinValues(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0) : [];
}

function readNumberValues(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((entry): entry is number => Number.isInteger(entry) && entry > 0) : [];
}

function readVariantCodepoints(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => typeof entry === "object" && entry !== null && "codepoint" in entry
    && typeof entry.codepoint === "number" ? [entry.codepoint] : []);
}

function getOrCreateReferences(map: Map<number, CharacterReferences>, characterId: number): CharacterReferences {
  const existing = map.get(characterId);
  if (existing) return existing;
  const created: CharacterReferences = {
    mandarin: [],
    hanyu: [],
    totalStrokes: [],
    alternateTotalStrokes: [],
    simplified: [],
    traditional: [],
  };
  map.set(characterId, created);
  return created;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function uniqueBy<T>(values: T[], key: (value: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return values.filter((value) => {
    const selected = key(value);
    if (seen.has(selected)) return false;
    seen.add(selected);
    return true;
  });
}

function parseSourceSummary(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}
