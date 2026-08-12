import {
  BaziChartRequestSchema,
  DunjiaChartRequestSchema,
  FlowMonthsRequestSchema,
  JueceChartRequestSchema,
  MeihuaChartRequestSchema,
  LuojiChartRequestSchema,
  XingxiangChartRequestSchema,
  PaipanContextLookupRequestSchema,
  ResolveBirthRequestSchema,
  ShenShaRequestSchema,
  YinpanChartRequestSchema,
  ShanxiangChartRequestSchema,
} from "@guoxue/contracts";
import type { FastifyPluginAsync } from "fastify";
import type { z } from "zod";
import { ValidationAppError } from "../shared/errors/app-error.js";
import type { PaipanClient } from "./paipan-client.js";
import type { PaipanContextService } from "./paipan-context.service.js";

function parseRequest<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;
  throw new ValidationAppError(
    "请检查排盘参数",
    parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: "INVALID_FIELD",
    })),
  );
}

export function createPaipanRoutes(
  client: PaipanClient,
  contextService: PaipanContextService,
): FastifyPluginAsync {
  return async (app) => {
    app.get("/api/v1/paipan/areas", async (_request, reply) => {
      reply.header("Cache-Control", "public, max-age=86400");
      return client.areas();
    });

    app.post("/api/v1/paipan/bazi/resolve-birth", async (request) =>
      client.resolveBirth(parseRequest(ResolveBirthRequestSchema, request.body)),
    );

    app.post(
      "/api/v1/paipan/bazi/chart",
      { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
      async (request) => {
        const chartRequest = parseRequest(BaziChartRequestSchema, request.body);
        const chart = await client.chart(chartRequest);
        return contextService.create(chartRequest, chart);
      },
    );

    app.post(
      "/api/v1/paipan/bazi/context",
      { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
      async (request) => {
        const lookup = parseRequest(PaipanContextLookupRequestSchema, request.body);
        return contextService.resolve(lookup.paipan_ref);
      },
    );

    app.post(
      "/api/v1/paipan/dunjia/chart",
      { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
      async (request) => {
        const chartRequest = parseRequest(DunjiaChartRequestSchema, request.body);
        const chart = await client.dunjiaChart(chartRequest);
        return contextService.createDunjia(chartRequest, chart);
      },
    );

    app.post(
      "/api/v1/paipan/dunjia/context",
      { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
      async (request) => {
        const lookup = parseRequest(PaipanContextLookupRequestSchema, request.body);
        return contextService.resolveDunjia(lookup.paipan_ref);
      },
    );

    app.post(
      "/api/v1/paipan/juece/chart",
      { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
      async (request) => {
        const chartRequest = parseRequest(JueceChartRequestSchema, request.body);
        const chart = await client.jueceChart(chartRequest);
        return contextService.createJuece(chartRequest, chart);
      },
    );

    app.post(
      "/api/v1/paipan/juece/context",
      { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
      async (request) => {
        const lookup = parseRequest(PaipanContextLookupRequestSchema, request.body);
        return contextService.resolveJuece(lookup.paipan_ref);
      },
    );

    app.post(
      "/api/v1/paipan/yinpan-juece/chart",
      { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
      async (request) => {
        const chartRequest = parseRequest(YinpanChartRequestSchema, request.body);
        const chart = await client.yinpanChart(chartRequest);
        return contextService.createYinpan(chartRequest, chart);
      },
    );

    app.post(
      "/api/v1/paipan/yinpan-juece/context",
      { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
      async (request) => {
        const lookup = parseRequest(PaipanContextLookupRequestSchema, request.body);
        return contextService.resolveYinpan(lookup.paipan_ref);
      },
    );

    app.post(
      "/api/v1/paipan/meihua/chart",
      { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
      async (request) => {
        const chartRequest = parseRequest(MeihuaChartRequestSchema, request.body);
        const chart = await client.meihuaChart(chartRequest);
        return contextService.createMeihua(chartRequest, chart);
      },
    );

    app.post(
      "/api/v1/paipan/meihua/context",
      { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
      async (request) => {
        const lookup = parseRequest(PaipanContextLookupRequestSchema, request.body);
        return contextService.resolveMeihua(lookup.paipan_ref);
      },
    );

    app.post(
      "/api/v1/paipan/luoji/chart",
      { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
      async (request) => {
        const chartRequest = parseRequest(LuojiChartRequestSchema, request.body);
        const chart = await client.luojiChart(chartRequest);
        return contextService.createLuoji(chartRequest, chart);
      },
    );

    app.post(
      "/api/v1/paipan/luoji/context",
      { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
      async (request) => {
        const lookup = parseRequest(PaipanContextLookupRequestSchema, request.body);
        return contextService.resolveLuoji(lookup.paipan_ref);
      },
    );

    app.post(
      "/api/v1/paipan/shanxiang-juece/chart",
      { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
      async (request) => {
        const chartRequest = parseRequest(ShanxiangChartRequestSchema, request.body);
        const chart = await client.shanxiangChart(chartRequest);
        return contextService.createShanxiang(chartRequest, chart);
      },
    );

    app.post(
      "/api/v1/paipan/xingxiang/chart",
      { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
      async (request) => {
        const chartRequest = parseRequest(XingxiangChartRequestSchema, request.body);
        const chart = await client.xingxiangChart(chartRequest);
        return contextService.createXingxiang(chartRequest, chart);
      },
    );

    app.post(
      "/api/v1/paipan/shanxiang-juece/context",
      { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
      async (request) => {
        const lookup = parseRequest(PaipanContextLookupRequestSchema, request.body);
        return contextService.resolveShanxiang(lookup.paipan_ref);
      },
    );

    app.post(
      "/api/v1/paipan/xingxiang/context",
      { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
      async (request) => {
        const lookup = parseRequest(PaipanContextLookupRequestSchema, request.body);
        return contextService.resolveXingxiang(lookup.paipan_ref);
      },
    );

    app.post("/api/v1/paipan/bazi/flow-months", async (request) =>
      client.flowMonths(parseRequest(FlowMonthsRequestSchema, request.body)),
    );

    app.post("/api/v1/paipan/bazi/shen-sha", async (request) =>
      client.shenSha(parseRequest(ShenShaRequestSchema, request.body)),
    );
  };
}
