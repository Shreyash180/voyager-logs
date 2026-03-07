import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { requireAdmin } from "@/lib/auth/require";
import { parsePagination } from "@/lib/pagination";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    await requireAdmin(req);

    const { page, limit, skip, take } = parsePagination(req.nextUrl.searchParams);

    const [total, posts] = await Promise.all([
      prisma.post.count(),
      prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          title: true,
          slug: true,
          views: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { likes: true, comments: true, bookmarks: true } },
        },
      }),
    ]);

    return {
      page,
      limit,
      total,
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        views: p.views,
        likes: p._count.likes,
        comments: p._count.comments,
        bookmarks: p._count.bookmarks,
      })),
    };
  });
}

