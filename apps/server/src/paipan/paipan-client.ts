import {
  BaziChartResponseSchema,
  DunjiaChartResponseSchema,
  JueceChartResponseSchema,
  LuojiChartResponseSchema,
  MeihuaChartResponseSchema,
  YinpanChartResponseSchema,
  ShanxiangChartResponseSchema,
  FlowMonthsResponseSchema,
  PaipanAreaNodeSchema,
  ResolveBirthResponseSchema,
  ShenShaResponseSchema,
  type BaziChartRequest,
  type BaziChartResponse,
  type DunjiaChartRequest,
  type DunjiaChartResponse,
  type FlowMonthsRequest,
  type FlowMonthsResponse,
  type PaipanAreaNode,
  type JueceChartRequest,
  type JueceChartResponse,
  type LuojiChartRequest,
  type LuojiChartResponse,
  type MeihuaChartRequest,
  type MeihuaChartResponse,
  type YinpanChartRequest,
  type YinpanChartResponse,
  type ShanxiangChartRequest,
  type ShanxiangChartResponse,
  type ResolveBirthRequest,
  type ResolveBirthResponse,
  type ShenShaRequest,
  type ShenShaResponse,
} from "@guoxue/contracts";
import { z } from "zod";
import type { AppConfig } from "../config/env.js";
import {
  BadGatewayAppError,
  GatewayTimeoutAppError,
  ValidationAppError,
} from "../shared/errors/app-error.js";

const JavaErrorSchema = z.object({
  message: z.string().optional(),
  errors: z
    .array(z.object({ field: z.string(), message: z.string() }))
    .optional(),
});

const LegacyGrowthSchema = z.object({
  title: z.string(),
  content: z.string(),
});

const LegacyDunjiaResponseSchema = z.object({
  qiMenZao: z.object({
    yearGongLi: z.string(),
    yearNongLi: z.string(),
    yearGanZhi: z.string(),
    monthGanZhi: z.string(),
    dayGanZhi: z.string(),
    hourGanZhi: z.string(),
    prevJieQiName: z.string(),
    nextJieQiName: z.string(),
    prevJieQiTime: z.string(),
    nextJieQiTime: z.string(),
    yinOrYangDun: z.enum(["阴", "阳"]),
    juShu: z.number().int(),
    xunShou: z.string(),
    maXing: z.string(),
    maXingContent: z.string(),
    zhiFu: z.string(),
    zhiFuIndex: z.number().int(),
    zhiShi: z.string(),
    zhiShiIndex: z.number().int(),
    yearXunKong: z.string(),
    monthXunKong: z.string(),
    dayXunKong: z.string(),
    timeXunKong: z.string(),
  }),
  qimenGong: z.array(z.object({
    index: z.number().int(),
    baGua: z.string(),
    fangWei: z.string(),
    wuXing: z.string(),
    baShen: z.string().nullish(),
    baXing: z.string().nullish(),
    newBaMen: z.string().nullish(),
    tianPan: z.string(),
    diPan: z.string(),
    yinGan: z.string().nullable().optional(),
    YinGan: z.string().nullable().optional(),
    xunKong: z.boolean().optional(),
    isXunKong: z.boolean().optional(),
    maXing: z.boolean().optional(),
    isMaXing: z.boolean().optional(),
    siHai: z.array(z.object({ word: z.string(), siHai: z.enum(["迫", "墓", "刑"]) })).nullish(),
    tianGanChangSheng: z.array(LegacyGrowthSchema).nullish(),
    diZhiChangSheng: z.array(LegacyGrowthSchema).nullish(),
  })).length(9),
  tianMenDiHuList: z.array(z.object({
    diZhi: z.string(),
    tianMen: z.string(),
    diHu: z.string(),
  })).length(12),
});

