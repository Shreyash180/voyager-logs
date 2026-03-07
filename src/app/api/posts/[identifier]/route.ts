import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { getUserFromRequest, requireAdmin, requireUser } from "@/lib/auth/require";
import { PostPatchSchema } from "@/lib/validation/posts";
import { slugify } from "@/lib/slug";
import {
  invalidatePostDetailCache,
  invalidatePostListCache,
  postDetailCacheKey,
} from "@/lib/cache/posts";
import { getOrSetCached } from "@/lib/cache/store";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const UuidSchema = z.string().uuid();

async function uniqueSlug(base: string, excludeId?: string) {
  let attempt = base || "post";
  let suffix = 1;

  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug: attempt },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) return attempt;

    suffix += 1;
    attempt = `${base}-${suffix}`;
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ identifier: string }> }) {
  return withRoute(async () => {
    const { identifier } = await ctx.params;
    const slug = identifier;

    const viewer = getUserFromRequest(req);

    const cacheKey = postDetailCacheKey(slug);
    const post = await getOrSetCached(cacheKey, 45_000, async () =>
      prisma.post.findUnique({
        where: { slug },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          published: true,
          content: true,
          videoUrl: true,
          thumbnailUrl: true,
          views: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { id: true, name: true } },
          tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
          _count: { select: { comments: true, likes: true, bookmarks: true } },
        },
      }),
    );

    if (!post) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });
    }
    if (!post.published && viewer?.role !== "ADMIN") {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });
    }

    const [viewerLiked, viewerBookmarked] = viewer
      ? await Promise.all([
          prisma.like.findUnique({
            where: { userId_postId: { userId: viewer.id, postId: post.id } },
            select: { userId: true },
          }),
          prisma.bookmark.findUnique({
            where: { userId_postId: { userId: viewer.id, postId: post.id } },
            select: { userId: true },
          }),
        ])
      : [null, null];

    return {
      post: { ...post, tags: post.tags.map((t) => t.tag) },
      viewer: viewer
        ? { liked: Boolean(viewerLiked), bookmarked: Boolean(viewerBookmarked) }
        : { liked: false, bookmarked: false },
    };
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ identifier: string }> }) {
  return withRoute(async () => {
    requireUser(req);
    const admin = await requireAdmin(req);
    enforceRateLimit(req, {
      name: "admin-post-update",
      max: 60,
      windowMs: 10 * 60 * 1000,
    });

    const { identifier } = await ctx.params;
    const id = UuidSchema.parse(identifier);

    const json = await req.json().catch(() => {
      throw new ApiError({ status: 400, code: "INVALID_JSON", message: "Invalid JSON body." });
    });

    const input = PostPatchSchema.parse(json);

    const tagValues = (input.tags ?? [])
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);

    const tags = await Promise.all(
      tagValues.map(async (name) => {
        const slug = slugify(name);
        return prisma.tag.upsert({
          where: { slug },
          update: { name },
          create: { name, slug },
          select: { id: true },
        });
      }),
    );

    const slug =
      input.title !== undefined ? await uniqueSlug(slugify(input.title), id) : undefined;

    const old = await prisma.post.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!old) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt ?? (input.content ? input.content.slice(0, 220) : undefined),
        content: input.content,
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
        published: input.published,
        authorId: admin.id,
        ...(input.tags
          ? {
              tags: {
                deleteMany: {},
                create: tags.map((t) => ({ tagId: t.id })),
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        published: true,
        content: true,
        videoUrl: true,
        thumbnailUrl: true,
        views: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    invalidatePostListCache();
    invalidatePostDetailCache(old.slug);
    invalidatePostDetailCache(post.slug);

    return { post };
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ identifier: string }> }) {
  return withRoute(async () => {
    requireUser(req);
    await requireAdmin(req);
    enforceRateLimit(req, {
      name: "admin-post-delete",
      max: 30,
      windowMs: 10 * 60 * 1000,
    });

    const { identifier } = await ctx.params;
    const id = UuidSchema.parse(identifier);

    const post = await prisma.post.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!post) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });

    await prisma.post.delete({ where: { id } });
    invalidatePostListCache();
    invalidatePostDetailCache(post.slug);
    return { ok: true };
  });
}

