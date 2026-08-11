import {
  BaziChartResponseSchema,
  FlowMonthsResponseSchema,
  PaipanAreaNodeSchema,
  ResolveBirthResponseSchema,
  ShenShaResponseSchema,
  type BaziChartRequest,
  type BaziChartResponse,
  type FlowMonthsRequest,
  type FlowMonthsResponse,
  type PaipanAreaNode,
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
