export class KangxiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly details: Record<string, unknown> = {},
    readonly operational = true,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ConfigurationError extends KangxiError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, "CONFIGURATION_ERROR", details);
  }
}

export class CrawlError extends KangxiError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, "CRAWL_ERROR", details);
  }
}

export class ParseError extends KangxiError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, "PARSE_ERROR", details);
  }
}

export class ValidationFailedError extends KangxiError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, "VALIDATION_FAILED", details);
  }
}

export class ReleaseError extends KangxiError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, "RELEASE_ERROR", details);
  }
}

export class NotFoundError extends KangxiError {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, "NOT_FOUND", { resource, identifier });
  }
}
