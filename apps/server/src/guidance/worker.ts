import cron from "node-cron";
import { loadConfig } from "../config/env.js";
import { createDatabase } from "../shared/database/client.js";
import { createLogger } from "../shared/logging.js";
import { addDays, dateInTimeZone } from "../shared/time/beijing-date.js";
import { createGuidanceService } from "./factory.js";

const config = loadConfig();
const logger = createLogger("guoxue-guidance-worker", config.logLevel);
const database = createDatabase(config.sqlitePath);
const service = createGuidanceService(config, database);

function today(): string {
  return dateInTimeZone(new Date(), config.timezone);
}

async function runGeneration(
  targetDate: string,
  attempt: number,
  allowFallback: boolean,
) {
  try {
    const record = await service.generateForDate(targetDate, {
      attempt,
      allowFallback,
    });
    logger.info(
      { targetDate, attempt, source: record.source },
      "daily guidance generation completed",
    );
  } catch (error) {
    logger.warn(
      {
        targetDate,
        attempt,
        error: error instanceof Error ? error.message : "unknown error",
      },
      "daily guidance generation attempt failed",
    );
  }
}

const startupRecord = service.getOrCreateForDate(today());
logger.info(
  { targetDate: startupRecord.date, source: startupRecord.source },
  "today guidance is available",
);

const tasks = [
  cron.schedule(
    "50 23 * * *",
    () => runGeneration(addDays(today(), 1), 1, false),
    { timezone: config.timezone, noOverlap: true },
  ),
  cron.schedule(
    "55 23 * * *",
    () => runGeneration(addDays(today(), 1), 2, false),
    { timezone: config.timezone, noOverlap: true },
  ),
  cron.schedule(
    "5 0 * * *",
    () => runGeneration(today(), 3, true),
    { timezone: config.timezone, noOverlap: true },
  ),
];

function shutdown(signal: string) {
  logger.info({ signal }, "worker shutting down");
  for (const task of tasks) task.stop();
  database.close();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
