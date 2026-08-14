-- Provisional character aliases only. Character rows are generated separately
-- in xingming-dictionary-data.sql; full numerology rows are generated in
-- xingming-numerology-data.sql.
INSERT INTO chinese_dictionary_alias (alias, target_zi, relation_type, source_version) VALUES
('鍾', '鐘', 'legacy-source-normalization', 'provisional-unicode17-cns20260805-golden2'),
('嶽', '岳', 'legacy-source-normalization', 'provisional-unicode17-cns20260805-golden2'),
('衛', '衞', 'legacy-source-normalization', 'provisional-unicode17-cns20260805-golden2'),
('勝', '勝', 'legacy-source-normalization', 'provisional-unicode17-cns20260805-golden2'),
('幹', '干', 'legacy-source-normalization', 'provisional-unicode17-cns20260805-golden2');
