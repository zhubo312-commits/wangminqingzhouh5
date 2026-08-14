import { CrawlError } from "../shared/errors.js";
import type { Logger } from "../shared/logger.js";

export interface FetchMetadata {
  status: number;
  finalUrl: string;
  contentType: string | null;
  etag: string | null;
  lastModified: string | null;
  body: Buffer;
}

export interface FetchConditions {
  etag?: string | null;
  lastModified?: string | null;
}

export interface HttpClientOptions {
  minDelayMs: number;
  timeoutMs: number;
  retries: number;
  userAgent: string;
}

export interface HttpClient {
  fetch(url: string, conditions?: FetchConditions): Promise<FetchMetadata>;
}

export class RateLimitedHttpClient implements HttpClient {
  private nextAllowedAt = 0;
  private throttle = Promise.resolve();

  constructor(
    private readonly options: HttpClientOptions,
    private readonly logger: Logger,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async fetch(url: string, conditions: FetchConditions = {}): Promise<FetchMetadata> {
    let lastFailure: unknown;
    for (let attempt = 0; attempt <= this.options.retries; attempt += 1) {
      await this.waitForSlot();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);
      try {
        const headers = new Headers({
          "user-agent": this.options.userAgent,
          accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/svg+xml,image/*,audio/*,*/*;q=0.8",
        });
        if (conditions.etag) headers.set("if-none-match", conditions.etag);
        if (conditions.lastModified) headers.set("if-modified-since", conditions.lastModified);
        const response = await this.fetchImpl(url, { headers, redirect: "follow", signal: controller.signal });
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < this.options.retries) {
          await response.body?.cancel();
          const retryAfter = Number(response.headers.get("retry-after"));
          await this.backoff(attempt, Number.isFinite(retryAfter) ? retryAfter * 1_000 : undefined);
          continue;
        }
        const body = Buffer.from(await response.arrayBuffer());
        return {
          status: response.status,
          finalUrl: response.url || url,
          contentType: response.headers.get("content-type"),
          etag: response.headers.get("etag"),
          lastModified: response.headers.get("last-modified"),
          body,
        };
      } catch (error) {
        lastFailure = error;
        if (attempt >= this.options.retries) break;
        this.logger.warn("Transient fetch failure", {
          url,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : String(error),
        });
        await this.backoff(attempt);
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new CrawlError("Fetch failed after retries", {
      url,
      cause: lastFailure instanceof Error ? lastFailure.message : String(lastFailure),
    });
  }

  private async waitForSlot(): Promise<void> {
    const previous = this.throttle;
    let release: () => void = () => undefined;
    this.throttle = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    const delay = Math.max(0, this.nextAllowedAt - Date.now());
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    this.nextAllowedAt = Date.now() + this.options.minDelayMs;
    release();
  }

  private async backoff(attempt: number, explicitDelay?: number): Promise<void> {
    const delay = explicitDelay ?? Math.min(8_000, 500 * 2 ** attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
