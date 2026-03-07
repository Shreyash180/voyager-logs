import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/http/errors";
import { withRoute } from "@/lib/http/route";
import { verifyPassword } from "@/lib/auth/password";
import { setAuthCookies } from "@/lib/auth/cookies";
import { signAccessToken, signRefreshToken } from "@/lib/auth/tokens";
import { LoginSchema } from "@/lib/validation/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    enforceRateLimit(req, {
      name: "auth-login",
      max: 10,
      windowMs: 10 * 60 * 1000,
      key: `ip:${getClientIp(req)}`,
    });

    const json = await req.json().catch(() => {
      throw new ApiError({ status: 400, code: "INVALID_JSON", message: "Invalid JSON body." });
    });

    const input = LoginSchema.parse(json);

    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError({
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }
    if (user.status !== "ACTIVE") {
      throw new ApiError({
        status: 403,
        code: "ACCOUNT_DISABLED",
        message: "This account has been disabled. Contact an administrator.",
      });
    }

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      throw new ApiError({
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id, role: user.role });
    await setAuthCookies({ accessToken, refreshToken });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
      select: { id: true },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  });
}

