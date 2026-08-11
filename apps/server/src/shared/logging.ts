import pino from "pino";

export function createLogger(service: string, level: string) {
  return pino({
    level,
    base: { service },
    redact: {
      paths: [
        "req.headers.authorization",
        "headers.authorization",
        "apiKey",
        "dify.apiKey",
      ],
      censor: "[REDACTED]",
    },
  });
}
