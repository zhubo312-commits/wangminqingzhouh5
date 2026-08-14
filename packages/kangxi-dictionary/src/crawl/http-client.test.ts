import { describe, expect, it, vi } from "vitest";
import { createLogger } from "../shared/logger.js";
import { RateLimitedHttpClient } from "./http-client.js";

describe("RateLimitedHttpClient", () => {
  it("retries transient HTTP responses and returns the final body", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("busy", { status: 500 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200, headers: { "content-type": "text/html", etag: "v1" } }));
    const client = new RateLimitedHttpClient({
      minDelayMs: 0, timeoutMs: 1_000, retries: 1, userAgent: "test archive client",
    }, createLogger("error"), fetchMock);
    const result = await client.fetch("https://example.test/a");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.body.toString()).toBe("ok");
    expect(result.etag).toBe("v1");
  });

  it("passes conditional request headers", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 304 }));
    const client = new RateLimitedHttpClient({
      minDelayMs: 0, timeoutMs: 1_000, retries: 0, userAgent: "test archive client",
    }, createLogger("error"), fetchMock);
    await client.fetch("https://example.test/a", { etag: "v1", lastModified: "date" });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("if-none-match")).toBe("v1");
    expect(new Headers(init.headers).get("if-modified-since")).toBe("date");
  });
});
