import type { NextRequest } from "next/server";
import { z } from "zod";

import { withRoute } from "@/lib/http/route";
import { parsePagination } from "@/lib/pagination";
import { requireAdmin } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const QuerySchema = z.object({
  q: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    await requireAdmin(req);

    const { page, limit, skip, take } = parsePagination(req.nextUrl.searchParams);
    const { q } = QuerySchema.parse({
      q: req.nextUrl.searchParams.get("q") ?? undefined,
    });

    const where = q
      ? {
          OR: [
            { content: { contains: q, mode: "insensitive" as const } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
            { post: { title: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [total, comments] = await Promise.all([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          content: true,
          parentId: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          post: { select: { id: true, title: true, slug: true } },
        },
      }),
    ]);

    return {
      page,
      limit,
      total,
      hasMore: skip + comments.length < total,
      comments,
    };
  });
}
