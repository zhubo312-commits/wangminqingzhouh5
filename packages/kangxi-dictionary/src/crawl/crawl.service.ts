import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { KangxiConfig } from "../shared/config.js";
import type { Logger } from "../shared/logger.js";
import { sha256 } from "../shared/hash.js";
import { CrawlError, ParseError } from "../shared/errors.js";
import { parseCharacterPage, parseIndexPage, parseScanPage } from "../characters/parser.js";
import { CharacterRepository } from "../characters/character.repository.js";
import { BookRepository } from "../books/book.repository.js";
import type { AssetKind, DiscoveredLink, PageKind } from "../domain/types.js";
import {
  CrawlRepository,
  type SourceAssetRow,
  type SourcePageRow,
} from "./crawl.repository.js";
import type { HttpClient, FetchMetadata } from "./http-client.js";

const ROOT_SEEDS = ["/", "/bihua/", "/wuxing/", "/pinyin/", "/bushou/", "/jixiong/", "/pingze/", "/xingmingxue/"];
const PILOT_CHARACTERS = ["一", "乚", "辰", "李", "明", "欧", "歐", "阳", "陽", "子", "涵"];

function extensionFor(contentType: string | null, url: string): string {
  const pathnameExtension = path.extname(new URL(url).pathname).toLowerCase();
  if (pathnameExtension && pathnameExtension.length <= 8) return pathnameExtension;
  const value = contentType?.split(";", 1)[0]?.trim();
  return ({
    "text/html": ".html",
    "image/svg+xml": ".svg",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "audio/mpeg": ".mp3",
  } as Record<string, string>)[value ?? ""] ?? ".bin";
}

function pageKindFromFinalUrl(url: string, fallback: PageKind): PageKind {
  const pathname = new URL(url).pathname;
  if (/^\/kangxi\/\d+\.html$/.test(pathname)) return "character";
  if (/^\/tupian\/[a-z]+_\d+\.html$/.test(pathname)) return "scan";
  return fallback === "search" ? "index" : fallback;
}

export function isAuthorizedSourceUrl(value: string, baseUrl: string, additionalHosts: string[] = []): boolean {
  const host = new URL(value).hostname;
  const authorizedHost = new URL(baseUrl).hostname;
  return host === authorizedHost || host.endsWith(`.${authorizedHost}`) || additionalHosts.includes(host.toLowerCase());
}

async function mapConcurrent<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      if (item !== undefined) await worker(item);
    }
  });
  await Promise.all(workers);
}

export class CrawlService {
  constructor(
    private readonly config: KangxiConfig,
    private readonly crawlRepository: CrawlRepository,
    private readonly characterRepository: CharacterRepository,
    private readonly bookRepository: BookRepository,
    private readonly httpClient: HttpClient,
    private readonly logger: Logger,
  ) {}

  prepare(releaseId: string, runId: string, mode: "discover" | "pilot" | "full" | "incremental"): void {
    this.crawlRepository.ensureRelease(
      releaseId, this.config.schemaVersion, this.config.parserVersion, this.config.baseUrl,
    );
    this.crawlRepository.ensureRun(runId, releaseId, mode, {
      baseUrl: this.config.baseUrl,
      htmlConcurrency: this.config.htmlConcurrency,
      assetConcurrency: this.config.assetConcurrency,
      minDelayMs: this.config.minDelayMs,
      timeoutMs: this.config.timeoutMs,
      retries: this.config.retries,
      parserVersion: this.config.parserVersion,
    });
    this.crawlRepository.resetInterrupted(runId);
    // Parsing is deterministic and runs from the immutable cached HTML. A new
    // CLI invocation may contain a fixed parser, so parser failures get a fresh
    // retry budget while exhausted HTTP failures remain capped.
    this.crawlRepository.resetParserFailures(runId);
    this.crawlRepository.startRun(runId);
  }

  seedDiscovery(runId: string): void {
    for (const relative of ROOT_SEEDS) this.crawlRepository.upsertPage(
      runId, new URL(relative, this.config.baseUrl).toString(), relative === "/" ? "root" : "index",
    );
  }

  seedPilot(runId: string): void {
    for (const character of PILOT_CHARACTERS) {
      const url = new URL("/kangxi/search.php", this.config.baseUrl);
      url.searchParams.set("zi", character);
      this.crawlRepository.upsertPage(runId, url.toString(), "search", character);
    }
  }

  async discover(releaseId: string, runId: string): Promise<Record<string, number>> {
    this.prepare(releaseId, runId, "discover");
    this.seedDiscovery(runId);
    try {
      await this.drainPages(runId, releaseId, ["root", "index", "search"], false);
      const counts = this.crawlRepository.counts(runId);
      this.crawlRepository.finishRun(runId, counts.pagesFailed ? "failed" : "succeeded");
      return counts;
    } catch (error) {
      this.crawlRepository.finishRun(runId, "failed");
      throw error;
    }
  }

