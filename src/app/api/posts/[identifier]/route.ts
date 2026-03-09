import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { getUserFromRequest, requireUser } from "@/lib/auth/require";
import { PostPatchSchema } from "@/lib/validation/posts";
import { slugify } from "@/lib/slug";
import { invalidatePostDetailCache, invalidatePostListCache, postDetailCacheKey } from "@/lib/cache/posts";
import { getOrSetCached } from "@/lib/cache/store";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sanitizeTextInput } from "@/lib/sanitize";

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

async function getFreshActor(userId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });

  if (!actor || actor.status !== "ACTIVE") {
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Login required." });
  }

  return actor;
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
          isPublic: true,
          isApproved: true,
          publishedByAdmin: true,
          authorId: true,
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

    const isPublicPost = post.published && post.isPublic && post.isApproved;
    const canView =
      isPublicPost || viewer?.role === "ADMIN" || (viewer && viewer.id === post.authorId);

    if (!canView) {
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
    const auth = requireUser(req);
    const actor = await getFreshActor(auth.id);

    enforceRateLimit(req, {
      name: actor.role === "ADMIN" ? "admin-post-update" : "user-post-update",
      max: actor.role === "ADMIN" ? 60 : 30,
      windowMs: 10 * 60 * 1000,
      key: `user:${actor.id}`,
    });

    const { identifier } = await ctx.params;
    const id = UuidSchema.parse(identifier);

    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        authorId: true,
        isPublic: true,
        publishedByAdmin: true,
      },
    });
    if (!existingPost) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });
    }

    const isAdmin = actor.role === "ADMIN";
    if (!isAdmin) {
      if (existingPost.authorId !== actor.id) {
        throw new ApiError({ status: 403, code: "FORBIDDEN", message: "You cannot edit this post." });
      }
      if (existingPost.isPublic || existingPost.publishedByAdmin) {
        throw new ApiError({
          status: 403,
          code: "FORBIDDEN",
          message: "Users can edit only their own private logs.",
        });
      }
    }

    const json = await req.json().catch(() => {
      throw new ApiError({ status: 400, code: "INVALID_JSON", message: "Invalid JSON body." });
    });

    const input = PostPatchSchema.parse(json);

    const tagValues = (input.tags ?? [])
      .map((t) => sanitizeTextInput(t))
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

    const nextTitle = input.title !== undefined ? sanitizeTextInput(input.title) : undefined;
    const nextContent = input.content !== undefined ? sanitizeTextInput(input.content) : undefined;
    const nextExcerpt = input.excerpt !== undefined ? sanitizeTextInput(input.excerpt) : undefined;

    if (nextTitle !== undefined && !nextTitle) {
      throw new ApiError({ status: 400, code: "INVALID_INPUT", message: "Title is required." });
    }
    if (nextContent !== undefined && !nextContent) {
      throw new ApiError({ status: 400, code: "INVALID_INPUT", message: "Content is required." });
    }

    const slug = nextTitle !== undefined ? await uniqueSlug(slugify(nextTitle), id) : undefined;

    const publishNow = isAdmin ? input.published : undefined;
    const userRequestedPublish = !isAdmin && input.published !== undefined ? Boolean(input.published) : undefined;

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: nextTitle,
        slug,
        excerpt: nextExcerpt ?? (nextContent ? nextContent.slice(0, 220) : undefined),
        content: nextContent,
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
        published: publishNow,
        isPublic: isAdmin ? publishNow : false,
        isApproved: isAdmin ? publishNow : userRequestedPublish !== undefined ? !userRequestedPublish : undefined,
        publishedByAdmin: isAdmin ? publishNow : false,
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
        isPublic: true,
        isApproved: true,
        publishedByAdmin: true,
        content: true,
        videoUrl: true,
        thumbnailUrl: true,
        views: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    invalidatePostListCache();
    invalidatePostDetailCache(existingPost.slug);
    invalidatePostDetailCache(post.slug);

    return { post };
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ identifier: string }> }) {
  return withRoute(async () => {
    const auth = requireUser(req);
    const actor = await getFreshActor(auth.id);

    enforceRateLimit(req, {
      name: actor.role === "ADMIN" ? "admin-post-delete" : "user-post-delete",
      max: actor.role === "ADMIN" ? 30 : 20,
      windowMs: 10 * 60 * 1000,
      key: `user:${actor.id}`,
    });

    const { identifier } = await ctx.params;
    const id = UuidSchema.parse(identifier);

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        slug: true,
        authorId: true,
        isPublic: true,
        publishedByAdmin: true,
      },
    });
    if (!post) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });
    }

    if (actor.role !== "ADMIN") {
      if (post.authorId !== actor.id) {
        throw new ApiError({ status: 403, code: "FORBIDDEN", message: "You cannot delete this post." });
      }
      if (post.isPublic || post.publishedByAdmin) {
        throw new ApiError({
          status: 403,
          code: "FORBIDDEN",
          message: "Users can delete only their own private logs.",
        });
      }
    }

    await prisma.post.delete({ where: { id } });
    invalidatePostListCache();
    invalidatePostDetailCache(post.slug);
    return { ok: true };
  });
}
