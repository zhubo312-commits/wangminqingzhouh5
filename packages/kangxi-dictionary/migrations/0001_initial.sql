CREATE TABLE dataset_releases (
    id TEXT PRIMARY KEY NOT NULL,
    schema_version TEXT NOT NULL,
    parser_version TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('candidate', 'released', 'rejected')),
    source_base_url TEXT NOT NULL,
    authorization_basis TEXT NOT NULL,
    manifest_sha256 TEXT,
    character_count INTEGER NOT NULL DEFAULT 0 CHECK (character_count >= 0),
    page_count INTEGER NOT NULL DEFAULT 0 CHECK (page_count >= 0),
    asset_count INTEGER NOT NULL DEFAULT 0 CHECK (asset_count >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    released_at TEXT
);

CREATE TABLE crawl_runs (
    id TEXT PRIMARY KEY NOT NULL,
    release_id TEXT NOT NULL REFERENCES dataset_releases(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('discover', 'pilot', 'full', 'incremental')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
    config_json TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX idx_crawl_runs_release_status ON crawl_runs(release_id, status);

CREATE TABLE source_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    resolved_url TEXT,
    page_kind TEXT NOT NULL CHECK (page_kind IN ('root', 'index', 'search', 'character', 'scan', 'unknown')),
    source_key TEXT,
    discovered_from_page_id INTEGER REFERENCES source_pages(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fetching', 'success', 'source_missing', 'failed')),
    http_status INTEGER,
    content_type TEXT,
    etag TEXT,
    last_modified TEXT,
    content_sha256 TEXT,
    local_path TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    error_code TEXT,
    error_message TEXT,
    fetched_at TEXT,
    parsed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (run_id, url)
);
CREATE INDEX idx_source_pages_run_kind_status ON source_pages(run_id, page_kind, status, id);
CREATE INDEX idx_source_pages_resolved_url ON source_pages(resolved_url);
CREATE INDEX idx_source_pages_source_key ON source_pages(source_key);

CREATE TABLE source_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    asset_kind TEXT NOT NULL CHECK (asset_kind IN ('glyph', 'inline_glyph', 'pinyin_audio', 'zhuyin_audio', 'scan_image', 'other_content')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fetching', 'success', 'source_missing', 'failed')),
    http_status INTEGER,
    content_type TEXT,
    byte_length INTEGER CHECK (byte_length IS NULL OR byte_length >= 0),
    etag TEXT,
    last_modified TEXT,
    content_sha256 TEXT,
    local_path TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    error_code TEXT,
    error_message TEXT,
    fetched_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (run_id, url)
);
CREATE INDEX idx_source_assets_run_status ON source_assets(run_id, status, id);
CREATE INDEX idx_source_assets_sha256 ON source_assets(content_sha256);

CREATE TABLE source_page_assets (
    page_id INTEGER NOT NULL REFERENCES source_pages(id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES source_assets(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (page_id, asset_id, role)
);
CREATE INDEX idx_source_page_assets_asset ON source_page_assets(asset_id);

CREATE TABLE source_index_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL REFERENCES source_pages(id) ON DELETE CASCADE,
    group_kind TEXT NOT NULL,
    group_key TEXT NOT NULL,
    declared_count INTEGER CHECK (declared_count IS NULL OR declared_count >= 0),
    discovered_count INTEGER NOT NULL CHECK (discovered_count >= 0),
    seo_declared_count INTEGER CHECK (seo_declared_count IS NULL OR seo_declared_count >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (page_id, group_kind, group_key)
);

CREATE TABLE source_index_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
    page_id INTEGER NOT NULL REFERENCES source_pages(id) ON DELETE CASCADE,
    character_url TEXT NOT NULL,
    source_character_id TEXT,
    glyph TEXT,
    pinyin TEXT,
    stroke_count INTEGER CHECK (stroke_count IS NULL OR stroke_count > 0),
    element TEXT CHECK (element IS NULL OR element IN ('金', '木', '水', '火', '土')),
    auspiciousness TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (page_id, character_url)
);
CREATE INDEX idx_source_index_entries_run_character ON source_index_entries(run_id, source_character_id);
CREATE INDEX idx_source_index_entries_stroke_element ON source_index_entries(stroke_count, element);

CREATE TABLE source_characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
    source_page_id INTEGER NOT NULL REFERENCES source_pages(id) ON DELETE CASCADE,
    source_character_id TEXT NOT NULL,
    source_url TEXT NOT NULL,
    glyph TEXT NOT NULL,
    codepoint INTEGER NOT NULL CHECK (codepoint BETWEEN 0 AND 1114111),
    unicode_label TEXT,
    unicode_block TEXT,
    structure TEXT,
    radical TEXT,
    radical_name TEXT,
    modern_strokes INTEGER CHECK (modern_strokes IS NULL OR modern_strokes > 0),
    website_naming_strokes INTEGER CHECK (website_naming_strokes IS NULL OR website_naming_strokes > 0),
    strict_kangxi_strokes_json TEXT,
    radical_strokes INTEGER CHECK (radical_strokes IS NULL OR radical_strokes > 0),
    outside_strokes INTEGER CHECK (outside_strokes IS NULL OR outside_strokes >= 0),
    wubi TEXT,
    cangjie TEXT,
    four_corner TEXT,
    pinyin_json TEXT NOT NULL DEFAULT '[]',
    zhuyin_json TEXT NOT NULL DEFAULT '[]',
    raw_fields_json TEXT NOT NULL,
    raw_json TEXT NOT NULL,
    content_sha256 TEXT NOT NULL,
    absence_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (run_id, source_character_id),
    UNIQUE (run_id, source_url)
);
CREATE INDEX idx_source_characters_run_glyph ON source_characters(run_id, glyph);
CREATE INDEX idx_source_characters_codepoint ON source_characters(codepoint);

CREATE TABLE characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id TEXT NOT NULL REFERENCES dataset_releases(id) ON DELETE CASCADE,
    glyph TEXT NOT NULL,
    codepoint INTEGER NOT NULL CHECK (codepoint BETWEEN 0 AND 1114111),
    source_character_id INTEGER REFERENCES source_characters(id) ON DELETE SET NULL,
    canonical_status TEXT NOT NULL DEFAULT 'candidate' CHECK (canonical_status IN ('candidate', 'accepted', 'quarantined')),
    absence_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (release_id, glyph),
    UNIQUE (release_id, codepoint)
);
CREATE INDEX idx_characters_release_status ON characters(release_id, canonical_status);

CREATE TABLE character_forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id TEXT NOT NULL REFERENCES dataset_releases(id) ON DELETE CASCADE,
    from_character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    to_character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('simplified', 'traditional', 'variant', 'ancient', 'compatibility')),
    source_name TEXT NOT NULL,
    source_reference TEXT,
    is_preferred INTEGER NOT NULL DEFAULT 0 CHECK (is_preferred IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (release_id, from_character_id, to_character_id, relation_type, source_name)
);
CREATE INDEX idx_character_forms_from ON character_forms(from_character_id, relation_type, is_preferred);
CREATE INDEX idx_character_forms_to ON character_forms(to_character_id, relation_type, is_preferred);