  async crawl(
    releaseId: string,
    runId: string,
    options: { pilot?: boolean; includeAssets?: boolean; retryFailed?: boolean } = {},
  ): Promise<Record<string, number>> {
    this.prepare(releaseId, runId, options.pilot ? "pilot" : "full");
    if (options.retryFailed) this.crawlRepository.resetFailed(runId);
    if (options.pilot) this.seedPilot(runId);
    else this.seedDiscovery(runId);
    try {
      if (options.pilot) {
        await this.drainPages(runId, releaseId, ["search", "character", "scan"], false);
        this.characterRepository.rebuildForms(releaseId);
      } else {
        // Complete the index union before details so early character relations
        // cannot starve undiscovered pinyin/radical/element collection pages.
        await this.drainPages(runId, releaseId, ["root", "index", "search"], true);
        await this.drainPages(runId, releaseId, ["character"], true);
        // Character pages can still expose a previously unseen content index;
        // one reconciliation pass reaches its details before scanning books.
        await this.drainPages(runId, releaseId, ["root", "index", "search"], true);
        await this.drainPages(runId, releaseId, ["character"], true);
        this.characterRepository.rebuildForms(releaseId);
        await this.drainPages(runId, releaseId, ["scan"], true);
      }
      if (options.includeAssets !== false) await this.drainAssets(runId);
      const counts = this.crawlRepository.counts(runId);
      this.crawlRepository.finishRun(runId, counts.pagesFailed || counts.assetsFailed ? "failed" : "succeeded");
      return counts;
    } catch (error) {
      this.crawlRepository.finishRun(runId, "failed");
      throw error;
    }
  }

  private async drainPages(runId: string, releaseId: string, kinds: PageKind[], recursive: boolean): Promise<void> {
    while (true) {
      const batch = this.crawlRepository.pendingPages(
        runId, kinds, this.config.htmlConcurrency * 4, this.config.retries + 1,
      );
      if (!batch.length) break;
      await mapConcurrent(batch, this.config.htmlConcurrency, async (page) => {
        await this.processPage(page, releaseId, recursive);
      });
    }
  }

