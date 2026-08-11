import { existsSync } from "node:fs";
import path from "node:path";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { CalendarRepository } from "./calendar/calendar.repository.js";
import { CalendarService } from "./calendar/calendar.service.js";
import type { AppConfig } from "./config/env.js";
import { createEventsRoutes } from "./events/events.routes.js";
import { EventsRepository } from "./events/events.repository.js";
import { createGuidanceService } from "./guidance/factory.js";
import { createHomeRoutes } from "./home/home.routes.js";
import { HomeService } from "./home/home.service.js";
import { PaipanClient } from "./paipan/paipan-client.js";
import { PaipanContextRepository } from "./paipan/paipan-context.repository.js";
import { PaipanContextService } from "./paipan/paipan-context.service.js";
import { createPaipanRoutes } from "./paipan/paipan.routes.js";
import type { DatabaseContext } from "./shared/database/client.js";
import { AppError } from "./shared/errors/app-error.js";
import { dateInTimeZone } from "./shared/time/beijing-date.js";

export interface BuildAppOptions {
  config: AppConfig;
  database: DatabaseContext;
  fetchImpl?: typeof fetch;
  serveStatic?: boolean;
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const { config, database } = options;
  const app = Fastify({
    logger: {
      level: config.logLevel,
      redact: ["req.headers.authorization", "headers.authorization", "req.body"],
    },
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply
        .status(error.statusCode)
        .header("Content-Type", "application/problem+json; charset=utf-8")
        .send(
          JSON.stringify({
            type: `https://guoxue.local/errors/${error.code.toLowerCase()}`,
            title: error.title,
            status: error.statusCode,
            detail: error.message,
            instance: request.url,
            request_id: request.id,
            ...(error.errors ? { errors: error.errors } : {}),
          }),
        );
    }

    if (error instanceof ZodError) {
      return reply
        .status(500)
        .header("Content-Type", "application/problem+json; charset=utf-8")
        .send(
          JSON.stringify({
            type: "https://guoxue.local/errors/contract-violation",
            title: "Internal Server Error",
            status: 500,
            detail: "The server produced an invalid response",
            instance: request.url,
            request_id: request.id,
          }),
        );
    }

    request.log.error({ err: error }, "unhandled request error");
    return reply
      .status(500)
      .header("Content-Type", "application/problem+json; charset=utf-8")
      .send(
        JSON.stringify({
          type: "about:blank",
          title: "Internal Server Error",
          status: 500,
          detail: "An unexpected error occurred",
          instance: request.url,
          request_id: request.id,
        }),
      );
  });

  await app.register(helmet, {
    frameguard: false,
    contentSecurityPolicy: config.isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
          },
        }
      : false,
  });
  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed"), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
  });
  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute",
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
      "retry-after": true,
    },
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("X-Request-Id", request.id);
    return payload;
  });

  const calendarRepository = new CalendarRepository(database);
  const calendarService = new CalendarService(calendarRepository);
  const guidanceService = createGuidanceService(
    config,
    database,
    options.fetchImpl ?? fetch,
  );
  const homeService = new HomeService(config, calendarService, guidanceService);
  const eventsRepository = new EventsRepository(database);
  const paipanClient = new PaipanClient(config.paipan, options.fetchImpl ?? fetch);
  const paipanContextRepository = new PaipanContextRepository(database);
  const paipanContextService = new PaipanContextService(
    paipanContextRepository,
    config.paipan.contextTtlSeconds,
  );

  await app.register(createHomeRoutes(config, homeService));
  await app.register(createEventsRoutes(config, eventsRepository));
  await app.register(createPaipanRoutes(paipanClient, paipanContextService));

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/ready", async (_request, reply) => {
    let databaseStatus: "ok" | "error" = "ok";
    try {
      database.raw.prepare("SELECT 1").get();
    } catch {
      databaseStatus = "error";
    }

    const today = dateInTimeZone(new Date(), config.timezone);
    const calendarStatus = calendarRepository.findByDate(today) ? "ok" : "missing";
    const paipanStatus = (await paipanClient.isReady()) ? "ok" : "error";
    const ready = databaseStatus === "ok" && calendarStatus === "ok" && paipanStatus === "ok";
    return reply.status(ready ? 200 : 503).send({
      status: ready ? "ok" : "degraded",
      checks: {
        database: databaseStatus,
        calendar: calendarStatus,
        paipan: paipanStatus,
        dify: config.dify.apiKey && config.dify.baseUrl ? "configured" : "optional",
      },
    });
  });

  const shouldServeStatic = options.serveStatic ?? config.isProduction;
  if (shouldServeStatic && existsSync(config.webDistPath)) {
    await app.register(fastifyStatic, {
      root: path.resolve(config.webDistPath),
      prefix: "/",
      decorateReply: true,
    });
    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith("/api/") || request.url === "/health" || request.url === "/ready") {
        return reply
          .status(404)
          .header("Content-Type", "application/problem+json; charset=utf-8")
          .send(
            JSON.stringify({
              type: "about:blank",
              title: "Not Found",
              status: 404,
              detail: "The requested endpoint does not exist",
              instance: request.url,
              request_id: request.id,
            }),
          );
      }
      return reply.sendFile("index.html");
    });
  }

  return app;
}
