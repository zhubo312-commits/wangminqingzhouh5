CREATE TABLE reference_datasets (
    id TEXT PRIMARY KEY NOT NULL,
    source_name TEXT NOT NULL,
    source_version TEXT NOT NULL,
    source_url TEXT NOT NULL,
    license_url TEXT NOT NULL,
    artifact_sha256 TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (source_name, source_version, artifact_sha256)
);

CREATE TABLE reference_dataset_files (
    reference_dataset_id TEXT NOT NULL REFERENCES reference_datasets(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    local_path TEXT NOT NULL,
    content_sha256 TEXT NOT NULL,
    byte_length INTEGER NOT NULL CHECK (byte_length > 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (reference_dataset_id, file_name)
);

CREATE TABLE reference_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id TEXT NOT NULL REFERENCES dataset_releases(id) ON DELETE CASCADE,
    reference_dataset_id TEXT NOT NULL REFERENCES reference_datasets(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    property_name TEXT NOT NULL,
    raw_value TEXT NOT NULL,
    normalized_value_json TEXT NOT NULL,
    source_file TEXT NOT NULL,
    source_line INTEGER NOT NULL CHECK (source_line > 0),
    source_reference TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (release_id, reference_dataset_id, character_id, property_name, raw_value)
);

CREATE INDEX idx_reference_observations_character_property
ON reference_observations(character_id, property_name);

CREATE INDEX idx_reference_observations_release_dataset
ON reference_observations(release_id, reference_dataset_id);