  private async processPage(page: SourcePageRow, releaseId: string, recursive: boolean): Promise<void> {
    this.crawlRepository.markPageFetching(page.id);
    try {
      if (!isAuthorizedSourceUrl(page.url, this.config.baseUrl)) {
        this.crawlRepository.failPage(page.id, "failed", "HOST_NOT_AUTHORIZED", "Page host is outside the authorized source domain");
        return;
      }
      const response = await this.httpClient.fetch(page.url, { etag: page.etag, lastModified: page.last_modified });
      if (response.status === 404 || response.status === 410) {
        this.crawlRepository.failPage(page.id, "source_missing", `HTTP_${response.status}`, "Source page is absent", response.status);
        return;
      }
      if (response.status === 304 && page.local_path && page.content_sha256) {
        const body = readFileSync(path.resolve(this.config.dataRoot, page.local_path));
        this.crawlRepository.completePage(page.id, {
          resolvedUrl: response.finalUrl,
          httpStatus: 304,
          contentType: response.contentType,
          etag: response.etag ?? page.etag,
          lastModified: response.lastModified ?? page.last_modified,
          sha256: page.content_sha256,
          localPath: page.local_path,
        }, sourceKeyFromUrl(response.finalUrl));
        await this.parseAndPersistPage(page, releaseId, response.finalUrl, body.toString("utf8"), recursive);
        this.crawlRepository.markPageParsed(page.id);
        return;
      }
      if (response.status < 200 || response.status >= 300) {
        this.crawlRepository.failPage(page.id, "failed", `HTTP_${response.status}`, "Unexpected HTTP response", response.status);
        return;
      }
      const stored = this.storeContent(response, "raw/pages", page.page_kind);
      this.crawlRepository.completePage(page.id, stored, sourceKeyFromUrl(response.finalUrl));
      await this.parseAndPersistPage(page, releaseId, response.finalUrl, response.body.toString("utf8"), recursive);
      this.crawlRepository.markPageParsed(page.id);
      this.logger.info("Page archived", { pageId: page.id, kind: page.page_kind, url: response.finalUrl });
    } catch (error) {
      const code = error instanceof ParseError ? error.code : error instanceof CrawlError ? error.code : "UNEXPECTED_ERROR";
      this.crawlRepository.failPage(page.id, "failed", code, error instanceof Error ? error.message : String(error));
      this.logger.error("Page processing failed", { pageId: page.id, url: page.url, code, error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async parseAndPersistPage(
    page: SourcePageRow,
    releaseId: string,
    finalUrl: string,
    html: string,
    recursive: boolean,
  ): Promise<void> {
    const kind = pageKindFromFinalUrl(finalUrl, page.page_kind);
    if (kind === "character") {
      const parsed = parseCharacterPage(html, finalUrl);
      this.characterRepository.persist(page.run_id, releaseId, page.id, parsed);
      for (const asset of parsed.assets) this.crawlRepository.upsertAsset(page.run_id, asset.url, asset.kind, page.id, asset.role);
      for (const scan of parsed.scanReferences) this.crawlRepository.upsertPage(page.run_id, scan.sourceUrl, "scan", `${scan.editionKey}:${scan.pageNumber}`, page.id);
      if (recursive) this.persistLinks(page, parsed.links);
      return;
    }
    if (kind === "scan") {
      const parsed = parseScanPage(html, finalUrl);
      this.bookRepository.persist(releaseId, page.id, parsed);
      for (const asset of parsed.assets) this.crawlRepository.upsertAsset(page.run_id, asset.url, asset.kind, page.id, asset.role);
      if (recursive) this.persistLinks(page, parsed.links);
      return;
    }
    const parsed = parseIndexPage(html, finalUrl);
    this.crawlRepository.replaceIndexData(page.id, page.run_id, parsed.groups, parsed.entries);
    this.persistLinks(page, parsed.links);
    for (const entry of parsed.entries) this.crawlRepository.upsertPage(
      page.run_id, entry.characterUrl, "character", entry.sourceCharacterId, page.id,
    );
  }

  private persistLinks(page: SourcePageRow, links: DiscoveredLink[]): void {
    for (const link of links) this.crawlRepository.upsertPage(
      page.run_id, link.url, link.kind, link.sourceKey ?? null, page.id,
    );
  }

  private async drainAssets(runId: string): Promise<void> {
    while (true) {
      const batch = this.crawlRepository.pendingAssets(
        runId, this.config.assetConcurrency * 4, this.config.retries + 1,
      );
      if (!batch.length) break;
      await mapConcurrent(batch, this.config.assetConcurrency, async (asset) => {
        await this.processAsset(asset);
      });
    }
  }

  private async processAsset(asset: SourceAssetRow): Promise<void> {
    this.crawlRepository.markAssetFetching(asset.id);
    try {
      if (!isAuthorizedSourceUrl(asset.url, this.config.baseUrl, this.config.authorizedAssetHosts)) {
        this.crawlRepository.failAsset(asset.id, "failed", "HOST_NOT_AUTHORIZED", "Asset host is outside the authorized source domain");
        return;
      }
      const response = await this.httpClient.fetch(asset.url, { etag: asset.etag, lastModified: asset.last_modified });
      if (response.status === 404 || response.status === 410) {
        this.crawlRepository.failAsset(asset.id, "source_missing", `HTTP_${response.status}`, "Source asset is absent", response.status);
        return;
      }
      if (response.status === 304 && asset.local_path && asset.content_sha256) {
        const body = readFileSync(path.resolve(this.config.dataRoot, asset.local_path));
        this.crawlRepository.completeAsset(asset.id, {
          resolvedUrl: response.finalUrl,
          httpStatus: 304,
          contentType: response.contentType,
          etag: response.etag ?? asset.etag,
          lastModified: response.lastModified ?? asset.last_modified,
          sha256: asset.content_sha256,
          localPath: asset.local_path,
        }, body.byteLength);
        return;
      }
      if (response.status < 200 || response.status >= 300) {
        this.crawlRepository.failAsset(asset.id, "failed", `HTTP_${response.status}`, "Unexpected HTTP response", response.status);
        return;
      }
      const stored = this.storeContent(response, "assets", asset.asset_kind);
      this.crawlRepository.completeAsset(asset.id, stored, response.body.byteLength);
      this.logger.info("Asset archived", { assetId: asset.id, kind: asset.asset_kind, bytes: response.body.byteLength });
    } catch (error) {
      const code = error instanceof CrawlError ? error.code : "UNEXPECTED_ERROR";
      this.crawlRepository.failAsset(asset.id, "failed", code, error instanceof Error ? error.message : String(error));
      this.logger.error("Asset processing failed", { assetId: asset.id, url: asset.url, code });
    }
  }

  private storeContent(response: FetchMetadata, area: string, kind: string) {
    const digest = sha256(response.body);
    const extension = extensionFor(response.contentType, response.finalUrl);
    const relative = path.join("work", area, kind, digest.slice(0, 2), `${digest}${extension}`);
    const absolute = path.join(this.config.dataRoot, relative);
    if (!existsSync(absolute)) {
      mkdirSync(path.dirname(absolute), { recursive: true });
      const temporary = `${absolute}.${process.pid}.tmp`;
      writeFileSync(temporary, response.body, { flag: "wx" });
      renameSync(temporary, absolute);
    }
    return {
      resolvedUrl: response.finalUrl,
      httpStatus: response.status,
      contentType: response.contentType,
      etag: response.etag,
      lastModified: response.lastModified,
      sha256: digest,
      localPath: relative,
    };
  }
}

function sourceKeyFromUrl(value: string): string | null {
  const pathname = new URL(value).pathname;
  return pathname.match(/^\/kangxi\/(\d+)\.html$/)?.[1]
    ?? pathname.match(/^\/tupian\/([a-z]+)_(\d+)\.html$/)?.slice(1).join(":")
    ?? null;
}

export { PILOT_CHARACTERS, ROOT_SEEDS };
