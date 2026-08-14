#!/usr/bin/env node
import path from "node:path";
import { loadKangxiConfig } from "./shared/config.js";
import { createKangxiDatabase } from "./shared/database.js";
import { createLogger } from "./shared/logger.js";
import { KangxiError } from "./shared/errors.js";
import { RateLimitedHttpClient } from "./crawl/http-client.js";
import { CrawlRepository } from "./crawl/crawl.repository.js";
import { CharacterRepository } from "./characters/character.repository.js";
import { BookRepository } from "./books/book.repository.js";
import { CrawlService } from "./crawl/crawl.service.js";
import { ValidationService } from "./validation/validation.service.js";
import { IssueService } from "./validation/issue.service.js";
import { QueryService } from "./query/query.service.js";
import { DiffService } from "./diff/diff.service.js";
import { ReleaseService } from "./release/release.service.js";
import { ProjectionService } from "./projection/projection.service.js";
import { UnihanService } from "./reference/unihan.service.js";

interface ParsedArguments {
  command: string;
  positional: string[];
  flags: Map<string, string | true>;
}

function parseArguments(argv: string[]): ParsedArguments {
  const [command = "help", ...rest] = argv;
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index]!;
    if (!value.startsWith("--")) { positional.push(value); continue; }
    const [rawKey, inline] = value.slice(2).split("=", 2);
    if (inline !== undefined) { flags.set(rawKey!, inline); continue; }
    const next = rest[index + 1];
    if (next && !next.startsWith("--")) { flags.set(rawKey!, next); index += 1; }
    else flags.set(rawKey!, true);
  }
  return { command, positional, flags };
}

function stringFlag(args: ParsedArguments, name: string): string | undefined {
  const value = args.flags.get(name);
  return typeof value === "string" ? value : undefined;
}

function defaultReleaseId(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `kangxi-cn-${value.year}${value.month}${value.day}.r1`;
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usage(): string {
  return `Kangxi dictionary archive CLI

Usage:
  npm run cli --workspace @guoxue/kangxi-dictionary -- <command> [options]

Commands:
  discover [--release ID] [--run ID]
  crawl [--release ID] [--run ID] [--pilot] [--no-assets] [--resume] [--retry-failed]
  status [--release ID] [--run ID]
  validate [--release ID]
  query <字> [--release ID]
  query <关键词> --search [--limit 20] [--release ID]
  diff <before.sqlite> <after.sqlite>
  import-unihan --source <Unihan.zip|目录> --version <17.0.0> [--release ID] [--promote-safe]
  resolve <issue-id> --note <说明> [--accept-source-absence]
  release [--release ID]
  project-chinese [--release ID] [--output DIR] [--previous-sql FILE]

Environment:
  KANGXI_BASE_URL, KANGXI_DATA_DIR, KANGXI_HTML_CONCURRENCY,
  KANGXI_ASSET_CONCURRENCY, KANGXI_MIN_DELAY_MS, KANGXI_TIMEOUT_MS,
  KANGXI_RETRIES, KANGXI_USER_AGENT, KANGXI_LOG_LEVEL
`;
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
  if (["help", "--help", "-h"].includes(args.command) || args.flags.has("help")) {
    process.stdout.write(usage());
    return;
  }
  const config = loadKangxiConfig();
  const logger = createLogger(config.logLevel);
  const database = createKangxiDatabase(config.databasePath);
  try {
    const releaseId = stringFlag(args, "release") ?? defaultReleaseId();
    const crawlRepository = new CrawlRepository(database.raw);
    const validation = new ValidationService(database.raw, config);
    const httpClient = new RateLimitedHttpClient({
      minDelayMs: config.minDelayMs,
      timeoutMs: config.timeoutMs,
      retries: config.retries,
      userAgent: config.userAgent,
    }, logger);
    const crawler = new CrawlService(
      config, crawlRepository, new CharacterRepository(database.raw), new BookRepository(database.raw), httpClient, logger,
    );
    switch (args.command) {
      case "discover": {
        // Discovery and full crawl intentionally share the same default run so
        // the latter can resume the enumerated queue instead of fetching every
        // index twice.
        const runId = stringFlag(args, "run") ?? `${releaseId}-full`;
        print(await crawler.discover(releaseId, runId));
        break;
      }
      case "crawl": {
        const pilot = args.flags.has("pilot");
        const runId = stringFlag(args, "run") ?? `${releaseId}-${pilot ? "pilot" : "full"}`;
        print(await crawler.crawl(releaseId, runId, {
          pilot,
          includeAssets: !args.flags.has("no-assets"),
          retryFailed: args.flags.has("retry-failed"),
        }));
        break;
      }
      case "status": {
        const runId = stringFlag(args, "run") ?? `${releaseId}-full`;
        const run = database.raw.prepare(`
          SELECT id, release_id, mode, status, started_at, finished_at, updated_at FROM crawl_runs WHERE id = ?
        `).get(runId);
        if (!run) throw new KangxiError("crawl run not found", "NOT_FOUND", { runId });
        print({ run, counts: crawlRepository.counts(runId) });
        break;
      }
      case "validate":
        print(validation.validate(releaseId));
        break;
      case "query": {
        const query = args.positional[0];
        if (!query) throw new KangxiError("query requires a character or search expression", "CLI_USAGE");
        const service = new QueryService(database.raw);
        print(args.flags.has("search")
          ? service.search(query, Number(stringFlag(args, "limit") ?? "20"), stringFlag(args, "release"))
          : service.character(query, stringFlag(args, "release")));
        break;
      }
      case "diff": {
        const [before, after] = args.positional;
        if (!before || !after) throw new KangxiError("diff requires two SQLite paths", "CLI_USAGE");
        print(new DiffService().compare(path.resolve(before), path.resolve(after)));
        break;
      }
      case "import-unihan": {
        const source = stringFlag(args, "source");
        const version = stringFlag(args, "version");
        if (!source || !version) throw new KangxiError(
          "import-unihan requires --source and --version",
          "CLI_USAGE",
        );
        const sourceUrl = stringFlag(args, "source-url");
        const licenseUrl = stringFlag(args, "license-url");
        print(new UnihanService(database.raw, config).import(releaseId, {
          sourcePath: source,
          version,
          promoteSafe: args.flags.has("promote-safe"),
          ...(sourceUrl ? { sourceUrl } : {}),
          ...(licenseUrl ? { licenseUrl } : {}),
        }));
        break;
      }
      case "resolve": {
        const id = Number(args.positional[0]);
        const note = stringFlag(args, "note");
        if (!Number.isInteger(id) || id <= 0 || !note) throw new KangxiError("resolve requires issue-id and --note", "CLI_USAGE");
        new IssueService(database.raw).resolve(id, note, args.flags.has("accept-source-absence"));
        print({ issueId: id, resolved: true });
        break;
      }
      case "release":
        print(await new ReleaseService(database.raw, config, validation, logger).release(releaseId));
        break;
      case "project-chinese":
        print(new ProjectionService(database.raw, config).project(
          releaseId, stringFlag(args, "output"), stringFlag(args, "previous-sql"),
        ));
        break;
      default:
        throw new KangxiError(`Unknown command: ${args.command}`, "CLI_USAGE");
    }
  } finally {
    database.close();
  }
}

main().catch((error: unknown) => {
  const payload = error instanceof KangxiError
    ? { level: "error", code: error.code, message: error.message, details: error.details }
    : { level: "error", code: "UNEXPECTED_ERROR", message: error instanceof Error ? error.message : String(error) };
  process.stderr.write(`${JSON.stringify(payload)}\n`);
  process.exitCode = 1;
});
