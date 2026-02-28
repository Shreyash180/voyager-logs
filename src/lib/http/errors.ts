import { ZodError } from "zod";

export type ErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(params: { status: number; code: string; message: string; details?: unknown }) {
    super(params.message);
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

export function normalizeError(err: unknown): { status: number; payload: ErrorPayload } {
  if (isErrorWithHttpShape(err)) {
    return {
      status: err.status,
      payload: { code: err.code, message: err.message },
    };
  }

  if (err instanceof ApiError) {
    return {
      status: err.status,
      payload: { code: err.code, message: err.message, details: err.details },
    };
  }

  if (err instanceof ZodError) {
    return {
      status: 400,
      payload: {
        code: "VALIDATION_ERROR",
        message: "Invalid request input.",
        details: err.flatten(),
      },
    };
  }

  if (err instanceof Error) {
    return {
      status: 500,
      payload: { code: "INTERNAL_ERROR", message: err.message },
    };
  }

  return { status: 500, payload: { code: "INTERNAL_ERROR", message: "Unknown error" } };
}

function isErrorWithHttpShape(
  err: unknown,
): err is { status: number; code: string; message: string } {
  if (!err || typeof err !== "object") return false;

  const record = err as Record<string, unknown>;
  return (
    typeof record.status === "number" &&
    typeof record.code === "string" &&
    typeof record.message === "string"
  );
}

