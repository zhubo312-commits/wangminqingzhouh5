import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadDotEnv } from "dotenv";
import { z } from "zod";
import { PROJECT_ROOT, resolveFromProjectRoot } from "./paths.js";

const envFiles = [
  path.resolve(PROJECT_ROOT, ".env.local"),
  path.resolve(PROJECT_ROOT, ".env"),
];

for (const envFile of envFiles) {
  if (existsSync(envFile)) {
    loadDotEnv({ path: envFile, override: false, quiet: true });
  }
}

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.url().refine((value) => value.startsWith("https://") || value.startsWith("http://"), {
    message: "must use http or https",
  }).optional(),
);

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  APP_TIMEZONE: z.string().default("Asia/Shanghai"),
  SQLITE_PATH: z.string().default("./data/guoxue.db"),
  WEB_DIST_PATH: z.string().default("./apps/web/dist"),
  ALLOWED_ORIGINS: z
    .string()
    .default(
      "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
    ),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  PAIPAN_SERVICE_URL: optionalUrl.default("http://127.0.0.1:8080"),
  PAIPAN_TIMEOUT_MS: z.coerce.number().int().min(500).max(30_000).default(8_000),
  PAIPAN_CONTEXT_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(300)
    .max(86_400)
    .default(7_200),
  INTERPRETATION_URL: optionalUrl.default(
    "https://gx.yipuwh.com/h6/pages/jiedu/chat?isShowPay=1",
  ),
  QUESTION_URL: optionalUrl.default(
    "https://gx.yipuwh.com/h6/pages/jiedu/chat?isShowPay=1",
  ),
  LEARNING_URL: optionalUrl,
  DIFY_BASE_URL: optionalUrl,
  DIFY_API_KEY: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).optional(),
  ),
  DIFY_USER: z.string().min(1).default("daily-guidance-worker"),
  DIFY_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(100_000).default(60_000),
});

export type AppConfig = ReturnType<typeof loadConfig>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  const values = parsed.data;
  const links = {
    interpretation: values.INTERPRETATION_URL ?? null,
    learning: values.LEARNING_URL ?? null,
    question: values.QUESTION_URL ?? null,
  } as const;

  if (values.NODE_ENV === "production") {
    const missing = Object.entries(links)
      .filter(([, value]) => value === null)
      .map(([key]) => key);
    if (missing.length > 0) {
      throw new Error(`Missing production business URLs: ${missing.join(", ")}`);
    }
  }

  return {
    nodeEnv: values.NODE_ENV,
    isProduction: values.NODE_ENV === "production",
    host: values.HOST,
    port: values.PORT,
    timezone: values.APP_TIMEZONE,
    sqlitePath: resolveFromProjectRoot(values.SQLITE_PATH),
    webDistPath: resolveFromProjectRoot(values.WEB_DIST_PATH),
    allowedOrigins: values.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    logLevel: values.LOG_LEVEL,
    links,
    paipan: {
      baseUrl: values.PAIPAN_SERVICE_URL?.replace(/\/$/, "") ?? null,
      timeoutMs: values.PAIPAN_TIMEOUT_MS,
      contextTtlSeconds: values.PAIPAN_CONTEXT_TTL_SECONDS,
    },
    dify: {
      baseUrl: values.DIFY_BASE_URL?.replace(/\/$/, "") ?? null,
      apiKey: values.DIFY_API_KEY ?? null,
      user: values.DIFY_USER,
      timeoutMs: values.DIFY_TIMEOUT_MS,
    },
  } as const;
}
