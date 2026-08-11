import {
  BaziChartWithReferenceSchema,
  DunjiaChartWithReferenceSchema,
  DunjiaContextResponseSchema,
  JueceChartWithReferenceSchema,
  JueceContextResponseSchema,
  MeihuaChartWithReferenceSchema,
  MeihuaContextResponseSchema,
  YinpanChartWithReferenceSchema,
  YinpanContextResponseSchema,
  FlowMonthsResponseSchema,
  HomeResponseSchema,
  PaipanContextResponseSchema,
  PaipanAreaNodeSchema,
  ResolveBirthResponseSchema,
  type BaziChartRequest,
  type BaziChartWithReference,
  type DunjiaChartRequest,
  type DunjiaChartWithReference,
  type DunjiaContextResponse,
  type JueceChartRequest,
  type JueceChartWithReference,
  type JueceContextResponse,
  type MeihuaChartRequest,
  type MeihuaChartWithReference,
  type MeihuaContextResponse,
  type YinpanChartRequest,
  type YinpanChartWithReference,
  type YinpanContextResponse,
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

export function createDunjiaChart(
  request: DunjiaChartRequest,
  signal?: AbortSignal,
): Promise<DunjiaChartWithReference> {
  return requestJson("/api/v1/paipan/dunjia/chart", DunjiaChartWithReferenceSchema, {
    method: "POST",
    body: JSON.stringify(request),
    ...(signal ? { signal } : {}),
  });
}

export function fetchDunjiaContext(
  paipanRef: string,
  signal?: AbortSignal,
): Promise<DunjiaContextResponse> {
  return requestJson("/api/v1/paipan/dunjia/context", DunjiaContextResponseSchema, {
    method: "POST",
    body: JSON.stringify({ paipan_ref: paipanRef }),
    ...(signal ? { signal } : {}),
  });
}

export function createJueceChart(
  request: JueceChartRequest,
  signal?: AbortSignal,
): Promise<JueceChartWithReference> {
  return requestJson("/api/v1/paipan/juece/chart", JueceChartWithReferenceSchema, {
    method: "POST",
    body: JSON.stringify(request),
    ...(signal ? { signal } : {}),
  });
}

export function fetchJueceContext(
  paipanRef: string,
  signal?: AbortSignal,
): Promise<JueceContextResponse> {
  return requestJson("/api/v1/paipan/juece/context", JueceContextResponseSchema, {
    method: "POST",
    body: JSON.stringify({ paipan_ref: paipanRef }),
    ...(signal ? { signal } : {}),
  });
}

export function createYinpanChart(
  request: YinpanChartRequest,
  signal?: AbortSignal,
): Promise<YinpanChartWithReference> {
  return requestJson("/api/v1/paipan/yinpan-juece/chart", YinpanChartWithReferenceSchema, {
    method: "POST",
    body: JSON.stringify(request),
    ...(signal ? { signal } : {}),
  });
}

export function fetchYinpanContext(
  paipanRef: string,
  signal?: AbortSignal,
): Promise<YinpanContextResponse> {
  return requestJson("/api/v1/paipan/yinpan-juece/context", YinpanContextResponseSchema, {
    method: "POST",
    body: JSON.stringify({ paipan_ref: paipanRef }),
    ...(signal ? { signal } : {}),
  });
}

export function createMeihuaChart(
  request: MeihuaChartRequest,
  signal?: AbortSignal,
): Promise<MeihuaChartWithReference> {
  return requestJson("/api/v1/paipan/meihua/chart", MeihuaChartWithReferenceSchema, {
    method: "POST",
    body: JSON.stringify(request),
    ...(signal ? { signal } : {}),
  });
}

export function fetchMeihuaContext(
  paipanRef: string,
  signal?: AbortSignal,
): Promise<MeihuaContextResponse> {
  return requestJson("/api/v1/paipan/meihua/context", MeihuaContextResponseSchema, {
    method: "POST",
    body: JSON.stringify({ paipan_ref: paipanRef }),
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