export class PaipanClient {
  constructor(
    private readonly config: AppConfig["paipan"],
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async areas(): Promise<PaipanAreaNode[]> {
    return this.request(
      "/internal/v1/bazi/areas",
      undefined,
      z.array(PaipanAreaNodeSchema),
    );
  }

  async resolveBirth(request: ResolveBirthRequest): Promise<ResolveBirthResponse> {
    return this.request(
      "/internal/v1/bazi/resolve-birth",
      request,
      ResolveBirthResponseSchema,
    );
  }

  async chart(request: BaziChartRequest): Promise<BaziChartResponse> {
    return this.request(
      "/internal/v1/bazi/chart",
      request,
      BaziChartResponseSchema,
    );
  }

  async dunjiaChart(request: DunjiaChartRequest): Promise<DunjiaChartResponse> {
    const legacy = await this.request(
      "/internal/v1/dunjia/chart",
      request,
      LegacyDunjiaResponseSchema,
    );
    const overview = legacy.qiMenZao;
    return DunjiaChartResponseSchema.parse({
      overview: {
        method: "转盘-拆补-寄坤二宫",
        solarDateTime: overview.yearGongLi,
        lunarDate: overview.yearNongLi,
        pillars: {
          year: overview.yearGanZhi,
          month: overview.monthGanZhi,
          day: overview.dayGanZhi,
          hour: overview.hourGanZhi,
        },
        voidBranches: {
          year: overview.yearXunKong,
          month: overview.monthXunKong,
          day: overview.dayXunKong,
          hour: overview.timeXunKong,
        },
        previousSolarTerm: {
          name: overview.prevJieQiName,
          dateTime: overview.prevJieQiTime,
        },
        nextSolarTerm: {
          name: overview.nextJieQiName,
          dateTime: overview.nextJieQiTime,
        },
        dunType: overview.yinOrYangDun,
        juNumber: overview.juShu,
        xunShou: overview.xunShou,
        chiefStar: { name: overview.zhiFu, palace: overview.zhiFuIndex },
        chiefDoor: { name: overview.zhiShi, palace: overview.zhiShiIndex },
        horse: { trigram: overview.maXing, branch: overview.maXingContent },
      },
      palaces: legacy.qimenGong.map((palace) => ({
        index: palace.index,
        trigram: palace.baGua,
        direction: palace.fangWei,
        element: palace.wuXing,
        deity: palace.baShen ?? null,
        star: palace.baXing ?? null,
        door: palace.newBaMen ?? null,
        heavenPlate: palace.tianPan === "UNKNOWN" ? "—" : palace.tianPan,
        earthPlate: palace.diPan === "UNKNOWN" ? "—" : palace.diPan,
        hiddenStem: palace.yinGan ?? palace.YinGan ?? null,
        isVoid: palace.xunKong ?? palace.isXunKong ?? false,
        isChief: palace.index === overview.zhiFuIndex,
        isChiefDoor: palace.index === overview.zhiShiIndex,
        isHorse: palace.maXing ?? palace.isMaXing ?? false,
        harms: (palace.siHai ?? []).map((harm) => ({
          symbol: harm.word,
          type: harm.siHai,
        })),
        heavenGrowth: (palace.tianGanChangSheng ?? []).map((item) => ({
          branch: item.title,
          stage: item.content,
        })),
        earthGrowth: (palace.diZhiChangSheng ?? []).map((item) => ({
          branch: item.title,
          stage: item.content,
        })),
      })),
      heavenEarthGates: legacy.tianMenDiHuList.map((item) => ({
        branch: item.diZhi,
        heavenGate: item.tianMen,
        earthGate: item.diHu,
      })),
    });
  }

  async jueceChart(request: JueceChartRequest): Promise<JueceChartResponse> {
    return this.request(
      "/internal/v1/juece/chart",
      request,
      JueceChartResponseSchema,
    );
  }

  async yinpanChart(request: YinpanChartRequest): Promise<YinpanChartResponse> {
    return this.request(
      "/internal/v1/yinpan-juece/chart",
      request,
      YinpanChartResponseSchema,
    );
  }

  async meihuaChart(request: MeihuaChartRequest): Promise<MeihuaChartResponse> {
    return this.request(
      "/internal/v1/meihua/chart",
      request,
      MeihuaChartResponseSchema,
    );
  }

  async luojiChart(request: LuojiChartRequest): Promise<LuojiChartResponse> {
    return this.request(
      "/internal/v1/luoji/chart",
      request,
      LuojiChartResponseSchema,
    );
  }

  async shanxiangChart(request: ShanxiangChartRequest): Promise<ShanxiangChartResponse> {
    return this.request(
      "/internal/v1/shanxiang-juece/chart",
      request,
      ShanxiangChartResponseSchema,
    );
  }

  async flowMonths(request: FlowMonthsRequest): Promise<FlowMonthsResponse> {
    return this.request(
      "/internal/v1/bazi/flow-months",
      request,
      FlowMonthsResponseSchema,
    );
  }

  async shenSha(request: ShenShaRequest): Promise<ShenShaResponse> {
    return this.request(
      "/internal/v1/bazi/shen-sha",
      request,
      ShenShaResponseSchema,
    );
  }

  async isReady(): Promise<boolean> {
    if (!this.config.baseUrl) return false;
    try {
      const response = await this.fetchImpl(`${this.config.baseUrl}/actuator/health`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(Math.min(this.config.timeoutMs, 2_000)),
      });
      if (!response.ok) return false;
      const payload = (await response.json()) as { status?: string };
      return payload.status === "UP";
    } catch {
      return false;
    }
  }

  private async request<T>(
    path: string,
    body: unknown | undefined,
    schema: z.ZodType<T>,
  ): Promise<T> {
    if (!this.config.baseUrl) {
      throw new BadGatewayAppError("PAIPAN_NOT_CONFIGURED");
    }

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.config.baseUrl}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === "TimeoutError" || error.name === "AbortError")
      ) {
        throw new GatewayTimeoutAppError();
      }
      throw new BadGatewayAppError("PAIPAN_NETWORK_ERROR");
    }

    if (response.status === 422) {
      const javaError = JavaErrorSchema.safeParse(await response.json().catch(() => null));
      throw new ValidationAppError(
        javaError.success ? javaError.data.message ?? "请检查排盘参数" : "请检查排盘参数",
        javaError.success
          ? (javaError.data.errors ?? []).map((item) => ({
              field: item.field,
              message: item.message,
              code: "INVALID_FIELD",
            }))
          : [],
      );
    }

    if (!response.ok) {
      throw new BadGatewayAppError("PAIPAN_UPSTREAM_ERROR");
    }

    const payload = schema.safeParse(await response.json().catch(() => null));
    if (!payload.success) {
      throw new BadGatewayAppError("PAIPAN_INVALID_RESPONSE");
    }
    return payload.data;
  }
}
