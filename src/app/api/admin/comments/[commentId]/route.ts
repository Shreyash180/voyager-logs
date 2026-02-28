import type { NextRequest } from "next/server";
import { z } from "zod";

import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { requireAdmin } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { invalidatePostDetailCache, invalidatePostListCache } from "@/lib/cache/posts";

export const runtime = "nodejs";

const CommentIdSchema = z.string().uuid();

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ commentId: string }> },
) {
  return withRoute(async () => {
    requireAdmin(req);
    enforceRateLimit(req, { name: "admin-comment-delete", max: 80, windowMs: 10 * 60 * 1000 });

    const { commentId } = await ctx.params;
    const id = CommentIdSchema.parse(commentId);

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, post: { select: { slug: true } } },
    });
    if (!comment) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Comment not found." });
    }

    await prisma.comment.delete({ where: { id } });
    invalidatePostDetailCache(comment.post.slug);
    invalidatePostListCache();

    return { ok: true };
  });
}
