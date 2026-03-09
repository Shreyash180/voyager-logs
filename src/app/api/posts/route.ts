import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { requireUser } from "@/lib/auth/require";
import { parsePagination } from "@/lib/pagination";
import { slugify } from "@/lib/slug";
import { PostUpsertSchema } from "@/lib/validation/posts";
import { getOrSetCached } from "@/lib/cache/store";
import { enforceRateLimit } from "@/lib/rate-limit";
import { invalidatePostListCache, postListCacheKey } from "@/lib/cache/posts";
import { getUserFromRequest } from "@/lib/auth/require";
import { sanitizeTextInput } from "@/lib/sanitize";

export const runtime = "nodejs";

const ListQuerySchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
});

async function uniqueSlug(base: string) {
  let attempt = base || "post";
  let suffix = 1;

  while (true) {
    const exists = await prisma.post.findUnique({ where: { slug: attempt }, select: { id: true } });
    if (!exists) return attempt;
    suffix += 1;
    attempt = `${base}-${suffix}`;
  }
}

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    const { page, limit, skip, take } = parsePagination(req.nextUrl.searchParams);
    const { q, tag } = ListQuerySchema.parse({
      q: req.nextUrl.searchParams.get("q") ?? undefined,
      tag: req.nextUrl.searchParams.get("tag") ?? undefined,
    });

    const viewer = getUserFromRequest(req);

    const where = {
      ...(viewer?.role === "ADMIN"
        ? {}
        : {
            isPublic: true,
            isApproved: true,
            published: true,
          }),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { content: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(tag
        ? {
            tags: {
              some: {
                tag: { slug: tag },
              },
            },
          }
        : {}),
    };

    const key = postListCacheKey({
      page,
      limit,
      q,
      tag,
      scope: viewer?.role === "ADMIN" ? "admin" : "public",
    });
    const payload = await getOrSetCached(key, 60_000, async () => {
      const [total, posts] = await Promise.all([
        prisma.post.count({ where }),
        prisma.post.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            thumbnailUrl: true,
            videoUrl: true,
            views: true,
            isPublic: true,
            isApproved: true,
            publishedByAdmin: true,
            createdAt: true,
            updatedAt: true,
            author: { select: { id: true, name: true } },
            tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
            _count: { select: { comments: true, likes: true, bookmarks: true } },
          },
        }),
      ]);

      return {
        page,
        limit,
        total,
        hasMore: skip + posts.length < total,
        posts: posts.map((p) => ({
          ...p,
          tags: p.tags.map((t) => t.tag),
        })),
      };
    });

    return payload;
  });
}

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    const auth = requireUser(req);
    const actor = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { id: true, role: true, status: true },
    });
    if (!actor || actor.status !== "ACTIVE") {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Login required." });
    }

    enforceRateLimit(req, {
      name: actor.role === "ADMIN" ? "admin-post-create" : "user-post-create",
      max: actor.role === "ADMIN" ? 10 : 20,
      windowMs: 60 * 60 * 1000,
      key: `user:${actor.id}`,
    });

    if (actor.role !== "ADMIN") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayCount = await prisma.post.count({
        where: {
          authorId: actor.id,
          createdAt: { gte: startOfToday },
        },
      });
      if (todayCount >= 2) {
        throw new ApiError({
          status: 429,
          code: "DAILY_LIMIT_REACHED",
          message: "You've reached today's limit of 2 voyager logs.",
        });
      }
    }

    const json = await req.json().catch(() => {
      throw new ApiError({ status: 400, code: "INVALID_JSON", message: "Invalid JSON body." });
    });

    const input = PostUpsertSchema.parse(json);
    const title = sanitizeTextInput(input.title);
    const content = sanitizeTextInput(input.content);
    const excerpt = input.excerpt ? sanitizeTextInput(input.excerpt) : undefined;

    if (!title || !content) {
      throw new ApiError({
        status: 400,
        code: "INVALID_INPUT",
        message: "Title and content are required.",
      });
    }

    const baseSlug = slugify(title);
    const slug = await uniqueSlug(baseSlug);

    const tagValues = (input.tags ?? [])
      .map((t) => sanitizeTextInput(t))
      .filter(Boolean)
      .slice(0, 20);

    const userRequestedPublish = actor.role !== "ADMIN" ? Boolean(input.published) : false;
    const adminPublished = actor.role === "ADMIN" ? (input.published ?? true) : false;

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

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt: excerpt ?? content.slice(0, 220),
        content,
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
        published: adminPublished,
        isPublic: adminPublished,
        isApproved: actor.role === "ADMIN" ? adminPublished : !userRequestedPublish,
        publishedByAdmin: adminPublished,
        authorId: actor.id,
        tags: {
          create: tags.map((t) => ({ tagId: t.id })),
        },
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

    return { post };
  }, { status: 201 });
}

