import { afterEach, describe, expect, it } from "vitest";
import { CharacterRepository } from "../characters/character.repository.js";
import { createKangxiDatabase, type KangxiDatabase } from "../shared/database.js";
import { parsedCharacter } from "../test/fixture.js";
import { CrawlRepository } from "./crawl.repository.js";

const databases: KangxiDatabase[] = [];
afterEach(() => { for (const database of databases.splice(0)) database.close(); });

function setup() {
  const database = createKangxiDatabase(":memory:");
  databases.push(database);
  const repository = new CrawlRepository(database.raw);
  repository.ensureRelease("r1", "v1", "p1", "https://example.test");
  repository.ensureRun("run1", "r1", "discover", {});
  return { database, repository };
}

describe("CrawlRepository resume semantics", () => {
  it("is idempotent and recovers an interrupted in-flight page", () => {
    const { database, repository } = setup();
    const first = repository.upsertPage("run1", "https://example.test/a", "index");
    expect(repository.upsertPage("run1", "https://example.test/a", "index")).toBe(first);
    repository.markPageFetching(first);
    repository.resetInterrupted("run1");
    expect(repository.pendingPages("run1", ["index"], 10, 4)).toHaveLength(1);
    expect((database.raw.prepare("SELECT COUNT(*) count FROM source_pages").get() as { count: number }).count).toBe(1);
  });

  it("refreshes the mode and grants fixed parsers a fresh local retry budget", () => {
    const { database, repository } = setup();
    const page = repository.upsertPage("run1", "https://example.test/a", "character");
    repository.markPageFetching(page);
    repository.failPage(page, "failed", "PARSE_ERROR", "old parser failed");
    database.raw.prepare("UPDATE source_pages SET attempt_count = 4 WHERE id = ?").run(page);
    repository.ensureRun("run1", "r1", "full", { parserVersion: "p2" });
    repository.resetParserFailures("run1");
    expect(repository.pendingPages("run1", ["character"], 10, 4)).toHaveLength(1);
    expect(database.raw.prepare("SELECT mode, attempt_count FROM crawl_runs JOIN source_pages ON source_pages.run_id = crawl_runs.id WHERE source_pages.id = ?").get(page))
      .toEqual({ mode: "full", attempt_count: 0 });
  });

  it("requeues only failed dead letters when explicitly requested", () => {
    const { repository } = setup();
    const failed = repository.upsertPage("run1", "https://example.test/failed", "character");
    const absent = repository.upsertPage("run1", "https://example.test/absent", "character");
    repository.failPage(failed, "failed", "HTTP_500", "server error");
    repository.failPage(absent, "source_missing", "HTTP_404", "absent");
    repository.resetFailed("run1");
    expect(repository.pendingPages("run1", ["character"], 10, 4).map((page) => page.id)).toEqual([failed]);
  });

  it("links archived pronunciation media into the canonical record", () => {
    const { database, repository } = setup();
    const page = repository.upsertPage("run1", "https://example.test/kangxi/23394.html", "character", "23394");
    new CharacterRepository(database.raw).persist("run1", "r1", page, parsedCharacter());
    const asset = repository.upsertAsset("run1", "https://example.test/chen.mp3", "pinyin_audio", page, "pinyin:chén");
    repository.completeAsset(asset, {
      resolvedUrl: "https://example.test/chen.mp3", httpStatus: 200, contentType: "audio/mpeg",
      etag: null, lastModified: null, sha256: "a".repeat(64), localPath: "work/assets/a.mp3",
    }, 12);
    expect(database.raw.prepare("SELECT pinyin_audio_asset_id FROM pronunciations").get())
      .toEqual({ pinyin_audio_asset_id: asset });
  });
});
