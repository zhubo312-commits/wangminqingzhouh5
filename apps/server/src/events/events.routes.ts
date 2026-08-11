import { TrackEventRequestSchema } from "@guoxue/contracts";
import type { FastifyPluginAsync } from "fastify";
import type { AppConfig } from "../config/env.js";
import { dateInTimeZone } from "../shared/time/beijing-date.js";
import { ValidationAppError } from "../shared/errors/app-error.js";
import type { EventsRepository } from "./events.repository.js";

export function createEventsRoutes(
  config: AppConfig,
  repository: EventsRepository,
): FastifyPluginAsync {
  return async (app) => {
    app.post(
      "/api/v1/events",
      {
        config: {
          rateLimit: { max: 120, timeWindow: "1 minute" },
        },
      },
      async (request, reply) => {
        const parsed = TrackEventRequestSchema.safeParse(request.body);
        if (!parsed.success) {
          throw new ValidationAppError("Invalid analytics event", [
            {
              field: "event",
              message: "Event is not supported",
              code: "INVALID_EVENT",
            },
          ]);
        }

        repository.increment(
          dateInTimeZone(new Date(), config.timezone),
          parsed.data.event,
        );
        return reply.status(204).send();
      },
    );
  };
}
