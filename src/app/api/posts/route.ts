import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { requireAdmin } from "@/lib/auth/require";
import { parsePagination } from "@/lib/pagination";
import { slugify } from "@/lib/slug";
import { PostUpsertSchema } from "@/lib/validation/posts";
import { getOrSetCached } from "@/lib/cache/store";
import { enforceRateLimit } from "@/lib/rate-limit";
import { invalidatePostListCache, postListCacheKey } from "@/lib/cache/posts";
import { getUserFromRequest } from "@/lib/auth/require";

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
      ...(viewer?.role === "ADMIN" ? {} : { published: true }),
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

    const key = postListCacheKey({ page, limit, q, tag });
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
    enforceRateLimit(req, {
      name: "admin-post-create",
      max: 10,
      windowMs: 60 * 60 * 1000,
    });

    const admin = await requireAdmin(req);

    const json = await req.json().catch(() => {
      throw new ApiError({ status: 400, code: "INVALID_JSON", message: "Invalid JSON body." });
    });

    const input = PostUpsertSchema.parse(json);
    const baseSlug = slugify(input.title);
    const slug = await uniqueSlug(baseSlug);

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

    const post = await prisma.post.create({
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt ?? input.content.slice(0, 220),
        content: input.content,
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
        published: input.published ?? true,
        authorId: admin.id,
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

