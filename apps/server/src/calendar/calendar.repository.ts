import type { DatabaseContext } from "../shared/database/client.js";
import type { ParsedCalendarDay } from "./hko-parser.js";

export interface CalendarDayRecord extends ParsedCalendarDay {
  sourceUrl: string;
  importedAt: string;
}

export class CalendarRepository {
  constructor(private readonly database: DatabaseContext) {}

  findByDate(date: string): CalendarDayRecord | null {
    const row = this.database.raw
      .prepare(
        `SELECT
          date,
          weekday,
          lunar_year AS lunarYear,
          lunar_month AS lunarMonth,
          lunar_day AS lunarDay,
          zodiac,
          solar_term AS solarTerm,
          source_url AS sourceUrl,
          source_raw AS sourceRaw,
          imported_at AS importedAt
        FROM calendar_days
        WHERE date = ?`,
      )
      .get(date) as CalendarDayRecord | undefined;
    return row ?? null;
  }

  count(): number {
    const row = this.database.raw
      .prepare("SELECT COUNT(*) AS count FROM calendar_days")
      .get() as { count: number };
    return row.count;
  }

  upsertYear(
    days: ParsedCalendarDay[],
    sourceUrl: string,
    importedAt: string,
  ): void {
    const statement = this.database.raw.prepare(`
      INSERT INTO calendar_days (
        date, weekday, lunar_year, lunar_month, lunar_day, zodiac,
        solar_term, source_url, source_raw, imported_at, created_at, updated_at
      ) VALUES (
        @date, @weekday, @lunarYear, @lunarMonth, @lunarDay, @zodiac,
        @solarTerm, @sourceUrl, @sourceRaw, @importedAt, @now, @now
      )
      ON CONFLICT(date) DO UPDATE SET
        weekday = excluded.weekday,
        lunar_year = excluded.lunar_year,
        lunar_month = excluded.lunar_month,
        lunar_day = excluded.lunar_day,
        zodiac = excluded.zodiac,
        solar_term = excluded.solar_term,
        source_url = excluded.source_url,
        source_raw = excluded.source_raw,
        imported_at = excluded.imported_at,
        updated_at = excluded.updated_at
    `);

    this.database.raw.transaction(() => {
      for (const day of days) {
        statement.run({
          ...day,
          sourceUrl,
          importedAt,
          now: importedAt,
        });
      }
    })();
  }
}
