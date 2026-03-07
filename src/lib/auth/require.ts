import type { NextRequest } from "next/server";
import { z } from "zod";

import { ACCESS_COOKIE } from "./cookies";
import { verifyAccessToken, type AuthRole } from "./tokens";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: string;
  role: AuthRole;
};

const ClaimsSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(["ADMIN", "USER"]),
  typ: z.literal("access"),
});

export class AuthError extends Error {
  status = 401 as const;
  code = "UNAUTHORIZED" as const;
}

export class ForbiddenError extends Error {
  status = 403 as const;
  code = "FORBIDDEN" as const;
}

export function getUserFromRequest(req: NextRequest): AuthUser | null {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = verifyAccessToken(token);
    const parsed = ClaimsSchema.safeParse(decoded);
    if (!parsed.success) return null;
    return { id: parsed.data.sub, role: parsed.data.role };
  } catch {
    return null;
  }
}

export function requireUser(req: NextRequest): AuthUser {
  const user = getUserFromRequest(req);
  if (!user) throw new AuthError("Login required.");
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = requireUser(req);
  if (user.role === "ADMIN") return user;

  // Role can change after a token is issued. Re-check against the database.
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (fresh?.role !== "ADMIN") throw new ForbiddenError("Admin access required.");
  return user;
}
