import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { requireUser } from "@/lib/auth/require";
import { enforceRateLimit } from "@/lib/rate-limit";
import { invalidatePostDetailCache, invalidatePostListCache } from "@/lib/cache/posts";

export const runtime = "nodejs";

const PostIdSchema = z.string().uuid();

export async function POST(req: NextRequest, ctx: { params: Promise<{ postId: string }> }) {
  return withRoute(async () => {
    enforceRateLimit(req, { name: "post-bookmark-write", max: 120, windowMs: 60 * 1000 });
    const user = requireUser(req);
    const { postId } = await ctx.params;
    const pid = PostIdSchema.parse(postId);

    await prisma.bookmark.upsert({
      where: { userId_postId: { userId: user.id, postId: pid } },
      update: {},
      create: { userId: user.id, postId: pid },
    });

    const [count, post] = await Promise.all([
      prisma.bookmark.count({ where: { postId: pid } }),
      prisma.post.findUnique({ where: { id: pid }, select: { slug: true } }),
    ]);
    if (post) {
      invalidatePostDetailCache(post.slug);
      invalidatePostListCache();
    }
    return { ok: true, bookmarks: count };
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ postId: string }> }) {
  return withRoute(async () => {
    enforceRateLimit(req, { name: "post-bookmark-write", max: 120, windowMs: 60 * 1000 });
    const user = requireUser(req);
    const { postId } = await ctx.params;
    const pid = PostIdSchema.parse(postId);

    await prisma.bookmark.deleteMany({ where: { userId: user.id, postId: pid } });
    const [count, post] = await Promise.all([
      prisma.bookmark.count({ where: { postId: pid } }),
      prisma.post.findUnique({ where: { id: pid }, select: { slug: true } }),
    ]);
    if (post) {
      invalidatePostDetailCache(post.slug);
      invalidatePostListCache();
    }
    return { ok: true, bookmarks: count };
  });
}

