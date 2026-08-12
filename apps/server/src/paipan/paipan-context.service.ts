import { randomBytes } from "node:crypto";
import {
  type BaziChartRequest,
  type BaziChartResponse,
  type BaziChartWithReference,
  type DunjiaChartRequest,
  type DunjiaChartResponse,
  type DunjiaChartWithReference,
  type DunjiaContextResponse,
  type JueceChartRequest,
  type JueceChartResponse,
  type JueceChartWithReference,
  type JueceContextResponse,
  type MeihuaChartRequest,
  type MeihuaChartResponse,
  type MeihuaChartWithReference,
  type MeihuaContextResponse,
  type LuojiChartRequest,
  type LuojiChartResponse,
  type LuojiChartWithReference,
  type LuojiContextResponse,
  type XingxiangChartRequest,
  type XingxiangChartResponse,
  type XingxiangChartWithReference,
  type XingxiangContextResponse,
  type PaipanContextResponse,
  type YinpanChartRequest,
  type YinpanChartResponse,
  type YinpanChartWithReference,
  type YinpanContextResponse,
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

  createJuece(
    chartRequest: JueceChartRequest,
    chart: JueceChartResponse,
    now = new Date(),
  ): JueceChartWithReference {
    return this.createRegistered("juece", chartRequest, chart, now) as JueceChartWithReference;
  }

  createYinpan(
    chartRequest: YinpanChartRequest,
    chart: YinpanChartResponse,
    now = new Date(),
  ): YinpanChartWithReference {
    return this.createRegistered("yinpan", chartRequest, chart, now) as YinpanChartWithReference;
  }

  createMeihua(
    chartRequest: MeihuaChartRequest,
    chart: MeihuaChartResponse,
    now = new Date(),
  ): MeihuaChartWithReference {
    return this.createRegistered("meihua", chartRequest, chart, now) as MeihuaChartWithReference;
  }

  createLuoji(
    chartRequest: LuojiChartRequest,
    chart: LuojiChartResponse,
    now = new Date(),
  ): LuojiChartWithReference {
    return this.createRegistered("luoji", chartRequest, chart, now) as LuojiChartWithReference;
  }

  createXingxiang(
    chartRequest: XingxiangChartRequest,
    chart: XingxiangChartResponse,
    now = new Date(),
  ): XingxiangChartWithReference {
    return this.createRegistered("xingxiang", chartRequest, chart, now) as XingxiangChartWithReference;
  }

  resolve(paipanRef: string, now = new Date()): PaipanContextResponse {
    return this.resolveRegistered("bazi", paipanRef, now) as PaipanContextResponse;
  }

  resolveDunjia(paipanRef: string, now = new Date()): DunjiaContextResponse {
    return this.resolveRegistered("dunjia", paipanRef, now) as DunjiaContextResponse;
  }

  resolveJuece(paipanRef: string, now = new Date()): JueceContextResponse {
    return this.resolveRegistered("juece", paipanRef, now) as JueceContextResponse;
  }

  resolveYinpan(paipanRef: string, now = new Date()): YinpanContextResponse {
    return this.resolveRegistered("yinpan", paipanRef, now) as YinpanContextResponse;
  }

  resolveMeihua(paipanRef: string, now = new Date()): MeihuaContextResponse {
    return this.resolveRegistered("meihua", paipanRef, now) as MeihuaContextResponse;
  }

  resolveLuoji(paipanRef: string, now = new Date()): LuojiContextResponse {
    return this.resolveRegistered("luoji", paipanRef, now) as LuojiContextResponse;
  }

  resolveXingxiang(paipanRef: string, now = new Date()): XingxiangContextResponse {
    return this.resolveRegistered("xingxiang", paipanRef, now) as XingxiangContextResponse;
  }
}
