import { randomBytes } from "node:crypto";
import {
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
import {
  getPaipanRegistration,
  type PaipanContextKey,
} from "./paipan-context.registry.js";

function createReference(): string {
  return `pp_${randomBytes(24).toString("base64url")}`;
}

export class PaipanContextService {
  constructor(
    private readonly repository: PaipanContextRepository,
    private readonly ttlSeconds: number,
  ) {}

  private createRegistered(
    key: PaipanContextKey,
    chartRequest: unknown,
    chart: unknown,
    now: Date,
  ): Record<string, unknown> & { paipan_ref: string; expiresAt: string } {
    const registration = getPaipanRegistration(key);
    const parsedRequest = registration.requestSchema.parse(chartRequest);
    const parsedChart = registration.chartSchema.parse(chart);
    const paipanRef = createReference();
    const generatedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1_000).toISOString();

    this.repository.deleteExpired(generatedAt);
    this.repository.save(paipanRef, {
      chartType: registration.chartType,
      schemaVersion: registration.schemaVersion,
      chartRequest: parsedRequest,
      chart: parsedChart,
      generatedAt,
      expiresAt,
    });
    return { ...parsedChart, paipan_ref: paipanRef, expiresAt };
  }

  private resolveRegistered(
    key: PaipanContextKey,
    paipanRef: string,
    now: Date,
  ): unknown {
    const registration = getPaipanRegistration(key);
    const stored = this.repository.find(paipanRef);
    if (!stored) {
      throw new NotFoundAppError("PAIPAN_CONTEXT_NOT_FOUND", "未找到对应的排盘信息");
    }
    if (stored.expiresAt <= now.toISOString()) {
      this.repository.delete(paipanRef);
      throw new GoneAppError("PAIPAN_CONTEXT_EXPIRED", "本次排盘信息已过期，请重新排盘");
    }
    if (
      stored.chartType !== registration.chartType ||
      stored.schemaVersion !== registration.schemaVersion
    ) {
      throw new NotFoundAppError("PAIPAN_CONTEXT_NOT_FOUND", "未找到对应的排盘信息");
    }

    const chartRequest = registration.requestSchema.parse(stored.chartRequest);
    const chart = registration.chartSchema.parse(stored.chart);
    return registration.contextSchema.parse({
      schemaVersion: stored.schemaVersion,
      chartType: stored.chartType,
      paipan_ref: paipanRef,
      generatedAt: stored.generatedAt,
      expiresAt: stored.expiresAt,
      chartRequest,
      chart,
    });
  }

  create(
    chartRequest: BaziChartRequest,
    chart: BaziChartResponse,
    now = new Date(),
  ): BaziChartWithReference {
    return this.createRegistered("bazi", chartRequest, chart, now) as BaziChartWithReference;
  }

  createDunjia(
    chartRequest: DunjiaChartRequest,
    chart: DunjiaChartResponse,
    now = new Date(),
  ): DunjiaChartWithReference {
    return this.createRegistered("dunjia", chartRequest, chart, now) as DunjiaChartWithReference;
  }

  resolve(paipanRef: string, now = new Date()): PaipanContextResponse {
    return this.resolveRegistered("bazi", paipanRef, now) as PaipanContextResponse;
  }

  resolveDunjia(paipanRef: string, now = new Date()): DunjiaContextResponse {
    return this.resolveRegistered("dunjia", paipanRef, now) as DunjiaContextResponse;
  }
}
