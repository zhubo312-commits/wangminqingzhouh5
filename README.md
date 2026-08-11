# 国学老师首页

面向 App WebView 的移动端 H5，包含今日指引、站内专业排盘、国心解读、学习资料和问问题入口。不承担登录、聊天、报告或支付能力。

## 技术结构

- `apps/web`：Vite、React、TypeScript、Tailwind CSS。
- `apps/server`：Fastify、SQLite、Drizzle schema、日历导入和每日 Worker。
- `packages/contracts`：前后端共享的 Zod 数据契约。
- `services/paipan`：Java 17、Spring Boot 3.5.16 的无状态生平子时算法服务。
- `openapi.yaml`：公开 REST 接口说明。
- `docs/专业排盘统一设计规范.md`：全部11种排盘共同遵循的视觉、交互与移动端验收规范。

浏览器只请求 Fastify；Fastify 校验并转发到内网 Java 服务，因此出生信息不会进入 URL。API 进程不直接调用 Dify。每日内容由独立 Worker 在北京时间23:50、23:55和次日00:05生成；最终失败后持久化稳定备用内容。

每次生平子时排盘还会生成一个短期 `paipan_ref`。浏览器仅将该引用保存在当前标签页的 `sessionStorage`，刷新结果页时通过 POST 恢复盘面；完整盘面保存在 SQLite 并按 `PAIPAN_CONTEXT_TTL_SECONDS` 自动过期。未来接入智能老师时，Dify 输入或 MCP 工具只需接收 `paipan_ref`，再调用 `POST /api/v1/paipan/bazi/context` 获取版本化的完整上下文，禁止把姓名、出生时间、地区或整张盘直接拼进 URL。

未来 MCP 工具约定保持单参数，工具名建议为 `get_paipan_context`：

```json
{
  "paipan_ref": "pp_..."
}
```

工具输出直接复用 REST 的 `guoxue.paipan.bazi.v1` 响应结构，不再让 Dify 维护第二套字段映射。正式接入前还需为服务端调用增加独立鉴权；当前老师链接不会自动携带该参数。

## 本地运行

要求 Node.js 22+、npm 10+、Java 17、Maven 和 SQLite CLI。先启动排盘算法服务：

```bash
cd services/paipan
mvn spring-boot:run
```

另开终端启动 H5、Fastify 和 Worker：

```bash
npm install
cp .env.example .env
npm run calendar:import -- --start 2026 --end 2026
npm run dev
```

打开 `http://localhost:5173`。API 默认运行在 `http://localhost:3001`，排盘算法服务默认运行在 `http://127.0.0.1:8080`。

国心解读、学习资料和问问题默认使用现有国心解读入口，也可分别修改
`INTERPRETATION_URL`、`LEARNING_URL` 与 `QUESTION_URL`。

## 日历导入

完整导入香港天文台1901–2100年数据：

```bash
npm run calendar:import -- --start 1901 --end 2100
```

导入器按年份小批量落库，网络中断后可直接重跑；已有年份会幂等更新。网络较弱时可进一步降低并发：

```bash
npm run calendar:import -- --start 1901 --end 2100 --concurrency 1 --batch-size 5
```

如部署环境禁止 Node 直接联网，可以先将官方 `T{年份}c.txt` 文件下载到一个目录，再离线导入：

```bash
npm run calendar:import -- --start 2026 --end 2026 --source-dir /path/to/hko-files
```

导入过程会校验每年365/366天完整性，并使用日期主键幂等更新。H5与API运行期间不会访问香港天文台。

## Dify 工作流

设置 `DIFY_BASE_URL` 和 `DIFY_API_KEY` 后，Worker调用：

```http
POST {DIFY_BASE_URL}/workflows/run
Authorization: Bearer {DIFY_API_KEY}
```

工作流约定：

- 输入变量：`date`，格式 `YYYY-MM-DD`。
- 输出变量：`guidance` 字符串、`suitable` 字符串数组、`avoid` 字符串数组。
- `suitable` 和 `avoid` 各包含1–3项，每项不超过12个字。

手工补跑：

```bash
npm run guidance:generate -- --date 2026-08-11 --allow-fallback
```

## 构建与验证

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
cd services/paipan && mvn verify
```

导航页 360、390、430px 验收图可用 `npm run preview:paipan` 重新生成到 `docs/`。

服务运行后可执行：

```bash
./scripts/smoke-test.sh
```

## Docker

先创建并填写 `.env`，然后执行：

```bash
docker compose build
docker compose --profile tools run --rm calendar-import
docker compose up -d api worker
```

`paipan` 仅通过 Compose 内网暴露给 API，不映射主机端口。SQLite 保存在 `guoxue-data` 持久化卷中。`/ready` 在数据库、当天日历或排盘算法未就绪时返回503；Dify未配置只标记为可选降级，不影响首页使用备用指引。

生产环境通过 `PUBLIC_BASE_PATH` 设置统一公网前缀，例如部署到
`https://whhongyi.top/wm/` 时使用 `PUBLIC_BASE_PATH=/wm/`。Compose 将 API
端口固定绑定到 `127.0.0.1:${APP_PORT:-3001}`，公网必须经 Nginx 转发。
`RELEASE_TAG` 应使用实际 Git 提交 SHA，并同时作为两个镜像的版本标签与
OCI revision 标签。

## Linux 非 Docker 运行

服务器需安装 Node.js 22+、npm 10+、Java 17、Maven、SQLite CLI，以及编译 `better-sqlite3` 所需的 `python3`、`make` 和 `g++`。部署目录中执行：

```bash
npm ci
cp .env.example .env
# 编辑 .env：将 NODE_ENV 改为 production，并填写业务地址及 PAIPAN_SERVICE_URL
npm run build
npm run db:migrate
npm run calendar:import -- --start 1901 --end 2100
npm prune --omit=dev
cd services/paipan && mvn verify
```

Java 排盘服务、API 与每日内容 Worker 必须作为三个独立进程运行：

```bash
java -jar services/paipan/target/paipan-service-1.0.0.jar
node apps/server/dist/server.js
node apps/server/dist/guidance/worker.js
```

生产环境建议分别交给 systemd、Supervisor 或同类进程管理器托管，并配置异常重启。两者读取同一 `.env` 和 `SQLITE_PATH`；只允许单实例 Worker，避免重复调度。反向代理应将 H5 与 `/api` 一并转发到 API 端口。

## SQLite 备份与回滚

在线备份：

```bash
./scripts/backup-sqlite.sh
```

脚本使用 SQLite `.backup` 并执行 `PRAGMA integrity_check`。回滚时先停止 API 与 Worker，保留当前数据库及 WAL/SHM 文件，再用已校验的备份替换数据库并重新启动；代码回滚不删除数据库迁移记录。

## 上线前检查

1. 配齐并验证三个外部业务地址均为 HTTPS，排盘服务只允许内网访问。
2. 完整导入日历，并确认 Java `/actuator/health` 与 Fastify `/ready` 返回200。
3. 运行 Node typecheck/test/build、Java `mvn verify` 和三种宽度移动端 E2E。
4. 执行 SQLite 在线备份并记录恢复位置。
5. 上线后检查 `/health`、`/ready`、`/api/v1/home`、排盘接口和三个外链。
