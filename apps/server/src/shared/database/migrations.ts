import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type BetterSqlite3 from "better-sqlite3";

export function runMigrations(
  database: BetterSqlite3.Database,
  migrationsDirectory: string,
): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const files = readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const findMigration = database.prepare(
    "SELECT checksum FROM schema_migrations WHERE id = ?",
  );
  const saveMigration = database.prepare(
    "INSERT INTO schema_migrations (id, checksum, applied_at) VALUES (?, ?, ?)",
  );

  for (const file of files) {
    const sql = readFileSync(path.join(migrationsDirectory, file), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = findMigration.get(file) as { checksum: string } | undefined;

    if (existing) {
      if (existing.checksum !== checksum) {
        throw new Error(`Migration checksum mismatch: ${file}`);
      }
      continue;
    }

    database.transaction(() => {
      database.exec(sql);
      saveMigration.run(file, checksum, new Date().toISOString());
    })();
  }
}
