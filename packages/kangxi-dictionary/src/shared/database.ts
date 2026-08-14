import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import BetterSqlite3 from "better-sqlite3";
import { ConfigurationError } from "./errors.js";

const MIGRATIONS_DIR = fileURLToPath(new URL("../../migrations/", import.meta.url));

export interface KangxiDatabase {
  raw: BetterSqlite3.Database;
  path: string;
  close(): void;
}

export function runKangxiMigrations(database: BetterSqlite3.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
  const findMigration = database.prepare("SELECT checksum FROM schema_migrations WHERE id = ?");
  const saveMigration = database.prepare(
    "INSERT INTO schema_migrations (id, checksum, applied_at) VALUES (?, ?, ?)",
  );
  const files = readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = findMigration.get(file) as { checksum: string } | undefined;
    if (existing) {
      if (existing.checksum !== checksum) throw new ConfigurationError("Migration checksum mismatch", { file });
      continue;
    }
    database.transaction(() => {
      database.exec(sql);
      saveMigration.run(file, checksum, new Date().toISOString());
    })();
  }
}

export function createKangxiDatabase(databasePath: string): KangxiDatabase {
  if (databasePath !== ":memory:") mkdirSync(path.dirname(databasePath), { recursive: true });
  const raw = new BetterSqlite3(databasePath);
  raw.pragma("foreign_keys = ON");
  raw.pragma("busy_timeout = 10000");
  raw.pragma("synchronous = FULL");
  if (databasePath !== ":memory:") raw.pragma("journal_mode = WAL");
  runKangxiMigrations(raw);
  return { raw, path: databasePath, close: () => raw.close() };
}

export function nowIso(): string {
  return new Date().toISOString();
}