CREATE TABLE pronunciations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    pinyin TEXT,
    plain_pinyin TEXT,
    zhuyin TEXT,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
    pinyin_audio_asset_id INTEGER REFERENCES source_assets(id) ON DELETE SET NULL,
    zhuyin_audio_asset_id INTEGER REFERENCES source_assets(id) ON DELETE SET NULL,
    source_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (character_id, ordinal, source_name)
);
CREATE INDEX idx_pronunciations_pinyin ON pronunciations(pinyin);
CREATE INDEX idx_pronunciations_plain_pinyin ON pronunciations(plain_pinyin);

CREATE TABLE stroke_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    stroke_kind TEXT NOT NULL CHECK (stroke_kind IN ('modern', 'website_naming', 'strict_kangxi', 'radical', 'outside')),
    glyph_context TEXT NOT NULL,
    stroke_count INTEGER NOT NULL CHECK (stroke_count > 0),
    source_name TEXT NOT NULL,
    source_reference TEXT,
    is_selected INTEGER NOT NULL DEFAULT 0 CHECK (is_selected IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (character_id, stroke_kind, glyph_context, stroke_count, source_name)
);
CREATE INDEX idx_stroke_observations_character_kind ON stroke_observations(character_id, stroke_kind, is_selected);
CREATE INDEX idx_stroke_observations_kind_count ON stroke_observations(stroke_kind, stroke_count);

