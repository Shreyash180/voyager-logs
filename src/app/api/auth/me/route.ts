import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { getUserFromRequest } from "@/lib/auth/require";
import { clearAuthCookies } from "@/lib/auth/cookies";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    const auth = getUserFromRequest(req);
    if (!auth) return { user: null };
    const isHeartbeat = req.nextUrl.searchParams.get("ping") === "1";

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) return { user: null };

    if (user.status !== "ACTIVE") {
      await clearAuthCookies();
      return { user: null };
    }

    if (isHeartbeat) {
      const cutoff = new Date(Date.now() - 4 * 60 * 1000);
      await prisma.user.updateMany({
        where: {
          id: user.id,
          OR: [{ lastSeen: null }, { lastSeen: { lt: cutoff } }],
        },
        data: { lastSeen: new Date() },
      });
    }

    return { user };
  });
}

