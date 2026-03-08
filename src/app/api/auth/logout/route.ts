import type { NextRequest } from "next/server";

import { clearAuthCookies } from "@/lib/auth/cookies";
import { withRoute } from "@/lib/http/route";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    enforceRateLimit(req, { name: "auth-logout", max: 30, windowMs: 60 * 1000 });
    await clearAuthCookies();
    return { ok: true };
  });
}