CREATE TABLE canonical_profiles (
    character_id INTEGER PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    primary_pinyin TEXT,
    plain_pinyin TEXT,
    radical TEXT,
    modern_strokes INTEGER CHECK (modern_strokes IS NULL OR modern_strokes > 0),
    naming_strokes INTEGER CHECK (naming_strokes IS NULL OR naming_strokes > 0),
    strict_kangxi_strokes INTEGER CHECK (strict_kangxi_strokes IS NULL OR strict_kangxi_strokes > 0),
    wubi TEXT,
    element TEXT CHECK (element IS NULL OR element IN ('金', '木', '水', '火', '土')),
    auspiciousness TEXT,
    common_flag INTEGER CHECK (common_flag IS NULL OR common_flag IN (0, 1)),
    confidence_status TEXT NOT NULL DEFAULT 'unverified' CHECK (confidence_status IN ('unverified', 'verified', 'conflicted')),
    source_summary_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX idx_canonical_profiles_pinyin ON canonical_profiles(plain_pinyin);
CREATE INDEX idx_canonical_profiles_strokes ON canonical_profiles(naming_strokes);
CREATE INDEX idx_canonical_profiles_radical ON canonical_profiles(radical);
CREATE INDEX idx_canonical_profiles_element ON canonical_profiles(element);

CREATE TABLE naming_profiles (
    source_character_id INTEGER PRIMARY KEY REFERENCES source_characters(id) ON DELETE CASCADE,
    recommendation_percent INTEGER CHECK (recommendation_percent IS NULL OR recommendation_percent BETWEEN 0 AND 100),
    culture_percent INTEGER CHECK (culture_percent IS NULL OR culture_percent BETWEEN 0 AND 100),
    gender_tendency INTEGER CHECK (gender_tendency IS NULL OR gender_tendency BETWEEN 0 AND 9),
    element TEXT CHECK (element IS NULL OR element IN ('金', '木', '水', '火', '土')),
    auspiciousness TEXT,
    common_flag INTEGER CHECK (common_flag IS NULL OR common_flag IN (0, 1)),
    name_usage_class TEXT,
    name_explanation TEXT,
    naming_meaning TEXT,
    naming_implication TEXT,
    usage_count INTEGER CHECK (usage_count IS NULL OR usage_count >= 0),
    first_character_percent INTEGER CHECK (first_character_percent IS NULL OR first_character_percent BETWEEN 0 AND 100),
    male_percent INTEGER CHECK (male_percent IS NULL OR male_percent BETWEEN 0 AND 100),
    female_percent INTEGER CHECK (female_percent IS NULL OR female_percent BETWEEN 0 AND 100),
    taboos_text TEXT,
    raw_json TEXT NOT NULL,
    absence_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX idx_naming_profiles_element ON naming_profiles(element);

CREATE TABLE dictionary_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_character_id INTEGER NOT NULL REFERENCES source_characters(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL CHECK (section_type IN ('kangxi', 'shuowen_classic', 'shuowen_plain', 'shuowen_annotation', 'modern_dictionary', 'other')),
    title TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    source_html TEXT NOT NULL,
    sanitized_html TEXT NOT NULL,
    plain_text TEXT NOT NULL,
    content_sha256 TEXT NOT NULL,
    absence_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (source_character_id, section_type, ordinal)
);
CREATE INDEX idx_dictionary_sections_character_type ON dictionary_sections(source_character_id, section_type, ordinal);

CREATE TABLE character_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_character_id INTEGER NOT NULL REFERENCES source_characters(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('same_element', 'same_stroke', 'recommendation')),
    target_source_character_id TEXT,
    target_glyph TEXT,
    target_url TEXT NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (source_character_id, relation_type, target_url)
);
CREATE INDEX idx_character_relations_target ON character_relations(target_source_character_id);

CREATE TABLE book_editions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id TEXT NOT NULL REFERENCES dataset_releases(id) ON DELETE CASCADE,
    edition_key TEXT NOT NULL,
    title TEXT NOT NULL,
    source_base_url TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (release_id, edition_key)
);

CREATE TABLE book_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    edition_id INTEGER NOT NULL REFERENCES book_editions(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL CHECK (page_number > 0),
    source_page_id INTEGER REFERENCES source_pages(id) ON DELETE SET NULL,
    image_asset_id INTEGER REFERENCES source_assets(id) ON DELETE SET NULL,
    source_url TEXT NOT NULL,
    previous_url TEXT,
    next_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (edition_id, page_number)
);
CREATE INDEX idx_book_pages_source_url ON book_pages(source_url);

CREATE TABLE scan_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_character_id INTEGER NOT NULL REFERENCES source_characters(id) ON DELETE CASCADE,
    book_page_id INTEGER REFERENCES book_pages(id) ON DELETE SET NULL,
    edition_key TEXT NOT NULL,
    page_number INTEGER NOT NULL CHECK (page_number > 0),
    source_url TEXT NOT NULL,
    label TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (source_character_id, source_url)
);
CREATE INDEX idx_scan_references_edition_page ON scan_references(edition_key, page_number);

CREATE TABLE canonical_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id TEXT NOT NULL REFERENCES dataset_releases(id) ON DELETE CASCADE,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    selected_value_json TEXT NOT NULL,
    rule_code TEXT NOT NULL,
    rationale TEXT NOT NULL,
    decided_by TEXT NOT NULL,
    decided_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (release_id, character_id, field_name, rule_code)
);

CREATE TABLE validation_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id TEXT NOT NULL REFERENCES dataset_releases(id) ON DELETE CASCADE,
    run_id TEXT REFERENCES crawl_runs(id) ON DELETE CASCADE,
    source_page_id INTEGER REFERENCES source_pages(id) ON DELETE CASCADE,
    source_asset_id INTEGER REFERENCES source_assets(id) ON DELETE CASCADE,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    decision_id INTEGER REFERENCES canonical_decisions(id) ON DELETE SET NULL,
    severity TEXT NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
    code TEXT NOT NULL,
    field_name TEXT,
    observed_json TEXT,
    expected_json TEXT,
    message TEXT NOT NULL,
    resolution_status TEXT NOT NULL DEFAULT 'open' CHECK (resolution_status IN ('open', 'resolved', 'accepted_source_absence')),
    resolution_note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX idx_validation_issues_release_status ON validation_issues(release_id, severity, resolution_status);
CREATE INDEX idx_validation_issues_character ON validation_issues(character_id, code);

CREATE VIRTUAL TABLE characters_fts USING fts5(
    character_id UNINDEXED,
    glyph,
    pinyin,
    summary,
    content,
    tokenize = 'unicode61'
);
