import { HomeResponseSchema } from "@guoxue/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { createDatabase, type DatabaseContext } from "./shared/database/client.js";
import { dateInTimeZone, nowIso } from "./shared/time/beijing-date.js";

const resources: Array<{ app: Awaited<ReturnType<typeof buildApp>>; database: DatabaseContext }> = [];

function config() {
  return loadConfig({
    NODE_ENV: "test",
    APP_TIMEZONE: "Asia/Shanghai",
    SQLITE_PATH: ":memory:",
    LOG_LEVEL: "silent",
    INTERPRETATION_URL: "https://gx.yipuwh.com/h6/pages/jiedu/chat?isShowPay=1",
    QUESTION_URL: "https://gx.yipuwh.com/h6/pages/jiedu/chat?isShowPay=1",
    LEARNING_URL: "https://learning.example/lead",
  });
}

const healthyPaipanFetch: typeof fetch = async (input) => {
  if (String(input).endsWith("/actuator/health")) {
    return new Response(JSON.stringify({ status: "UP" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ message: "not mocked" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
};

async function setup(seedCalendar = true, fetchImpl: typeof fetch = healthyPaipanFetch) {
  const appConfig = config();
  const database = createDatabase(":memory:");
  if (seedCalendar) {
    const date = dateInTimeZone(new Date(), appConfig.timezone);
    const timestamp = nowIso();
    database.raw
      .prepare(
        `INSERT INTO calendar_days (
          date, weekday, lunar_year, lunar_month, lunar_day, zodiac,
          solar_term, source_url, source_raw, imported_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        date,
        "星期一",
        "丙午年",
        "六月",
        "廿八",
        "马",
        null,
        "https://www.hko.gov.hk/source",
        "fixture",
        timestamp,
        timestamp,
        timestamp,
      );
  }
  const app = await buildApp({ config: appConfig, database, fetchImpl, serveStatic: false });
  resources.push({ app, database });
  return { app, database };
}

afterEach(async () => {
  for (const resource of resources.splice(0)) {
    await resource.app.close();
    resource.database.close();
  }
});

describe("public API", () => {
  it("returns today's combined calendar and stable guidance", async () => {
    const { app } = await setup();
    const first = await app.inject({ method: "GET", url: "/api/v1/home" });
    const second = await app.inject({ method: "GET", url: "/api/v1/home" });

    expect(first.statusCode).toBe(200);
    const firstBody = HomeResponseSchema.parse(first.json());
    expect(firstBody.calendar).toMatchObject({ lunarYear: "丙午年", zodiac: "马" });
    expect(second.json().guidance).toEqual(firstBody.guidance);
    expect(first.headers["x-request-id"]).toBeTruthy();
  });

  it("records only supported anonymous event counters", async () => {
    const { app, database } = await setup();
    const valid = await app.inject({
      method: "POST",
      url: "/api/v1/events",
      headers: { origin: "http://127.0.0.1:5173" },
      payload: { event: "paipan_click" },
    });
    const invalid = await app.inject({
      method: "POST",
      url: "/api/v1/events",
      payload: { event: "phone_number" },
    });

    expect(valid.statusCode).toBe(204);
    expect(invalid.statusCode).toBe(422);
    const row = database.raw
      .prepare("SELECT count FROM event_daily_counts WHERE event_type = ?")
      .get("paipan_click") as { count: number };
    expect(row.count).toBe(1);
  });

  it("reports readiness and returns RFC-style error when calendar data is absent", async () => {
    const { app } = await setup(false);
    const ready = await app.inject({ method: "GET", url: "/ready" });
    const home = await app.inject({ method: "GET", url: "/api/v1/home" });

    expect(ready.statusCode).toBe(503);
    expect(home.statusCode).toBe(503);
    expect(home.headers["content-type"]).toContain("application/problem+json");
    expect(home.json()).toMatchObject({
      status: 503,
      title: "Service Unavailable",
    });
  });

  it("proxies paipan requests as JSON posts without putting birth data in the URL", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toBe("http://127.0.0.1:8080/internal/v1/bazi/resolve-birth");
      expect(init).toMatchObject({ method: "POST" });
      expect(String(input)).not.toContain("1990");
      expect(JSON.parse(String(init?.body))).toEqual({
        mode: "solar",
        solarDateTime: "1990-01-01 12:30",
      });
      return new Response(
        JSON.stringify({
          candidates: [
            {
              id: "1990-01-01 12:30",
              solarDateTime: "1990-01-01 12:30",
              label: "1990-01-01 12:30（阳历）",
            },
          ],
          sect: 2,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    const { app } = await setup(true, fetchMock);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/bazi/resolve-birth",
      payload: { mode: "solar", solarDateTime: "1990-01-01 12:30" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ sect: 2 });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("returns 422 before calling Java when public paipan input is invalid", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const { app } = await setup(true, fetchMock);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/paipan/bazi/chart",
      payload: { name: "", gender: "unknown" },
    });

    expect(response.statusCode).toBe(422);
    expect(response.headers["content-type"]).toContain("application/problem+json");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("converts Java failure and timeout into 502 and 504 problem details", async () => {
    const upstreamFailure: typeof fetch = async () =>
      new Response(JSON.stringify({ code: "ALGORITHM_ERROR" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    const timeout: typeof fetch = async () => {
      throw new DOMException("timed out", "TimeoutError");
    };
    const failed = await setup(true, upstreamFailure);
    const timedOut = await setup(true, timeout);
    const payload = {
      mode: "solar",
      solarDateTime: "1990-01-01 12:30",
    };

    const badGateway = await failed.app.inject({
      method: "POST",
      url: "/api/v1/paipan/bazi/resolve-birth",
      payload,
    });
    const gatewayTimeout = await timedOut.app.inject({
      method: "POST",
      url: "/api/v1/paipan/bazi/resolve-birth",
      payload,
    });

    expect(badGateway.statusCode).toBe(502);
    expect(badGateway.json()).toMatchObject({ status: 502, title: "Bad Gateway" });
    expect(gatewayTimeout.statusCode).toBe(504);
    expect(gatewayTimeout.json()).toMatchObject({ status: 504, title: "Gateway Timeout" });
  });

  it("includes algorithm readiness in the aggregate readiness check", async () => {
    const { app } = await setup(true);
    const response = await app.inject({ method: "GET", url: "/ready" });
    expect(response.statusCode).toBe(200);
    expect(response.json().checks.paipan).toBe("ok");
  });
});
