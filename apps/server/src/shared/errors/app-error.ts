export class AppError extends Error {
  constructor(
    public readonly title: string,
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly errors?: Array<{
      field: string;
      message: string;
      code: string;
    }>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(code: string, message: string) {
    super("Service Unavailable", 503, code, message);
  }
}

export class ValidationAppError extends AppError {
  constructor(
    message: string,
    errors: Array<{ field: string; message: string; code: string }>,
  ) {
    super("Validation Error", 422, "VALIDATION_ERROR", message, errors);
  }
}

export class BadGatewayAppError extends AppError {
  constructor(code: string, message = "排盘服务暂时不可用") {
    super("Bad Gateway", 502, code, message);
  }
}

export class GatewayTimeoutAppError extends AppError {
  constructor(code = "PAIPAN_TIMEOUT", message = "排盘计算超时，请重试") {
    super("Gateway Timeout", 504, code, message);
  }
}

export class NotFoundAppError extends AppError {
  constructor(code: string, message: string) {
    super("Not Found", 404, code, message);
  }
}

export class GoneAppError extends AppError {
  constructor(code: string, message: string) {
    super("Gone", 410, code, message);
  }
}
