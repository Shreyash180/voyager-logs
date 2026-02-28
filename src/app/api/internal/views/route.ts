import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";

import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { invalidatePostDetailCache } from "@/lib/cache/posts";

export const runtime = "nodejs";

const BodySchema = z.object({
  slug: z.string().min(1).max(120),
  userId: z.string().uuid().nullable().optional(),
  ip: z.string().min(1).max(100).optional(),
});

const VIEW_DEDUPE_WINDOW_HOURS = 6;

function hashIp(ip: string) {
  const salt = process.env.VIEW_HASH_SALT ?? process.env.JWT_ACCESS_SECRET ?? "voyager-logs";
  return crypto.createHash("sha256").update(`${ip}:${salt}`).digest("hex");
}

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    const expectedKey = process.env.INTERNAL_API_KEY ?? process.env.JWT_ACCESS_SECRET;
    const key = req.headers.get("x-internal-key");
    if (!expectedKey || key !== expectedKey) {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid internal key." });
    }

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

    const post = await prisma.post.findUnique({
      where: { slug: input.slug },
      select: { id: true, slug: true },
    });
    if (!post) return { tracked: false, reason: "POST_NOT_FOUND" };

    const ipHash = input.ip ? hashIp(input.ip) : null;
    if (!input.userId && !ipHash) {
      return { tracked: false, reason: "MISSING_ACTOR" };
    }

    const dedupeAfter = new Date(Date.now() - VIEW_DEDUPE_WINDOW_HOURS * 60 * 60 * 1000);

    const existing = await prisma.postView.findFirst({
      where: {
        postId: post.id,
        createdAt: { gte: dedupeAfter },
        ...(input.userId ? { userId: input.userId } : { ipHash: ipHash! }),
      },
      select: { id: true },
    });
    if (existing) return { tracked: false, reason: "DEDUPED" };

    await prisma.$transaction([
      prisma.postView.create({
        data: {
          postId: post.id,
          userId: input.userId ?? null,
          ipHash,
        },
      }),
      prisma.post.update({
        where: { id: post.id },
        data: { views: { increment: 1 } },
      }),
    ]);

    invalidatePostDetailCache(post.slug);

    return { tracked: true };
  });
}
