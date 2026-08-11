import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { describe, expect, it } from "vitest";

const migrationsDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../migrations",
);

function migration(name: string) {
  return readFileSync(path.join(migrationsDirectory, name), "utf8");
}

describe("paipan context migration", () => {
  it("removes the hard-coded checks without losing existing context rows", () => {
    const database = new BetterSqlite3(":memory:");
    database.exec(migration("0002_paipan_contexts.sql"));
    database.exec(migration("0003_expand_paipan_contexts.sql"));
    database.prepare(
      `INSERT INTO paipan_contexts (
        reference_hash, chart_type, schema_version, chart_request_json,
        chart_json, generated_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      "known-hash",
      "dunjia",
      "guoxue.paipan.dunjia.v1",
      '{"chartDateTime":"2026-08-11 16:00"}',
      '{"overview":{},"palaces":[]}',
      "2026-08-11T08:00:00.000Z",
      "2026-08-11T10:00:00.000Z",
    );

    database.exec(migration("0004_open_paipan_context_registry.sql"));

    expect(database.prepare("SELECT * FROM paipan_contexts").get()).toMatchObject({
      reference_hash: "known-hash",
      chart_type: "dunjia",
      schema_version: "guoxue.paipan.dunjia.v1",
    });
    const schema = database.prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'paipan_contexts'",
    ).get() as { sql: string };
    expect(schema.sql).not.toContain("CHECK");
    expect(() => database.prepare(
      `INSERT INTO paipan_contexts VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      "future-hash",
      "future_chart",
      "guoxue.paipan.future.v1",
      "{}",
      "{}",
      "2026-08-11T08:00:00.000Z",
      "2026-08-11T10:00:00.000Z",
    )).not.toThrow();
    database.close();
  });
});
