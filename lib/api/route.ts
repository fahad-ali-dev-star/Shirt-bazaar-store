import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, logServerError } from "@/lib/api/errors";

export async function withApiErrorHandling<T>(
  handler: () => Promise<T>,
  fallback = "Request failed"
): Promise<T | NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (!(error instanceof ApiError)) logServerError(fallback, error);
    return apiErrorResponse(error, fallback);
  }
}
