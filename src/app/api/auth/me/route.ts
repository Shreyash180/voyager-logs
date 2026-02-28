import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { getUserFromRequest } from "@/lib/auth/require";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    const auth = getUserFromRequest(req);
    if (!auth) return { user: null };

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return { user };
  });
}

