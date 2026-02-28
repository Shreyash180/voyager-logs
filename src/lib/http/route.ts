import { NextResponse } from "next/server";

import { normalizeError } from "./errors";

export async function withRoute<T>(
  handler: () => Promise<T>,
  opts?: { status?: number },
): Promise<NextResponse<T> | NextResponse<{ error: unknown }>> {
  try {
    const data = await handler();
    return NextResponse.json(data, { status: opts?.status ?? 200 });
  } catch (err) {
    const { status, payload } = normalizeError(err);
    return NextResponse.json({ error: payload }, { status });
  }
}

