import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ConfigurationError } from "./errors.js";

const PROJECT_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

const EnvSchema = z.object({
  KANGXI_BASE_URL: z.url().default("https://www.kangxizidian.cn"),
  KANGXI_ASSET_HOSTS: z.string().default(""),
  KANGXI_DATA_DIR: z.string().default(path.join(PROJECT_ROOT, "data/kangxi")),
  KANGXI_HTML_CONCURRENCY: z.coerce.number().int().min(1).max(300).default(3),
  KANGXI_ASSET_CONCURRENCY: z.coerce.number().int().min(1).max(500).default(6),
  KANGXI_MIN_DELAY_MS: z.coerce.number().int().min(5).max(10_000).default(500),
  KANGXI_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(20_000),
  KANGXI_RETRIES: z.coerce.number().int().min(0).max(5).default(3),
  KANGXI_USER_AGENT: z.string().min(10).default("GuoxueKangxiArchive/1.0 authorized archival crawler"),
  KANGXI_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export interface KangxiConfig {
  projectRoot: string;
  baseUrl: string;
  authorizedAssetHosts: string[];
  dataRoot: string;
  workRoot: string;
  releasesRoot: string;
  databasePath: string;
  rawRoot: string;
  assetRoot: string;
  htmlConcurrency: number;
  assetConcurrency: number;
  minDelayMs: number;
  timeoutMs: number;
  retries: number;
  userAgent: string;
  logLevel: "debug" | "info" | "warn" | "error";
  parserVersion: string;
  schemaVersion: string;
}

export function loadKangxiConfig(env: NodeJS.ProcessEnv = process.env): KangxiConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigurationError("Invalid Kangxi dictionary configuration", {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }
  const values = parsed.data;
  const dataRoot = path.resolve(values.KANGXI_DATA_DIR);
  const workRoot = path.join(dataRoot, "work");
  const authorizedAssetHosts = [...new Set(values.KANGXI_ASSET_HOSTS
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean))];
  return {
    projectRoot: PROJECT_ROOT,
    baseUrl: values.KANGXI_BASE_URL.replace(/\/$/, ""),
    authorizedAssetHosts,
    dataRoot,
    workRoot,
    releasesRoot: path.join(dataRoot, "releases"),
    databasePath: path.join(workRoot, "kangxi-working.sqlite"),
    rawRoot: path.join(workRoot, "raw"),
    assetRoot: path.join(workRoot, "assets"),
    htmlConcurrency: values.KANGXI_HTML_CONCURRENCY,
    assetConcurrency: values.KANGXI_ASSET_CONCURRENCY,
    minDelayMs: values.KANGXI_MIN_DELAY_MS,
    timeoutMs: values.KANGXI_TIMEOUT_MS,
    retries: values.KANGXI_RETRIES,
    userAgent: values.KANGXI_USER_AGENT,
    logLevel: values.KANGXI_LOG_LEVEL,
    parserVersion: "1.1.2",
    schemaVersion: "kangxi.v1",
  };
}
