import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { requireAdmin } from "@/lib/auth/require";
import { enforceRateLimit } from "@/lib/rate-limit";
import { invalidatePostDetailCache, invalidatePostListCache } from "@/lib/cache/posts";

export const runtime = "nodejs";

const IdSchema = z.string().uuid();
const BodySchema = z.object({
  action: z.enum(["publish", "private"]),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withRoute(async () => {
    const admin = await requireAdmin(req);
    enforceRateLimit(req, { name: "admin-submission-review", max: 120, windowMs: 10 * 60 * 1000 });

    const { id } = await ctx.params;
    const postId = IdSchema.parse(id);

    const json = await req.json().catch(() => {
      throw new ApiError({ status: 400, code: "INVALID_JSON", message: "Invalid JSON body." });
    });
    const input = BodySchema.parse(json);

    const existing = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, slug: true, author: { select: { role: true } } },
    });
    if (!existing) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });
    }

    if (existing.author.role !== "USER") {
      throw new ApiError({
        status: 400,
        code: "INVALID_TARGET",
        message: "Only user submissions can be reviewed from this endpoint.",
      });
    }

    const publish = input.action === "publish";
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        published: publish,
        isPublic: publish,
        isApproved: true,
        publishedByAdmin: publish,
      },
      select: {
        id: true,
        slug: true,
        isPublic: true,
        isApproved: true,
        publishedByAdmin: true,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        actorId: admin.id,
        action: publish ? "POST_PUBLISH_PUBLIC" : "POST_KEEP_PRIVATE",
        details: {
          postId: post.id,
          slug: post.slug,
        },
      },
    });

    invalidatePostListCache();
    invalidatePostDetailCache(existing.slug);
    invalidatePostDetailCache(post.slug);

    return { post };
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return withRoute(async () => {
    const admin = await requireAdmin(req);
    enforceRateLimit(req, { name: "admin-submission-delete", max: 60, windowMs: 10 * 60 * 1000 });

    const { id } = await ctx.params;
    const postId = IdSchema.parse(id);

    const existing = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, slug: true },
    });
    if (!existing) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });
    }

    await prisma.post.delete({ where: { id: postId } });
    await prisma.adminAuditLog.create({
      data: {
        actorId: admin.id,
        action: "POST_SUBMISSION_DELETE",
        details: { postId, slug: existing.slug },
      },
    });

    invalidatePostListCache();
    invalidatePostDetailCache(existing.slug);

    return { ok: true };
  });
}
