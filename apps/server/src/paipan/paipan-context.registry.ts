import {
  BaziChartRequestSchema,
  BaziChartResponseSchema,
  DunjiaChartRequestSchema,
  DunjiaChartResponseSchema,
  DunjiaContextResponseSchema,
  PaipanContextResponseSchema,
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
