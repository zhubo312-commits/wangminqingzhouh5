CREATE TABLE source_content_absences (
    source_character_id INTEGER NOT NULL REFERENCES source_characters(id) ON DELETE CASCADE,
    content_kind TEXT NOT NULL CHECK (content_kind IN ('kangxi', 'shuowen', 'modern_dictionary')),
    absence_reason TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (source_character_id, content_kind)
);
