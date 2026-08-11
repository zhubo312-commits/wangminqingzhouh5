import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const calendarDays = sqliteTable("calendar_days", {
  date: text("date").primaryKey().notNull(),
  weekday: text("weekday").notNull(),
  lunarYear: text("lunar_year").notNull(),
  lunarMonth: text("lunar_month").notNull(),
  lunarDay: text("lunar_day").notNull(),
  zodiac: text("zodiac").notNull(),
  solarTerm: text("solar_term"),
  sourceUrl: text("source_url").notNull(),
  sourceRaw: text("source_raw").notNull(),
  importedAt: text("imported_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const dailyGuidance = sqliteTable("daily_guidance", {
  date: text("date").primaryKey().notNull(),
  guidance: text("guidance").notNull(),
  suitableJson: text("suitable_json").notNull(),
  avoidJson: text("avoid_json").notNull(),
  source: text("source", { enum: ["dify", "fallback", "seed"] }).notNull(),
  sourceDate: text("source_date"),
  workflowRunId: text("workflow_run_id"),
  generatedAt: text("generated_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const generationRuns = sqliteTable("generation_runs", {
  id: text("id").primaryKey().notNull(),
  targetDate: text("target_date").notNull(),
  attempt: integer("attempt").notNull(),
  status: text("status", {
    enum: ["success", "failed", "skipped", "fallback"],
  }).notNull(),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  workflowRunId: text("workflow_run_id"),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const eventDailyCounts = sqliteTable(
  "event_daily_counts",
  {
    date: text("date").notNull(),
    eventType: text("event_type", {
      enum: [
        "home_view",
        "paipan_click",
        "interpretation_click",
        "learning_click",
        "question_click",
      ],
    }).notNull(),
    count: integer("count").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.date, table.eventType] })],
);

export const paipanContexts = sqliteTable("paipan_contexts", {
  referenceHash: text("reference_hash").primaryKey().notNull(),
  chartType: text("chart_type", { enum: ["shengping_zishi"] }).notNull(),
  schemaVersion: text("schema_version", {
    enum: ["guoxue.paipan.bazi.v1"],
  }).notNull(),
  chartRequestJson: text("chart_request_json").notNull(),
  chartJson: text("chart_json").notNull(),
  generatedAt: text("generated_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});

export const schema = {
  calendarDays,
  dailyGuidance,
  generationRuns,
  eventDailyCounts,
  paipanContexts,
};
