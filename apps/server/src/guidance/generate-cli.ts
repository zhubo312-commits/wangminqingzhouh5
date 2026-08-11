import { loadConfig } from "../config/env.js";
import { createDatabase } from "../shared/database/client.js";
import { dateInTimeZone } from "../shared/time/beijing-date.js";
import { createGuidanceService } from "./factory.js";

function readDateArgument(): string | undefined {
  const index = process.argv.indexOf("--date");
  return index === -1 ? undefined : process.argv[index + 1];
}

const config = loadConfig();
const date = readDateArgument() ?? dateInTimeZone(new Date(), config.timezone);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  throw new Error("--date must use YYYY-MM-DD");
}

const database = createDatabase(config.sqlitePath);
try {
  const service = createGuidanceService(config, database);
  const record = await service.generateForDate(date, {
    attempt: 1,
    allowFallback: process.argv.includes("--allow-fallback"),
  });
  process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
} finally {
  database.close();
}
