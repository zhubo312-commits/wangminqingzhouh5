import type { AppConfig } from "../config/env.js";
import type { DatabaseContext } from "../shared/database/client.js";
import { DifyClient } from "./dify-client.js";
import { GuidanceRepository } from "./guidance.repository.js";
import { GuidanceService } from "./guidance.service.js";

export function createGuidanceService(
  config: AppConfig,
  database: DatabaseContext,
  fetchImpl: typeof fetch = fetch,
): GuidanceService {
  return new GuidanceService(
    new GuidanceRepository(database),
    new DifyClient(config.dify, fetchImpl),
  );
}
