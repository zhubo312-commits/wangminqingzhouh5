import {
  BaziChartWithReferenceSchema,
  FlowMonthsResponseSchema,
  HomeResponseSchema,
  PaipanContextResponseSchema,
  PaipanAreaNodeSchema,
  ResolveBirthResponseSchema,
  type BaziChartRequest,
  type BaziChartWithReference,
  type FlowMonthsRequest,
  type FlowMonthsResponse,
  type PaipanAreaNode,
  type ResolveBirthRequest,
  type ResolveBirthResponse,
  type AnalyticsEvent,
  type HomeResponse,
  type PaipanContextResponse,
} from "@guoxue/contracts";
import { z } from "zod";

const defaultApiBaseUrl =
  import.meta.env.BASE_URL === "/"
    ? ""
    : import.meta.env.BASE_URL.replace(/\/$/, "");
const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchHome(signal?: AbortSignal): Promise<HomeResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/home`, {
    headers: { Accept: "application/json" },
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as
      | { detail?: string }
      | null;
    throw new ApiError(
      response.status,
      problem?.detail ?? "首页信息暂时无法加载",
    );
  }
  return HomeResponseSchema.parse(await response.json());
}

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  await fetch(`${apiBaseUrl}/api/v1/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  });
}

async function requestJson<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new ApiError(response.status, problem?.detail ?? "排盘服务暂时无法使用");
  }
  return schema.parse(await response.json());
}

export function fetchPaipanAreas(signal?: AbortSignal): Promise<PaipanAreaNode[]> {
  return requestJson("/api/v1/paipan/areas", z.array(PaipanAreaNodeSchema), {
    ...(signal ? { signal } : {}),
  });
}

export function resolveBirth(
  request: ResolveBirthRequest,
  signal?: AbortSignal,
): Promise<ResolveBirthResponse> {
  return requestJson("/api/v1/paipan/bazi/resolve-birth", ResolveBirthResponseSchema, {
    method: "POST",
    body: JSON.stringify(request),
    ...(signal ? { signal } : {}),
  });
}

export function createBaziChart(
  request: BaziChartRequest,
  signal?: AbortSignal,
): Promise<BaziChartWithReference> {
  return requestJson("/api/v1/paipan/bazi/chart", BaziChartWithReferenceSchema, {
    method: "POST",
    body: JSON.stringify(request),
    ...(signal ? { signal } : {}),
  });
}

export function fetchPaipanContext(
  paipanRef: string,
  signal?: AbortSignal,
): Promise<PaipanContextResponse> {
  return requestJson("/api/v1/paipan/bazi/context", PaipanContextResponseSchema, {
    method: "POST",
    body: JSON.stringify({ paipan_ref: paipanRef }),
    ...(signal ? { signal } : {}),
  });
}

export function fetchFlowMonths(
  request: FlowMonthsRequest,
  signal?: AbortSignal,
): Promise<FlowMonthsResponse> {
  return requestJson("/api/v1/paipan/bazi/flow-months", FlowMonthsResponseSchema, {
    method: "POST",
    body: JSON.stringify(request),
    ...(signal ? { signal } : {}),
  });
}
