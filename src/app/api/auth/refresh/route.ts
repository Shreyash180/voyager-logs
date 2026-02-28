import type { NextRequest } from "next/server";

import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { prisma } from "@/lib/prisma";
import { readRefreshCookie, setAuthCookies } from "@/lib/auth/cookies";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth/tokens";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    enforceRateLimit(req, {
      name: "auth-refresh",
      max: 20,
      windowMs: 10 * 60 * 1000,
      key: `ip:${getClientIp(req)}`,
    });

    const refreshToken = await readRefreshCookie();
    if (!refreshToken) {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Missing refresh token." });
    }

    let claims: { sub: string; role: "ADMIN" | "USER"; typ: "refresh" };
    try {
      claims = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid refresh token." });
    }

    if (claims.typ !== "refresh") {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid refresh token." });
    }

    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "User no longer exists." });
    }

    const nextAccess = signAccessToken({ id: user.id, role: user.role });
    const nextRefresh = signRefreshToken({ id: user.id, role: user.role });
    await setAuthCookies({ accessToken: nextAccess, refreshToken: nextRefresh });

    return { ok: true };
  });
}
