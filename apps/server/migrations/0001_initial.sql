CREATE TABLE IF NOT EXISTS calendar_days (
  date TEXT PRIMARY KEY NOT NULL,
  weekday TEXT NOT NULL,
  lunar_year TEXT NOT NULL,
  lunar_month TEXT NOT NULL,
  lunar_day TEXT NOT NULL,
  zodiac TEXT NOT NULL,
  solar_term TEXT,
  source_url TEXT NOT NULL,
  source_raw TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (length(date) = 10)
);

CREATE TABLE IF NOT EXISTS daily_guidance (
  date TEXT PRIMARY KEY NOT NULL,
  guidance TEXT NOT NULL,
  suitable_json TEXT NOT NULL,
  avoid_json TEXT NOT NULL,
  source TEXT NOT NULL,
  source_date TEXT,
  workflow_run_id TEXT,
  generated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (source IN ('dify', 'fallback', 'seed'))
);

CREATE TABLE IF NOT EXISTS generation_runs (
  id TEXT PRIMARY KEY NOT NULL,
  target_date TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  workflow_run_id TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (status IN ('success', 'failed', 'skipped', 'fallback'))
);

CREATE INDEX IF NOT EXISTS idx_generation_runs_target_date
  ON generation_runs(target_date, started_at DESC);

CREATE TABLE IF NOT EXISTS event_daily_counts (
  date TEXT NOT NULL,
  event_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (date, event_type),
  CHECK (event_type IN (
    'home_view',
    'paipan_click',
    'interpretation_click',
    'learning_click',
    'question_click'
  )),
  CHECK (count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_daily_guidance_generated_at
  ON daily_guidance(generated_at DESC);
