import { describe, expect, it } from "vitest";
import { lunarMonthOptionsForYear } from "./BaziMobilePickers";

describe("lunarMonthOptionsForYear", () => {
  it("keeps a common lunar year to twelve ordinary months", () => {
    const months = lunarMonthOptionsForYear(1989);

    expect(months).toHaveLength(12);
    expect(months.some((month) => month.leapMonth)).toBe(false);
    expect(months.at(-1)).toMatchObject({
      value: "12",
      label: "腊月（12）",
      month: 12,
      leapMonth: false,
      dayCount: 30,
    });
  });

  it("inserts the leap occurrence after its ordinary month", () => {
    const months = lunarMonthOptionsForYear(1990);
    const ordinaryMayIndex = months.findIndex((month) => month.value === "5");
    const leapMayIndex = months.findIndex((month) => month.value === "-5");

    expect(months).toHaveLength(13);
    expect(leapMayIndex).toBe(ordinaryMayIndex + 1);
    expect(months[ordinaryMayIndex]).toMatchObject({ label: "五月（5）", dayCount: 30 });
    expect(months[leapMayIndex]).toMatchObject({
      label: "闰五月（5）",
      month: 5,
      leapMonth: true,
      dayCount: 29,
    });
  });
});
