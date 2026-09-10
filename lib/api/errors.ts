import { NextResponse } from "next/server";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_REQUIRED"
  | "PAYLOAD_TOO_LARGE"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PAYMENT_REQUIRED: 402,
  PAYLOAD_TOO_LARGE: 413,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly expose: boolean;

  constructor(code: ErrorCode, message: string, options?: { expose?: boolean; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.expose = options?.expose ?? true;
  }
}

export function apiErrorResponse(error: unknown, fallback = "Request failed") {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.expose ? error.message : fallback, code: error.code },
      { status: error.status }
    );
  }

  logServerError(fallback, error);
  return NextResponse.json(
    { error: fallback, code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}

export function publicError(code: ErrorCode, message: string): ApiError {
  return new ApiError(code, message);
}

export function logServerError(context: string, error: unknown, metadata?: Record<string, string | number | boolean | null>) {
  let safeError: Record<string, unknown>;

  if (error instanceof Error) {
    safeError = { name: error.name, message: error.message, stack: error.stack };
  } else if (error && typeof error === 'object') {
    // Handle objects like Supabase errors that aren't Error instances
    safeError = { ...error };
    // Ensure we have at least a string representation
    if (!safeError.message && !safeError.error) {
      safeError.value = String(error);
    }
  } else {
    safeError = { value: String(error) };
  }

  console.error(`[server-error] ${context}`, {
    ...metadata,
    error: safeError,
  });
}
