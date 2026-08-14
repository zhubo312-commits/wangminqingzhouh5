CREATE TABLE source_form_candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_character_id INTEGER NOT NULL REFERENCES source_characters(id) ON DELETE CASCADE,
    target_glyph TEXT NOT NULL,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('simplified', 'traditional', 'variant', 'ancient', 'compatibility')),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (source_character_id, target_glyph, relation_type)
);

CREATE INDEX idx_source_form_candidates_target ON source_form_candidates(target_glyph, relation_type);

-- Backfill pages archived before this normalized candidate table existed.
INSERT OR IGNORE INTO source_form_candidates (
    source_character_id, target_glyph, relation_type, ordinal, created_at, updated_at
)
SELECT
    sc.id,
    json_extract(candidate.value, '$.glyph'),
    json_extract(candidate.value, '$.relationType'),
    CAST(candidate.key AS INTEGER),
    sc.created_at,
    sc.updated_at
FROM source_characters sc, json_each(sc.raw_json, '$.formCandidates') candidate
WHERE json_extract(candidate.value, '$.glyph') IS NOT NULL
  AND json_extract(candidate.value, '$.relationType') IN ('simplified', 'traditional', 'variant', 'ancient', 'compatibility');
