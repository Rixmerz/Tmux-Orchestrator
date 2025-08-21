import { Context } from "@oak/oak";
import { logger } from "../../logging/logger.ts";

export interface ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
}

export class ValidationError extends Error implements ApiError {
  status = 400;
  code = "VALIDATION_ERROR";
  details: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export class NotFoundError extends Error implements ApiError {
  status = 404;
  code = "NOT_FOUND";

  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error implements ApiError {
  status = 409;
  code = "CONFLICT";

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class DatabaseError extends Error implements ApiError {
  status = 500;
  code = "DATABASE_ERROR";

  constructor(message: string = "Database operation failed") {
    super(message);
    this.name = "DatabaseError";
  }
}

export function createErrorResponse(error: ApiError | Error) {
  const apiError = error as ApiError;
  
  const response = {
    success: false,
    error: {
      code: apiError.code || "INTERNAL_ERROR",
      message: error.message,
      status: apiError.status || 500,
      timestamp: new Date().toISOString(),
      ...(apiError.details && { details: apiError.details }),
    },
  };

  // Log error for monitoring
  logger.error(`API Error: ${error.message}`, {
    code: apiError.code,
    status: apiError.status,
    stack: error.stack,
    details: apiError.details,
  });

  return response;
}

export async function globalErrorHandler(
  ctx: Context,
  next: () => Promise<unknown>,
) {
  try {
    await next();
  } catch (err) {
    const error = err as ApiError;
    const errorResponse = createErrorResponse(error);
    
    ctx.response.status = error.status || 500;
    ctx.response.body = errorResponse;

    // Track integration issues
    if (ctx.request.headers.get("origin")) {
      logger.info("Frontend integration error", {
        origin: ctx.request.headers.get("origin"),
        endpoint: ctx.request.url.pathname,
        method: ctx.request.method,
        error: error.message,
      });
    }
  }
}