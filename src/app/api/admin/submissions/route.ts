import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { requireAdmin } from "@/lib/auth/require";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    await requireAdmin(req);

    const submissions = await prisma.post.findMany({
      where: {
        author: { role: "USER" },
        isApproved: false,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        isPublic: true,
        isApproved: true,
        publishedByAdmin: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
    });

    return { submissions };
  });
}
