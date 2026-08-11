import { createHash } from "node:crypto";
import type { BaziChartRequest, BaziChartResponse } from "@guoxue/contracts";
import type { DatabaseContext } from "../shared/database/client.js";

export interface StoredPaipanContext {
  chartType: "shengping_zishi";
  schemaVersion: "guoxue.paipan.bazi.v1";
  chartRequest: BaziChartRequest;
  chart: BaziChartResponse;
  generatedAt: string;
  expiresAt: string;
}

interface PaipanContextRow {
  chart_type: "shengping_zishi";
  schema_version: "guoxue.paipan.bazi.v1";
  chart_request_json: string;
  chart_json: string;
  generated_at: string;
  expires_at: string;
}

export function hashPaipanReference(reference: string): string {
  return createHash("sha256").update(reference).digest("hex");
}

export class PaipanContextRepository {
  constructor(private readonly database: DatabaseContext) {}

  save(reference: string, context: StoredPaipanContext): void {
    this.database.raw
      .prepare(
        `INSERT INTO paipan_contexts (
          reference_hash, chart_type, schema_version, chart_request_json,
          chart_json, generated_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        hashPaipanReference(reference),
        context.chartType,
        context.schemaVersion,
        JSON.stringify(context.chartRequest),
        JSON.stringify(context.chart),
        context.generatedAt,
        context.expiresAt,
      );
  }

  find(reference: string): StoredPaipanContext | null {
    const row = this.database.raw
      .prepare(
        `SELECT chart_type, schema_version, chart_request_json, chart_json,
                generated_at, expires_at
           FROM paipan_contexts
          WHERE reference_hash = ?`,
      )
      .get(hashPaipanReference(reference)) as PaipanContextRow | undefined;

    if (!row) return null;
    return {
      chartType: row.chart_type,
      schemaVersion: row.schema_version,
      chartRequest: JSON.parse(row.chart_request_json) as BaziChartRequest,
      chart: JSON.parse(row.chart_json) as BaziChartResponse,
      generatedAt: row.generated_at,
      expiresAt: row.expires_at,
    };
  }

  delete(reference: string): void {
    this.database.raw
      .prepare("DELETE FROM paipan_contexts WHERE reference_hash = ?")
      .run(hashPaipanReference(reference));
  }

  deleteExpired(nowIso: string): number {
    return this.database.raw
      .prepare("DELETE FROM paipan_contexts WHERE expires_at <= ?")
      .run(nowIso).changes;
  }
}
