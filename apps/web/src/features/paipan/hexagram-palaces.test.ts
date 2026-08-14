import { describe, expect, it } from "vitest";
import { getHexagramMeta, HEXAGRAM_NAMES, HEXAGRAM_PALACES } from "./hexagram-palaces";

describe("shared eight-palace hexagram catalog", () => {
  it("contains eight unique hexagrams in each palace and all sixty-four overall", () => {
    expect(HEXAGRAM_PALACES).toHaveLength(8);
    expect(HEXAGRAM_PALACES.every((palace) => palace.hexagrams.length === 8)).toBe(true);
    const groupedNames = HEXAGRAM_PALACES.flatMap((palace) => palace.hexagrams);
    expect(new Set(groupedNames)).toHaveLength(64);
    expect(new Set(HEXAGRAM_NAMES)).toEqual(new Set(groupedNames));
  });

  it("maps King Wen numbers, hexagram symbols and palace metadata", () => {
    expect(getHexagramMeta("乾为天")).toMatchObject({ number: 1, symbol: "䷀", palaceName: "乾" });
    expect(getHexagramMeta("火水未济")).toMatchObject({ number: 64, symbol: "䷿", palaceName: "离" });
  });
});
