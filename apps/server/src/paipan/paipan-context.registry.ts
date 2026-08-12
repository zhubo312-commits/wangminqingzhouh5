import {
  BaziChartRequestSchema,
  BaziChartResponseSchema,
  DunjiaChartRequestSchema,
  DunjiaChartResponseSchema,
  DunjiaContextResponseSchema,
  JueceChartRequestSchema,
  JueceChartResponseSchema,
  JueceContextResponseSchema,
  LuojiChartRequestSchema,
  LuojiChartResponseSchema,
  LuojiContextResponseSchema,
  MeihuaChartRequestSchema,
  MeihuaChartResponseSchema,
  MeihuaContextResponseSchema,
  PaipanContextResponseSchema,
  YinpanChartRequestSchema,
  YinpanChartResponseSchema,
  YinpanContextResponseSchema,
  ShanxiangChartRequestSchema,
  ShanxiangChartResponseSchema,
  ShanxiangContextResponseSchema,
} from "@guoxue/contracts";
import type { z } from "zod";

function definePaipanContext<
  const ChartType extends string,
  const SchemaVersion extends string,
  RequestSchema extends z.ZodType,
  ChartSchema extends z.ZodType,
  ContextSchema extends z.ZodType,
>(registration: {
  chartType: ChartType;
  schemaVersion: SchemaVersion;
  requestSchema: RequestSchema;
  chartSchema: ChartSchema;
  contextSchema: ContextSchema;
}) {
  return registration;
}

export const paipanContextRegistry = {
  bazi: definePaipanContext({
    chartType: "shengping_zishi",
    schemaVersion: "guoxue.paipan.bazi.v1",
    requestSchema: BaziChartRequestSchema,
    chartSchema: BaziChartResponseSchema,
    contextSchema: PaipanContextResponseSchema,
  }),
  dunjia: definePaipanContext({
    chartType: "dunjia",
    schemaVersion: "guoxue.paipan.dunjia.v1",
    requestSchema: DunjiaChartRequestSchema,
    chartSchema: DunjiaChartResponseSchema,
    contextSchema: DunjiaContextResponseSchema,
  }),
  juece: definePaipanContext({
    chartType: "shijia_juece",
    schemaVersion: "guoxue.paipan.shijia_juece.v1",
    requestSchema: JueceChartRequestSchema,
    chartSchema: JueceChartResponseSchema,
    contextSchema: JueceContextResponseSchema,
  }),
  yinpan: definePaipanContext({
    chartType: "yinpan_juece",
    schemaVersion: "guoxue.paipan.yinpan_juece.v1",
    requestSchema: YinpanChartRequestSchema,
    chartSchema: YinpanChartResponseSchema,
    contextSchema: YinpanContextResponseSchema,
  }),
  meihua: definePaipanContext({
    chartType: "meihua",
    schemaVersion: "guoxue.paipan.meihua.v1",
    requestSchema: MeihuaChartRequestSchema,
    chartSchema: MeihuaChartResponseSchema,
    contextSchema: MeihuaContextResponseSchema,
  }),
  luoji: definePaipanContext({
    chartType: "luoji",
    schemaVersion: "guoxue.paipan.luoji.v1",
    requestSchema: LuojiChartRequestSchema,
    chartSchema: LuojiChartResponseSchema,
    contextSchema: LuojiContextResponseSchema,
  }),
  shanxiang: definePaipanContext({
    chartType: "shanxiang_juece",
    schemaVersion: "guoxue.paipan.shanxiang_juece.v1",
    requestSchema: ShanxiangChartRequestSchema,
    chartSchema: ShanxiangChartResponseSchema,
    contextSchema: ShanxiangContextResponseSchema,
  }),
} as const;

export type PaipanContextKey = keyof typeof paipanContextRegistry;
export type PaipanRegistration<Key extends PaipanContextKey> =
  (typeof paipanContextRegistry)[Key];
export type PaipanChartType = PaipanRegistration<PaipanContextKey>["chartType"];
export type PaipanSchemaVersion = PaipanRegistration<PaipanContextKey>["schemaVersion"];

export type RegisteredPaipanContext<Key extends PaipanContextKey> = {
  chartType: PaipanRegistration<Key>["chartType"];
  schemaVersion: PaipanRegistration<Key>["schemaVersion"];
  chartRequest: z.infer<PaipanRegistration<Key>["requestSchema"]>;
  chart: z.infer<PaipanRegistration<Key>["chartSchema"]>;
  generatedAt: string;
  expiresAt: string;
};

export function getPaipanRegistration<Key extends PaipanContextKey>(key: Key) {
  return paipanContextRegistry[key];
}

export function isRegisteredPaipanIdentity(
  chartType: string,
  schemaVersion: string,
): boolean {
  return Object.values(paipanContextRegistry).some(
    (registration) =>
      registration.chartType === chartType && registration.schemaVersion === schemaVersion,
  );
}
