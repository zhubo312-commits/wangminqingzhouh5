import {
  BaziChartRequestSchema,
  FlowMonthsRequestSchema,
  PaipanContextLookupRequestSchema,
  ResolveBirthRequestSchema,
  ShenShaRequestSchema,
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

    app.post("/api/v1/paipan/bazi/flow-months", async (request) =>
      client.flowMonths(parseRequest(FlowMonthsRequestSchema, request.body)),
    );

    app.post("/api/v1/paipan/bazi/shen-sha", async (request) =>
      client.shenSha(parseRequest(ShenShaRequestSchema, request.body)),
    );
  };
}
