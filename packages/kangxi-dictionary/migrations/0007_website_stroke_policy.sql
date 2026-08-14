-- The authorized website is the canonical source for naming and strict Kangxi
-- strokes. Modern glyph stroke counts remain reference-only and are never
-- promoted into either of these two fields.
INSERT INTO canonical_decisions (
    release_id, character_id, field_name, selected_value_json, rule_code,
    rationale, decided_by, decided_at, created_at, updated_at
)
SELECT
    c.release_id,
    c.id,
    'naming_strokes',
    CAST(cp.naming_strokes AS TEXT),
    'KANGXI_CN_WEBSITE_NAMING_STROKES',
    'Use the authorized website naming stroke field for chinese_dictionary.bihua; modern stroke observations are not equivalent.',
    'kangxi-cn-stroke-policy.v1',
    cp.updated_at,
    cp.created_at,
    cp.updated_at
FROM characters c
JOIN canonical_profiles cp ON cp.character_id = c.id
WHERE cp.naming_strokes IS NOT NULL
ON CONFLICT(release_id, character_id, field_name, rule_code) DO UPDATE SET
    selected_value_json = excluded.selected_value_json,
    rationale = excluded.rationale,
    decided_by = excluded.decided_by,
    updated_at = excluded.updated_at;

INSERT INTO canonical_decisions (
    release_id, character_id, field_name, selected_value_json, rule_code,
    rationale, decided_by, decided_at, created_at, updated_at
)
SELECT
    c.release_id,
    c.id,
    'strict_kangxi_strokes',
    CAST(cp.strict_kangxi_strokes AS TEXT),
    'KANGXI_CN_WEBSITE_STRICT_KANGXI_STROKES',
    'Use the authorized website Kangxi stroke field for chinese_dictionary.kx_bihua; Unihan Kangxi properties are page indexes, not stroke counts.',
    'kangxi-cn-stroke-policy.v1',
    cp.updated_at,
    cp.created_at,
    cp.updated_at
FROM characters c
JOIN canonical_profiles cp ON cp.character_id = c.id
WHERE cp.strict_kangxi_strokes IS NOT NULL
ON CONFLICT(release_id, character_id, field_name, rule_code) DO UPDATE SET
    selected_value_json = excluded.selected_value_json,
    rationale = excluded.rationale,
    decided_by = excluded.decided_by,
    updated_at = excluded.updated_at;
