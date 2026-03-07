import { NextResponse } from "next/server";

import { normalizeError } from "./errors";

export async function withRoute<T>(
  handler: () => Promise<T>,
  opts?: { status?: number },
): Promise<NextResponse<T> | NextResponse<{ error: unknown }>> {
  try {
    const data = await handler();
    logStructured("info", "route_success", { status: opts?.status ?? 200 });
    return NextResponse.json(data, { status: opts?.status ?? 200 });
  } catch (err) {
    const { status, payload } = normalizeError(err);
    logStructured("error", "route_error", { status, code: payload.code, message: payload.message });
    return NextResponse.json({ error: payload }, { status });
  }
}

function logStructured(
  level: "info" | "error",
  event: string,
  extra: Record<string, unknown>,
) {
  const line = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...extra,
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

