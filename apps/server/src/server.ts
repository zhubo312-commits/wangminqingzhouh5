import { buildApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { createDatabase } from "./shared/database/client.js";

const config = loadConfig();
const database = createDatabase(config.sqlitePath);
const app = await buildApp({ config, database });

async function shutdown(signal: string) {
  app.log.info({ signal }, "server shutting down");
  await app.close();
  database.close();
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM").finally(() => process.exit(0));
});
process.on("SIGINT", () => {
  void shutdown("SIGINT").finally(() => process.exit(0));
});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.fatal({ err: error }, "server failed to start");
  database.close();
  process.exit(1);
}
