import type { AnalyticsEvent } from "@guoxue/contracts";
import type { DatabaseContext } from "../shared/database/client.js";
import { nowIso } from "../shared/time/beijing-date.js";

export class EventsRepository {
  constructor(private readonly database: DatabaseContext) {}

  increment(date: string, event: AnalyticsEvent): void {
    const timestamp = nowIso();
    this.database.raw
      .prepare(
        `INSERT INTO event_daily_counts (
          date, event_type, count, created_at, updated_at
        ) VALUES (?, ?, 1, ?, ?)
        ON CONFLICT(date, event_type) DO UPDATE SET
          count = event_daily_counts.count + 1,
          updated_at = excluded.updated_at`,
      )
      .run(date, event, timestamp, timestamp);
  }

  countFor(date: string, event: AnalyticsEvent): number {
    const row = this.database.raw
      .prepare(
        "SELECT count FROM event_daily_counts WHERE date = ? AND event_type = ?",
      )
      .get(date, event) as { count: number } | undefined;
    return row?.count ?? 0;
  }
}
