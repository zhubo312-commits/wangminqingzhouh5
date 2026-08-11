CREATE TABLE paipan_contexts_next (
  reference_hash TEXT PRIMARY KEY NOT NULL,
  chart_type TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  chart_request_json TEXT NOT NULL,
  chart_json TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  CHECK (chart_type IN ('shengping_zishi', 'dunjia')),
  CHECK (schema_version IN ('guoxue.paipan.bazi.v1', 'guoxue.paipan.dunjia.v1'))
);

INSERT INTO paipan_contexts_next (
  reference_hash, chart_type, schema_version, chart_request_json,
  chart_json, generated_at, expires_at
)
SELECT
  reference_hash, chart_type, schema_version, chart_request_json,
  chart_json, generated_at, expires_at
FROM paipan_contexts;

DROP TABLE paipan_contexts;
ALTER TABLE paipan_contexts_next RENAME TO paipan_contexts;

CREATE INDEX idx_paipan_contexts_expires_at
  ON paipan_contexts(expires_at);
