import { loadConfig } from "../../config/env.js";
import { createDatabase } from "./client.js";

const config = loadConfig();
const database = createDatabase(config.sqlitePath);
database.close();

process.stdout.write(`Migrations applied to ${config.sqlitePath}\n`);
