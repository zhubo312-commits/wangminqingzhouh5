import { randomBytes } from "node:crypto";
import {
  BaziChartRequestSchema,
  BaziChartResponseSchema,
  DunjiaChartRequestSchema,
  DunjiaChartResponseSchema,
  DunjiaContextResponseSchema,
  PaipanContextResponseSchema,
  type BaziChartRequest,
  type BaziChartResponse,
  type BaziChartWithReference,
  type DunjiaChartRequest,
  type DunjiaChartResponse,
  type DunjiaChartWithReference,
  type DunjiaContextResponse,
  type PaipanContextResponse,
} from "@guoxue/contracts";
import { GoneAppError, NotFoundAppError } from "../shared/errors/app-error.js";
import { PaipanContextRepository } from "./paipan-context.repository.js";

const SCHEMA_VERSION = "guoxue.paipan.bazi.v1" as const;
const CHART_TYPE = "shengping_zishi" as const;
const DUNJIA_SCHEMA_VERSION = "guoxue.paipan.dunjia.v1" as const;
const DUNJIA_CHART_TYPE = "dunjia" as const;

function createReference(): string {
  return `pp_${randomBytes(24).toString("base64url")}`;
}

export class PaipanContextService {
  constructor(
    private readonly repository: PaipanContextRepository,
    private readonly ttlSeconds: number,
  ) {}

  create(
    chartRequest: BaziChartRequest,
    chart: BaziChartResponse,
    now = new Date(),
  ): BaziChartWithReference {
    const paipanRef = createReference();
    const generatedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1_000).toISOString();
    this.repository.deleteExpired(generatedAt);
    this.repository.save(paipanRef, {
      chartType: CHART_TYPE,
      schemaVersion: SCHEMA_VERSION,
      chartRequest,
      chart,
      generatedAt,
      expiresAt,
    });
    return { ...chart, paipan_ref: paipanRef, expiresAt };
  }

  createDunjia(
    chartRequest: DunjiaChartRequest,
    chart: DunjiaChartResponse,
    now = new Date(),
  ): DunjiaChartWithReference {
    const paipanRef = createReference();
    const generatedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1_000).toISOString();
    this.repository.deleteExpired(generatedAt);
    this.repository.save(paipanRef, {
      chartType: DUNJIA_CHART_TYPE,
      schemaVersion: DUNJIA_SCHEMA_VERSION,
      chartRequest,
      chart,
      generatedAt,
      expiresAt,
    });
    return { ...chart, paipan_ref: paipanRef, expiresAt };
  }

  resolve(paipanRef: string, now = new Date()): PaipanContextResponse {
    const stored = this.repository.find(paipanRef);
    if (!stored) {
      throw new NotFoundAppError("PAIPAN_CONTEXT_NOT_FOUND", "未找到对应的排盘信息");
    }
    if (stored.expiresAt <= now.toISOString()) {
      this.repository.delete(paipanRef);
      throw new GoneAppError("PAIPAN_CONTEXT_EXPIRED", "本次排盘信息已过期，请重新排盘");
    }
    if (stored.chartType !== CHART_TYPE || stored.schemaVersion !== SCHEMA_VERSION) {
      throw new NotFoundAppError("PAIPAN_CONTEXT_NOT_FOUND", "未找到对应的排盘信息");
    }

    const chartRequest = BaziChartRequestSchema.parse(stored.chartRequest);
    const chart = BaziChartResponseSchema.parse(stored.chart);
    return PaipanContextResponseSchema.parse({
      schemaVersion: stored.schemaVersion,
      chartType: stored.chartType,
      paipan_ref: paipanRef,
      generatedAt: stored.generatedAt,
      expiresAt: stored.expiresAt,
      chartRequest,
      chart,
    });
  }

  resolveDunjia(paipanRef: string, now = new Date()): DunjiaContextResponse {
    const stored = this.repository.find(paipanRef);
    if (!stored) {
      throw new NotFoundAppError("PAIPAN_CONTEXT_NOT_FOUND", "未找到对应的遁甲盘信息");
    }
    if (stored.expiresAt <= now.toISOString()) {
      this.repository.delete(paipanRef);
      throw new GoneAppError("PAIPAN_CONTEXT_EXPIRED", "本次遁甲盘信息已过期，请重新排盘");
    }
    if (
      stored.chartType !== DUNJIA_CHART_TYPE ||
      stored.schemaVersion !== DUNJIA_SCHEMA_VERSION
    ) {
      throw new NotFoundAppError("PAIPAN_CONTEXT_NOT_FOUND", "未找到对应的遁甲盘信息");
    }

    const chartRequest = DunjiaChartRequestSchema.parse(stored.chartRequest);
    const chart = DunjiaChartResponseSchema.parse(stored.chart);
    return DunjiaContextResponseSchema.parse({
      schemaVersion: stored.schemaVersion,
      chartType: stored.chartType,
      paipan_ref: paipanRef,
      generatedAt: stored.generatedAt,
      expiresAt: stored.expiresAt,
      chartRequest,
      chart,
    });
  }
}
