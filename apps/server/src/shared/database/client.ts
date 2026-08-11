import { mkdirSync } from "node:fs";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { resolveMigrationsDirectory } from "../../config/paths.js";
import { runMigrations } from "./migrations.js";
import { schema } from "./schema.js";

export interface DatabaseContext {
  raw: BetterSqlite3.Database;
  orm: BetterSQLite3Database<typeof schema>;
  close: () => void;
}

export function createDatabase(sqlitePath: string): DatabaseContext {
  if (sqlitePath !== ":memory:") {
    mkdirSync(path.dirname(sqlitePath), { recursive: true });
  }

  const raw = new BetterSqlite3(sqlitePath);
  raw.pragma("foreign_keys = ON");
  raw.pragma("busy_timeout = 5000");
  if (sqlitePath !== ":memory:") {
    raw.pragma("journal_mode = WAL");
  }
  raw.pragma("synchronous = NORMAL");
  runMigrations(raw, resolveMigrationsDirectory());

  return {
    raw,
    orm: drizzle(raw, { schema }),
    close: () => raw.close(),
  };
}
