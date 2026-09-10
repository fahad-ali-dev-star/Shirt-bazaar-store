import { ApiError } from "@/lib/api/errors";

export function assertConfigured(value: string | undefined, name: string): asserts value is string {
  if (!value) {
    throw new ApiError("SERVICE_UNAVAILABLE", "This service is temporarily unavailable", { cause: new Error(`${name} is not configured`) });
  }
}

export function assertContentLength(request: Request, maxBytes: number) {
  const raw = request.headers.get("content-length");
  if (!raw) return;
  const length = Number(raw);
  if (Number.isFinite(length) && length > maxBytes) {
    throw new ApiError("PAYLOAD_TOO_LARGE", "Request is too large");
  }
}
