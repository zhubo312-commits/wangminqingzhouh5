import { readFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { loadConfig } from "../config/env.js";
import { createDatabase } from "../shared/database/client.js";
import { nowIso } from "../shared/time/beijing-date.js";
import { CalendarRepository } from "./calendar.repository.js";
import { parseHkoYearFile } from "./hko-parser.js";

const HKO_BASE_URL =
  "https://www.hko.gov.hk/tc/gts/time/calendar/text/files";

function readNumberArgument(name: string, fallback: number): number {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isInteger(value)) {
    throw new Error(`--${name} must be an integer`);
  }
  return value;
}

function readStringArgument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function fetchCalendarFile(year: number): Promise<{ url: string; text: string }> {
  const url = `${HKO_BASE_URL}/T${year}c.txt`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "guoxue-laoshi-calendar-import/1.0" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        throw new Error(`HKO returned ${response.status} for ${year}`);
      }
      return { url, text: await response.text() };
    } catch (error) {
      lastError = error;
      if (attempt < 6) await delay(attempt * 1_000);
    }
  }

  throw lastError;
}

async function downloadYears(
  years: number[],
  concurrency = 6,
  sourceDirectory?: string,
): Promise<Map<number, { url: string; text: string }>> {
  const results = new Map<number, { url: string; text: string }>();
  let cursor = 0;

  async function worker() {
    while (cursor < years.length) {
      const index = cursor;
      cursor += 1;
      const year = years[index]!;
      if (sourceDirectory) {
        const filePath = path.resolve(sourceDirectory, `T${year}c.txt`);
        results.set(year, {
          url: `${HKO_BASE_URL}/T${year}c.txt`,
          text: await readFile(filePath, "utf8"),
        });
      } else {
        results.set(year, await fetchCalendarFile(year));
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, years.length) }, () => worker()),
  );
  return results;
}

function initialLunarMonthForYear(year: number): string {
  const month = new Intl.DateTimeFormat("zh-Hans-CN-u-ca-chinese", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, 0, 1, 12)));

  if (month === "腊月" || month === "臘月") return "十二月";
  if (month === "冬月") return "十一月";
  return month;
}

async function main() {
  const startYear = readNumberArgument("start", 1901);
  const endYear = readNumberArgument("end", 2100);
  const concurrency = readNumberArgument("concurrency", 3);
  const batchSize = readNumberArgument("batch-size", 10);
  if (startYear < 1901 || endYear > 2100 || startYear > endYear) {
    throw new Error("HKO import range must be within 1901-2100");
  }
  if (concurrency < 1 || concurrency > 10) {
    throw new Error("--concurrency must be within 1-10");
  }
  if (batchSize < 1 || batchSize > 50) {
    throw new Error("--batch-size must be within 1-50");
  }

  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => startYear + index,
  );
  const sourceDirectory = readStringArgument("source-dir");
  const config = loadConfig();
  const database = createDatabase(config.sqlitePath);
  const repository = new CalendarRepository(database);
  let carriedMonth = initialLunarMonthForYear(startYear);
  const importedAt = nowIso();

  try {
    for (let offset = 0; offset < years.length; offset += batchSize) {
      const batch = years.slice(offset, offset + batchSize);
      const downloaded = await downloadYears(
        batch,
        concurrency,
        sourceDirectory,
      );

      for (const year of batch) {
        const source = downloaded.get(year);
        if (!source) throw new Error(`Missing downloaded calendar for ${year}`);
        const parsed = parseHkoYearFile(source.text, {
          initialLunarMonth: carriedMonth,
        });
        repository.upsertYear(parsed.days, source.url, importedAt);
        carriedMonth = parsed.lastLunarMonth;
        process.stdout.write(`Imported ${year}: ${parsed.days.length} days\n`);
      }
    }
    process.stdout.write(`Calendar rows available: ${repository.count()}\n`);
  } finally {
    database.close();
  }
}

await main();
