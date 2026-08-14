# 康熙字典独立母库

本包把已授权的 `kangxizidian.cn` 内容保存为“原始证据 → 解析记录 → 规范候选 → 只读发布快照”四层数据。它不提供公开 API，也不会直接覆盖排盘服务中的 `chinese_dictionary`。

## 数据边界

- `data/kangxi/work/`：可断点恢复的工作库、不可变原始网页、媒体缓存和验证报告。
- `data/kangxi/releases/<版本>/`：只读 `kangxi.sqlite`、引用到的原始网页/媒体、清单和 `SHA256SUMS`。
- `data/kangxi/derived/<版本>/`：验收后生成的 H2/MySQL 兼容投影；仍需单独审查后才能接入排盘。
- 仓库只提交代码、迁移、说明和小型测试样本；上述数据目录已加入 Git 忽略。

`yp_81` 与 `yp_sancai` 不属于本包，也不会因为康熙母库发布而变为正式数据。

## 命令

在仓库根目录执行：

```bash
npm run cli --workspace @guoxue/kangxi-dictionary -- discover --release kangxi-cn-20260813.r1
npm run cli --workspace @guoxue/kangxi-dictionary -- crawl --pilot --resume --release kangxi-cn-20260813.r1
npm run cli --workspace @guoxue/kangxi-dictionary -- crawl --resume --release kangxi-cn-20260813.r1
npm run cli --workspace @guoxue/kangxi-dictionary -- status --release kangxi-cn-20260813.r1
npm run cli --workspace @guoxue/kangxi-dictionary -- validate --release kangxi-cn-20260813.r1
npm run cli --workspace @guoxue/kangxi-dictionary -- query 辰 --release kangxi-cn-20260813.r1
npm run cli --workspace @guoxue/kangxi-dictionary -- query 星辰 --search --limit 20 --release kangxi-cn-20260813.r1
npm run cli --workspace @guoxue/kangxi-dictionary -- diff data/kangxi/releases/旧版本/kangxi.sqlite data/kangxi/releases/新版本/kangxi.sqlite
npm run cli --workspace @guoxue/kangxi-dictionary -- import-unihan --release kangxi-cn-20260813.r3 --source /path/to/Unihan.zip --version 17.0.0 --promote-safe
npm run cli --workspace @guoxue/kangxi-dictionary -- resolve 12 --note "已核对原页未提供该字段" --accept-source-absence
npm run cli --workspace @guoxue/kangxi-dictionary -- release --release kangxi-cn-20260813.r1
npm run cli --workspace @guoxue/kangxi-dictionary -- project-chinese --release kangxi-cn-20260813.r1
```

`crawl --resume` 使用相同版本和运行 ID 继续；成功项不会重复写入，失败的 HTTP 项遵守最大尝试次数，解析器升级后可从本地 HTML 重新解析。发布前必须先人工处理验证报告中的全部 error/warning；只允许确实不存在于来源中的项目使用 `--accept-source-absence`。

经过人工判断需要重新投递死信时，给 `crawl` 增加 `--retry-failed`；它只重置 `failed` 项的尝试次数，不会重新投递已人工确认的 `source_missing`。

`discover` 与非试采 `crawl` 默认共用 `<版本>-full` 运行 ID，因此按照上面的顺序执行不会重复抓取已经成功的索引页。若显式传入 `--run`，两个命令也必须使用同一个值。

`import-unihan` 接受 Unicode 官方 `Unihan.zip` 或解压后的 `Unihan_*.txt` 目录。原始数据包会按 SHA-256 归档，原始属性写入 `reference_observations`；重复导入同一版本不会增加重复行。`--promote-safe` 只在现有字段缺失时采用 `kMandarin` 补主拼音、采用单一明确的 `kTotalStrokes` 补现代总笔画。`kKangXi`/`kIRGKangXi` 只作为康熙字典页码定位证据，绝不写入严格康熙笔画；Unihan 也不会补姓名学笔画或姓名学五行。

姓名学笔画采用规则固定为：网站姓名学笔画投影到 `bihua`，网站康熙笔画投影到 `kx_bihua`。每个非空值必须有对应的 `canonical_decisions`；同字形两项网站笔画不一致会阻塞发布。现代笔画差异仅为参考信息。`validate` 会在报告中输出 `strokePolicy` 汇总，以及基础字和常用字缺失 CSV。

长任务可在另一个终端执行 `status` 查看成功、失败、来源缺失和待处理数量；如不需要逐页日志，可设置 `KANGXI_LOG_LEVEL=warn`。

扫描页引用的站外 CDN 必须逐主机显式授权，例如
`KANGXI_ASSET_HOSTS=ygsf.cdn.bcebos.com`。该白名单只用于媒体，不会放宽网页发现边界。

macOS 长时间全量采集使用仓库内的 `launchd/cn.whhongyi.kangxi-crawler.plist` 托管。
任务异常退出时由 `launchd` 在 30 秒后重启；正常完成退出后不会再次启动。日志写入
`data/kangxi/work/logs/`，成功记录仍依赖 SQLite 断点，不会因重启而重复采集。

默认配置保持 HTML 并发 3、媒体并发 6、请求启动间隔 500ms。只有来源授权明确允许高吞吐时，才通过环境变量临时提高；例如 HTML 上限 200、媒体上限 300，并以 20ms 启动间隔控制在约 50 请求/秒。并发是最大在途任务数，`KANGXI_MIN_DELAY_MS` 才决定请求启动速率，两者不要混为一谈。高吞吐运行必须观察 429、5xx 和超时，出现异常时停止进程后仍可用同一命令断点恢复。

## 采集策略

- HTML 并发 3、同域请求启动间隔至少 500ms；媒体并发 6。
- 429、5xx、超时最多重试 3 次并指数退避。
- ETag/Last-Modified 用于条件请求，内容以 SHA-256 地址化去重。
- 只归档内容页、字形、音频和扫描页；CSS、广告和统计脚本不归档。
- `阳`、`陽`等字符分别存储，简繁/异体关系另表关联。
- 网页字段与正文矛盾时两份证据均保留，并产生 `validation_issues`，不会静默改写。

## 发布纪律

`release` 会重新执行完整校验，通过后先在临时目录构建，再原子改名为正式快照；任何失败都不会覆盖上一版。发布快照中的数据库和清单设为只读。`project-chinese` 仅接受已发布快照，并在任何必需规范字段缺失时拒绝生成。
