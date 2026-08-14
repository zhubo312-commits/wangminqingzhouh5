import { describe, expect, it } from "vitest";
import { ConfigurationError } from "./errors.js";
import { loadKangxiConfig } from "./config.js";

describe("Kangxi crawler configuration", () => {
  it("accepts an explicitly authorized high-throughput run", () => {
    const config = loadKangxiConfig({
      KANGXI_HTML_CONCURRENCY: "200",
      KANGXI_ASSET_CONCURRENCY: "300",
      KANGXI_MIN_DELAY_MS: "20",
      KANGXI_ASSET_HOSTS: "ygsf.cdn.bcebos.com, media.kangxizidian.cn,ygsf.cdn.bcebos.com",
    });
    expect(config.htmlConcurrency).toBe(200);
    expect(config.assetConcurrency).toBe(300);
    expect(config.minDelayMs).toBe(20);
    expect(config.authorizedAssetHosts).toEqual(["ygsf.cdn.bcebos.com", "media.kangxizidian.cn"]);
  });

  it.each([
    { KANGXI_HTML_CONCURRENCY: "301" },
    { KANGXI_ASSET_CONCURRENCY: "501" },
    { KANGXI_MIN_DELAY_MS: "4" },
  ])("rejects unsafe values: %o", (environment) => {
    expect(() => loadKangxiConfig(environment)).toThrow(ConfigurationError);
  });
});
