import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/http/errors";
import { withRoute } from "@/lib/http/route";
import { hashPassword } from "@/lib/auth/password";
import { RegisterSchema } from "@/lib/validation/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withRoute(
    async () => {
      enforceRateLimit(req, {
        name: "auth-register",
        max: 5,
        windowMs: 10 * 60 * 1000,
        key: `ip:${getClientIp(req)}`,
      });

      const json = await req.json().catch(() => {
        throw new ApiError({ status: 400, code: "INVALID_JSON", message: "Invalid JSON body." });
      });

      const input = RegisterSchema.parse(json);

      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new ApiError({
          status: 409,
          code: "EMAIL_IN_USE",
          message: "That email is already registered.",
        });
      }

      const passwordHash = await hashPassword(input.password);

      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: "USER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return { user };
    },
    { status: 201 },
  );
}

