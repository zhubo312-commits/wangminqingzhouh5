# 姓名学正式数据

姓名学运行资源由已发布的康熙母库 `kangxi-cn-20260813.r3` 和项目内部数理备份生成，API 数据状态为 `official`。

## 运行口径

- 用户输入按单字使用固定版本 `opencc-js@1.4.1` 的 `s2t` 规则规范为繁体；只有母库已验收目标或授权网站明确关系才合并。
- `bihua` 与 `kx_bihua` 都使用规范字在授权 `kangxizidian.cn` 详情页的严格康熙笔画；现代笔画不参与计算。
- `wx`、`jx`、取名解释及来源站统计来自授权网站结构化字段。统计只展示，不参与评分。
- 简繁及输入别名写入 `chinese_dictionary_alias`；详细取名资料写入 `chinese_dictionary_profile`。
- 31 个 OpenCC 候选目标未进入验收集且未获网站关系确认，继续按原字处理并写入投影清单，避免把“后”等多义字错误合并。
- 关键回归：`明→明（8）`、`欧→歐（15）`、`阳→陽（17）`。

正式投影包含 17,197 个规范行和 19,667 条输入别名，校验和及字段映射见
`services/paipan/src/main/resources/projection-manifest.json`。完整母库、原始网页和媒体保存在 Git 忽略的 `data/kangxi/`，仓库只提交运行投影。

## 数理与三才

`yp_81` 和 `yp_sancai` 不属于康熙字典，分别由开发人员提供的授权项目备份独立清洗：

- `yp_81`：1–81 共 81 条，排除 `num=999` 的测试脏数据。
- `yp_sancai`：金木水火土 `5×5×5` 共 125 条。
- 超过 81 的格数保留原值，数理解读按 `((n-1) % 81) + 1` 循环取值。

## 重新生成

母库发布并通过 `validate` 后执行：

```bash
npm run cli --workspace @guoxue/kangxi-dictionary -- \
  project-chinese --release kangxi-cn-20260813.r3 \
  --output services/paipan/src/main/resources
```

数理资源使用：

```bash
node tools/xingming-data/generate_numerology_seed.mjs \
  --yp81 /path/to/yp_81.sql \
  --sancai /path/to/yp_sancai.sql \
  --output services/paipan/src/main/resources/xingming-numerology-data.sql
```

生成后必须运行 Node 全套检查、Java `mvn verify` 和姓名学 Playwright。具体笔画规则见
[康熙笔画采用规则](../kangxi-data/stroke-policy.md)。
