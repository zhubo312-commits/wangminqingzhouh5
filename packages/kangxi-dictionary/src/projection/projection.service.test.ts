import { describe, expect, it } from "vitest";
import { normalizeSimplifiedGlyph, sanitizeTaboos } from "./projection.service.js";

describe("Kangxi naming projection", () => {
  it("uses deterministic OpenCC simplified-to-traditional normalization", () => {
    expect(normalizeSimplifiedGlyph("明")).toBe("明");
    expect(normalizeSimplifiedGlyph("欧")).toBe("歐");
    expect(normalizeSimplifiedGlyph("阳")).toBe("陽");
  });

  it("keeps the structured element and removes a contradictory taboo sentence", () => {
    expect(sanitizeTaboos("1、一字五行属性为水，不宜用火。\n2、避免同音。", "土"))
      .toBe("2、避免同音。");
  });
});
