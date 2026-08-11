import { afterEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "../config/env.js";
import { createDatabase, type DatabaseContext } from "../shared/database/client.js";
import { DifyClient } from "./dify-client.js";
import { GuidanceRepository } from "./guidance.repository.js";
import { GuidanceService } from "./guidance.service.js";

const openDatabases: DatabaseContext[] = [];

function testConfig() {
  return loadConfig({
    NODE_ENV: "test",
    APP_TIMEZONE: "Asia/Shanghai",
    SQLITE_PATH: ":memory:",
    LOG_LEVEL: "silent",
    DIFY_BASE_URL: "https://dify.example/v1",
    DIFY_API_KEY: "test-key",
  });
}

function setup(fetchImpl: typeof fetch) {
  const database = createDatabase(":memory:");
  openDatabases.push(database);
  const repository = new GuidanceRepository(database);
  const service = new GuidanceService(
    repository,
    new DifyClient(testConfig().dify, fetchImpl),
  );
  return { database, repository, service };
}

afterEach(() => {
  for (const database of openDatabases.splice(0)) database.close();
  vi.restoreAllMocks();
});

describe("GuidanceService", () => {
  it("persists valid Dify output and skips duplicate successful generation", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          workflow_run_id: "run-1",
          data: {
            status: "succeeded",
            outputs: {
              guidance: "静心而行，今日先完成最重要的一件事。",
              suitable: ["静心", "学习"],
              avoid: ["急躁"],
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;
    const { service } = setup(fetchImpl);

    const first = await service.generateForDate("2026-08-10", {
      attempt: 1,
      allowFallback: false,
    });
    const second = await service.generateForDate("2026-08-10", {
      attempt: 2,
      allowFallback: false,
    });

    expect(first.source).toBe("dify");
    expect(second).toEqual(first);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("creates one stable seed when Dify output is invalid", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: { status: "succeeded", outputs: { guidance: "缺少宜忌" } },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;
    const { service } = setup(fetchImpl);

    const first = await service.generateForDate("2026-08-10", {
      attempt: 3,
      allowFallback: true,
    });
    const second = service.getOrCreateForDate("2026-08-10");

    expect(first.source).toBe("seed");
    expect(second).toEqual(first);
  });

  it("reuses a recent successful record as fallback", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const { repository, service } = setup(fetchImpl);
    repository.save({
      date: "2026-08-01",
      guidance: {
        text: "历史成功指引",
        suitable: ["学习"],
        avoid: ["急躁"],
      },
      source: "dify",
      sourceDate: null,
      workflowRunId: "old-run",
      generatedAt: new Date().toISOString(),
    });

    const fallback = await service.generateForDate("2026-08-10", {
      attempt: 3,
      allowFallback: true,
    });

    expect(fallback.source).toBe("fallback");
    expect(fallback.sourceDate).toBe("2026-08-01");
    expect(fallback.guidance.text).toBe("历史成功指引");
  });

  it("records two failed attempts before the final stable fallback", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new DOMException("The operation timed out", "TimeoutError");
    }) as unknown as typeof fetch;
    const { database, service } = setup(fetchImpl);

    await expect(
      service.generateForDate("2026-08-11", {
        attempt: 1,
        allowFallback: false,
      }),
    ).rejects.toMatchObject({ code: "DIFY_NETWORK_ERROR" });
    await expect(
      service.generateForDate("2026-08-11", {
        attempt: 2,
        allowFallback: false,
      }),
    ).rejects.toMatchObject({ code: "DIFY_NETWORK_ERROR" });

    const fallback = await service.generateForDate("2026-08-11", {
      attempt: 3,
      allowFallback: true,
    });
    const runs = database.raw
      .prepare(
        "SELECT attempt, status, error_code AS errorCode FROM generation_runs WHERE target_date = ? ORDER BY attempt",
      )
      .all("2026-08-11");

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fallback.source).toBe("seed");
    expect(runs).toEqual([
      { attempt: 1, status: "failed", errorCode: "DIFY_NETWORK_ERROR" },
      { attempt: 2, status: "failed", errorCode: "DIFY_NETWORK_ERROR" },
      { attempt: 3, status: "fallback", errorCode: "DIFY_NETWORK_ERROR" },
    ]);
    expect(service.getOrCreateForDate("2026-08-11")).toEqual(fallback);
  });
});
