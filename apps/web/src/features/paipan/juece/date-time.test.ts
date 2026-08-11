import { describe, expect, it } from "vitest";
import { shiftClockDateTime } from "./date-time";

describe("shiftClockDateTime", () => {
  it("moves the original clock by two hours across day, month and year boundaries", () => {
    expect(shiftClockDateTime("2026-08-11 23:10", 2)).toBe("2026-08-12 01:10");
    expect(shiftClockDateTime("2026-03-01 00:30", -2)).toBe("2026-02-28 22:30");
    expect(shiftClockDateTime("2026-12-31 23:30", 2)).toBe("2027-01-01 01:30");
  });
});
