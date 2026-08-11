import { randomUUID } from "node:crypto";
import { GuidanceSchema, type Guidance } from "@guoxue/contracts";
import type { DatabaseContext } from "../shared/database/client.js";
import { nowIso } from "../shared/time/beijing-date.js";

export type GuidanceSource = "dify" | "fallback" | "seed";

export interface GuidanceRecord {
  date: string;
  guidance: Guidance;
  source: GuidanceSource;
  sourceDate: string | null;
  workflowRunId: string | null;
  generatedAt: string;
}

interface RawGuidanceRow {
  date: string;
  guidance: string;
  suitableJson: string;
  avoidJson: string;
  source: GuidanceSource;
  sourceDate: string | null;
  workflowRunId: string | null;
  generatedAt: string;
}

function mapGuidanceRow(row: RawGuidanceRow): GuidanceRecord {
  const parsed = GuidanceSchema.parse({
    text: row.guidance,
    suitable: JSON.parse(row.suitableJson),
    avoid: JSON.parse(row.avoidJson),
  });
  return {
    date: row.date,
    guidance: parsed,
    source: row.source,
    sourceDate: row.sourceDate,
    workflowRunId: row.workflowRunId,
    generatedAt: row.generatedAt,
  };
}

export class GuidanceRepository {
  constructor(private readonly database: DatabaseContext) {}

  findByDate(date: string): GuidanceRecord | null {
    const row = this.database.raw
      .prepare(
        `SELECT
          date,
          guidance,
          suitable_json AS suitableJson,
          avoid_json AS avoidJson,
          source,
          source_date AS sourceDate,
          workflow_run_id AS workflowRunId,
          generated_at AS generatedAt
        FROM daily_guidance
        WHERE date = ?`,
      )
      .get(date) as RawGuidanceRow | undefined;
    return row ? mapGuidanceRow(row) : null;
  }

  findRandomRecentSuccessful(
    beforeDate: string,
    earliestDate: string,
  ): GuidanceRecord | null {
    const row = this.database.raw
      .prepare(
        `SELECT
          date,
          guidance,
          suitable_json AS suitableJson,
          avoid_json AS avoidJson,
          source,
          source_date AS sourceDate,
          workflow_run_id AS workflowRunId,
          generated_at AS generatedAt
        FROM daily_guidance
        WHERE source = 'dify'
          AND date < ?
          AND date >= ?
        ORDER BY RANDOM()
        LIMIT 1`,
      )
      .get(beforeDate, earliestDate) as RawGuidanceRow | undefined;
    return row ? mapGuidanceRow(row) : null;
  }

  save(record: GuidanceRecord): GuidanceRecord {
    const timestamp = nowIso();
    this.database.raw
      .prepare(
        `INSERT INTO daily_guidance (
          date, guidance, suitable_json, avoid_json, source,
          source_date, workflow_run_id, generated_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
          guidance = excluded.guidance,
          suitable_json = excluded.suitable_json,
          avoid_json = excluded.avoid_json,
          source = excluded.source,
          source_date = excluded.source_date,
          workflow_run_id = excluded.workflow_run_id,
          generated_at = excluded.generated_at,
          updated_at = excluded.updated_at`,
      )
      .run(
        record.date,
        record.guidance.text,
        JSON.stringify(record.guidance.suitable),
        JSON.stringify(record.guidance.avoid),
        record.source,
        record.sourceDate,
        record.workflowRunId,
        record.generatedAt,
        timestamp,
        timestamp,
      );
    return record;
  }

  recordRun(input: {
    targetDate: string;
    attempt: number;
    status: "success" | "failed" | "skipped" | "fallback";
    errorCode?: string | null;
    errorMessage?: string | null;
    workflowRunId?: string | null;
    startedAt: string;
    finishedAt: string;
  }): void {
    const timestamp = nowIso();
    this.database.raw
      .prepare(
        `INSERT INTO generation_runs (
          id, target_date, attempt, status, error_code, error_message,
          workflow_run_id, started_at, finished_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        randomUUID(),
        input.targetDate,
        input.attempt,
        input.status,
        input.errorCode ?? null,
        input.errorMessage?.slice(0, 500) ?? null,
        input.workflowRunId ?? null,
        input.startedAt,
        input.finishedAt,
        timestamp,
        timestamp,
      );
  }
}
