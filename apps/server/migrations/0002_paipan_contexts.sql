CREATE TABLE IF NOT EXISTS paipan_contexts (
  reference_hash TEXT PRIMARY KEY NOT NULL,
  chart_type TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  chart_request_json TEXT NOT NULL,
  chart_json TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  CHECK (chart_type = 'shengping_zishi'),
  CHECK (schema_version = 'guoxue.paipan.bazi.v1')
);

CREATE INDEX IF NOT EXISTS idx_paipan_contexts_expires_at
  ON paipan_contexts(expires_at);
