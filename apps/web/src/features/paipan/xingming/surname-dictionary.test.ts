import { describe, expect, it } from "vitest";
import { normalizeChineseFullName, splitChineseFullName } from "./surname-dictionary";

describe("splitChineseFullName", () => {
  it("uses the first character for a common single surname", () => {
    expect(splitChineseFullName("李明")).toEqual({ surname: "李", givenName: "明" });
  });

  it("prefers simplified and traditional compound surnames", () => {
    expect(splitChineseFullName("欧阳子涵")).toEqual({ surname: "欧阳", givenName: "子涵" });
    expect(splitChineseFullName("歐陽子涵")).toEqual({ surname: "歐陽", givenName: "子涵" });
    expect(splitChineseFullName("司马光")).toEqual({ surname: "司马", givenName: "光" });
  });

  it("keeps a two-character full name valid instead of treating it as a surname only", () => {
    expect(splitChineseFullName("欧阳")).toEqual({ surname: "欧", givenName: "阳" });
  });

  it("removes whitespace and limits the supported full name to five characters", () => {
    expect(normalizeChineseFullName(" 欧 阳 子 涵 ")).toBe("欧阳子涵");
    expect(normalizeChineseFullName("欧阳一二三四")).toBe("欧阳一二三");
  });
});
