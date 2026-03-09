import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { requireUser } from "@/lib/auth/require";
import { enforceRateLimit } from "@/lib/rate-limit";
import { invalidatePostDetailCache, invalidatePostListCache } from "@/lib/cache/posts";

export const runtime = "nodejs";

const IdentifierSchema = z.string().uuid();

export async function POST(req: NextRequest, ctx: { params: Promise<{ identifier: string }> }) {
  return withRoute(async () => {
    enforceRateLimit(req, { name: "post-bookmark-write", max: 120, windowMs: 60 * 1000 });
    const user = requireUser(req);
    const { identifier } = await ctx.params;
    const pid = IdentifierSchema.parse(identifier);
    const post = await prisma.post.findUnique({
      where: { id: pid },
      select: { authorId: true, isPublic: true, isApproved: true, published: true },
    });
    if (!post) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });
    const canInteract =
      (post.isPublic && post.isApproved && post.published) ||
      post.authorId === user.id ||
      user.role === "ADMIN";
    if (!canInteract) {
      throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Post access denied." });
    }

    await prisma.bookmark.upsert({
      where: { userId_postId: { userId: user.id, postId: pid } },
      update: {},
      create: { userId: user.id, postId: pid },
    });

    const [count, postMeta] = await Promise.all([
      prisma.bookmark.count({ where: { postId: pid } }),
      prisma.post.findUnique({ where: { id: pid }, select: { slug: true } }),
    ]);
    if (postMeta) {
      invalidatePostDetailCache(postMeta.slug);
      invalidatePostListCache();
    }
    return { ok: true, bookmarks: count };
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ identifier: string }> }) {
  return withRoute(async () => {
    enforceRateLimit(req, { name: "post-bookmark-write", max: 120, windowMs: 60 * 1000 });
    const user = requireUser(req);
    const { identifier } = await ctx.params;
    const pid = IdentifierSchema.parse(identifier);
    const post = await prisma.post.findUnique({
      where: { id: pid },
      select: { authorId: true, isPublic: true, isApproved: true, published: true },
    });
    if (!post) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });
    const canInteract =
      (post.isPublic && post.isApproved && post.published) ||
      post.authorId === user.id ||
      user.role === "ADMIN";
    if (!canInteract) {
      throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Post access denied." });
    }

    await prisma.bookmark.deleteMany({ where: { userId: user.id, postId: pid } });
    const [count, postMeta] = await Promise.all([
      prisma.bookmark.count({ where: { postId: pid } }),
      prisma.post.findUnique({ where: { id: pid }, select: { slug: true } }),
    ]);
    if (postMeta) {
      invalidatePostDetailCache(postMeta.slug);
      invalidatePostListCache();
    }
    return { ok: true, bookmarks: count };
  });
}

