# 康熙字典母库字段与来源说明

## 分层模型

| 层级 | 主要表 | 作用 |
| --- | --- | --- |
| 来源与版本 | `dataset_releases`, `crawl_runs`, `source_pages`, `source_assets` | 版本、采集状态、HTTP 元数据、原始文件路径和哈希 |
| 原始解析 | `source_characters`, `source_index_groups`, `source_index_entries` | 保存网站 ID、URL、原始字段、完整解析 JSON 和页面证据 |
| 规范字库 | `characters`, `character_forms`, `pronunciations`, `stroke_observations`, `canonical_profiles` | 单字身份、简繁异体、多音和分口径笔画候选 |
| 内容资料 | `naming_profiles`, `dictionary_sections`, `source_content_absences`, `character_relations`, `book_editions`, `book_pages`, `scan_references` | 姓名学资料、康熙/说文/现代字典正文（缺失类型也有明确原因）、关系和扫描版索引 |
| 审计纠错 | `canonical_decisions`, `validation_issues` | 规范选择依据、冲突证据、人工处理状态 |
| 外部参考 | `reference_datasets`, `reference_dataset_files`, `reference_observations` | Unihan 等外部规范包、文件哈希和逐字段原始观察 |

正文另写入 `characters_fts`，使用 SQLite FTS5 检索。所有规范字段都能追溯到 `source_characters` 和原始页面哈希。

## 笔画口径

| 字段/记录 | 含义 |
| --- | --- |
| `source_characters.modern_strokes` | 网站“总笔画” |
| `source_characters.website_naming_strokes` | 网站详情页声明的姓名学运行口径候选 |
| `stroke_observations.stroke_kind='strict_kangxi'` | 康熙笔画逐字形原始观察；同页可含多个字形 |
| `canonical_profiles.naming_strokes` | 审计后供姓名学运行的笔画 |
| `canonical_profiles.strict_kangxi_strokes` | 审计后的严格康熙笔画 |

来源未声明时值为 `NULL`，对应的 `*_absence_reason` 写明缺失原因；不得以现代笔画或另一个字形的笔画自动补齐。

正式采用优先级和自动验收规则见 [stroke-policy.md](./stroke-policy.md)。核心原则是网站姓名学笔画进入 `bihua`、网站康熙笔画进入 `kx_bihua`；Unihan 现代笔画仅供参考。

## 投影规则

`project-chinese` 从已发布母库生成 `xingming-dictionary-data.sql` 和 `projection-manifest.json`：

- `zi/jtz`：首选繁体与简体。
- `py/pinyin`：无声调和带声调拼音。
- `wubi/bushou`：规范五笔与部首。
- `bihua/kx_bihua`：规范繁体的严格康熙笔画；现代笔画不参与计算。
- `wx/jx`：审计后的五行与吉凶。
- `jijie/xiangjie`：姓名学简解和带标题的清理后字典正文。
- 多异体和多繁体关系写入 `chinese_dictionary_alias`，Java 查询不再依赖少量硬编码转换。
- 姓名学详解、起名寓意、经过冲突过滤的忌讳和来源站统计写入 `chinese_dictionary_profile`。

投影不会改变公开姓名学 API；康熙字典发布也不会替代仍不完整的 `yp_81`、`yp_sancai`。
