import { describe, expect, it } from "vitest";
import { cyclicalYear, parseHkoYearFile, toSimplified } from "./hko-parser.js";

describe("HKO calendar parser", () => {
  it("carries the lunar month across Gregorian new year and switches zodiac at lunar new year", () => {
    const parsed = parseHkoYearFile(
      `2026(丙午 - 肖馬)年公曆與農曆日期對照表
公曆日期 農曆日期 星期 節氣
2026年1月1日 十三 星期四
2026年2月17日 正月 星期二
2026年2月18日 初二 星期三 雨水`,
      { initialLunarMonth: "十一月", validateCompleteYear: false },
    );

    expect(parsed.days[0]).toMatchObject({
      date: "2026-01-01",
      lunarYear: "乙巳年",
      lunarMonth: "十一月",
      lunarDay: "十三",
      zodiac: "蛇",
    });
    expect(parsed.days[1]).toMatchObject({
      lunarYear: "丙午年",
      lunarMonth: "正月",
      lunarDay: "初一",
      zodiac: "马",
    });
    expect(parsed.days[2]?.solarTerm).toBe("雨水");
  });

  it("normalizes leap months and traditional solar-term characters", () => {
    const parsed = parseHkoYearFile(
      `2028(戊申 - 肖猴)年公曆與農曆日期對照表
2028年6月23日 閏五月 星期五 驚蟄`,
      { initialLunarMonth: "五月", validateCompleteYear: false },
    );
    expect(parsed.days[0]).toMatchObject({
      lunarMonth: "闰五月",
      lunarDay: "初一",
      solarTerm: "惊蛰",
    });
  });

  it("validates cyclical years and simplified characters", () => {
    expect(cyclicalYear(2026)).toEqual({ label: "丙午年", zodiac: "马" });
    expect(toSimplified("處暑與穀雨")).toBe("处暑與谷雨");
  });

  it("accepts the historic HKO zodiac name for dog years", () => {
    const parsed = parseHkoYearFile(
      `1910(庚戌-肖犬)年公曆與農曆日期對照表
1910年1月1日 二十 星期六
1910年2月10日 正月 星期四`,
      { initialLunarMonth: "十一月", validateCompleteYear: false },
    );

    expect(parsed.days[1]).toMatchObject({
      lunarYear: "庚戌年",
      zodiac: "狗",
    });
  });

  it("rejects incomplete official year files by default", () => {
    expect(() =>
      parseHkoYearFile(
        `2026(丙午 - 肖馬)年公曆與農曆日期對照表
2026年1月1日 十三 星期四`,
        { initialLunarMonth: "十一月" },
      ),
    ).toThrow("Incomplete HKO calendar");
  });
});
