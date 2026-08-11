import type { CalendarInfo } from "@guoxue/contracts";
import { ServiceUnavailableError } from "../shared/errors/app-error.js";
import type { CalendarRepository } from "./calendar.repository.js";

export class CalendarService {
  constructor(private readonly repository: CalendarRepository) {}

  getForDate(date: string): { weekday: string; calendar: CalendarInfo } {
    const row = this.repository.findByDate(date);
    if (!row) {
      throw new ServiceUnavailableError(
        "CALENDAR_NOT_IMPORTED",
        `Calendar data is unavailable for ${date}`,
      );
    }

    return {
      weekday: row.weekday,
      calendar: {
        lunarYear: row.lunarYear,
        lunarMonth: row.lunarMonth,
        lunarDay: row.lunarDay,
        zodiac: row.zodiac,
        solarTerm: row.solarTerm,
      },
    };
  }
}
