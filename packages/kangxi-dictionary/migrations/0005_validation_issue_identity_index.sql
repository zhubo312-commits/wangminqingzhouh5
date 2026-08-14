CREATE INDEX idx_validation_issues_identity ON validation_issues(
    release_id,
    code,
    run_id,
    source_page_id,
    source_asset_id,
    character_id
);
