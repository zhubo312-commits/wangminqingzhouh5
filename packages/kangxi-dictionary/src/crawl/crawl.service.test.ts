import { describe, expect, it } from "vitest";
import { isAuthorizedSourceUrl } from "./crawl.service.js";

describe("crawler source authorization", () => {
  it("keeps pages on the source domain and permits only explicitly listed external media hosts", () => {
    const base = "https://www.kangxizidian.cn";
    const mediaHosts = ["ygsf.cdn.bcebos.com"];
    expect(isAuthorizedSourceUrl("https://www.kangxizidian.cn/kangxi/1.html", base)).toBe(true);
    expect(isAuthorizedSourceUrl("https://static.kangxizidian.cn/a.svg", base)).toBe(false);
    expect(isAuthorizedSourceUrl("https://ygsf.cdn.bcebos.com/zidian/book/1.jpg", base, mediaHosts)).toBe(true);
    expect(isAuthorizedSourceUrl("https://evil.example/zidian/book/1.jpg", base, mediaHosts)).toBe(false);
  });
});
