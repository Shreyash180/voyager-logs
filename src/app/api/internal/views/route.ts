import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";

import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { invalidatePostDetailCache, invalidatePostListCache } from "@/lib/cache/posts";
import { getUserFromRequest } from "@/lib/auth/require";

export const runtime = "nodejs";

const BodySchema = z.object({
  slug: z.string().min(1).max(120),
});

const VIEW_DEDUPE_WINDOW_HOURS = 6;

function hashIp(ip: string) {
  const salt = process.env.VIEW_HASH_SALT ?? process.env.JWT_ACCESS_SECRET ?? "voyager-logs";
  return crypto.createHash("sha256").update(`${ip}:${salt}`).digest("hex");
}

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    enforceRateLimit(req, {
      name: "internal-view-tracking",
      max: 300,
      windowMs: 60 * 1000,
      key: `ip:${getClientIp(req)}`,
    });

    const json = await req.json().catch(() => {
      throw new ApiError({ status: 400, code: "INVALID_JSON", message: "Invalid JSON body." });
    });
    const input = BodySchema.parse(json);
    const viewer = getUserFromRequest(req);

    const post = await prisma.post.findUnique({
      where: { slug: input.slug },
      select: { id: true, slug: true, authorId: true, isPublic: true, isApproved: true, published: true },
    });
    if (!post) return { tracked: false, reason: "POST_NOT_FOUND" };

    const ipHash = hashIp(getClientIp(req));
    const actorUserId = viewer?.id ?? null;

    const canView = post.isPublic && post.isApproved && post.published;
    if (!canView && actorUserId !== post.authorId && viewer?.role !== "ADMIN") {
      throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Post access denied." });
    }

    if (!actorUserId && !ipHash) {
      return { tracked: false, reason: "MISSING_ACTOR" };
    }

    const dedupeAfter = new Date(Date.now() - VIEW_DEDUPE_WINDOW_HOURS * 60 * 60 * 1000);

    const existing = await prisma.postView.findFirst({
      where: {
        postId: post.id,
        createdAt: { gte: dedupeAfter },
        ...(actorUserId ? { userId: actorUserId } : { ipHash }),
      },
      select: { id: true },
    });
    if (existing) return { tracked: false, reason: "DEDUPED" };

    await prisma.$transaction([
      prisma.postView.create({
        data: {
          postId: post.id,
          userId: actorUserId,
          ipHash,
        },
      }),
      prisma.post.update({
        where: { id: post.id },
        data: { views: { increment: 1 } },
      }),
    ]);

    invalidatePostDetailCache(post.slug);
    invalidatePostListCache();

    return { tracked: true };
  });
}
