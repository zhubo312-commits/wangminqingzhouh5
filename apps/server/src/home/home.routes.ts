import type { FastifyPluginAsync } from "fastify";
import type { AppConfig } from "../config/env.js";
import { dateInTimeZone } from "../shared/time/beijing-date.js";
import type { HomeService } from "./home.service.js";

export function createHomeRoutes(
  config: AppConfig,
  service: HomeService,
): FastifyPluginAsync {
  return async (app) => {
    app.get("/api/v1/home", async (_request, reply) => {
      reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      return service.getForDate(dateInTimeZone(new Date(), config.timezone));
    });
  };
}
