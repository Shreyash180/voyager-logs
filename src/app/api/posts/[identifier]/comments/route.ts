import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { withRoute } from "@/lib/http/route";
import { ApiError } from "@/lib/http/errors";
import { getUserFromRequest, requireUser } from "@/lib/auth/require";
import { CommentCreateSchema } from "@/lib/validation/comments";
import { enforceRateLimit } from "@/lib/rate-limit";
import { invalidatePostDetailCache, invalidatePostListCache } from "@/lib/cache/posts";

export const runtime = "nodejs";

const IdentifierSchema = z.string().uuid();

type CommentNode = {
  id: string;
  content: string;
  createdAt: Date;
  user: { id: string; name: string | null };
  parentId: string | null;
  children: CommentNode[];
};

function buildTree(items: Omit<CommentNode, "children">[]) {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const item of items) {
    byId.set(item.id, { ...item, children: [] });
  }

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ identifier: string }> }) {
  return withRoute(async () => {
    const { identifier } = await ctx.params;
    const pid = IdentifierSchema.parse(identifier);
    const viewer = getUserFromRequest(req);

    const post = await prisma.post.findUnique({
      where: { id: pid },
      select: { authorId: true, isPublic: true, isApproved: true, published: true },
    });
    if (!post) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });

    const canView =
      (post.isPublic && post.isApproved && post.published) ||
      post.authorId === viewer?.id ||
      viewer?.role === "ADMIN";
    if (!canView) {
      throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Post access denied." });
    }

    const comments = await prisma.comment.findMany({
      where: { postId: pid },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        parentId: true,
        user: { select: { id: true, name: true } },
      },
    });

    return { comments: buildTree(comments) };
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ identifier: string }> }) {
  return withRoute(async () => {
    enforceRateLimit(req, { name: "post-comment-create", max: 40, windowMs: 10 * 60 * 1000 });
    const user = requireUser(req);
    const { identifier } = await ctx.params;
    const pid = IdentifierSchema.parse(identifier);

    const postAccess = await prisma.post.findUnique({
      where: { id: pid },
      select: { slug: true, authorId: true, isPublic: true, isApproved: true, published: true },
    });
    if (!postAccess) throw new ApiError({ status: 404, code: "NOT_FOUND", message: "Post not found." });
    const canComment =
      (postAccess.isPublic && postAccess.isApproved && postAccess.published) ||
      postAccess.authorId === user.id ||
      user.role === "ADMIN";
    if (!canComment) {
      throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Post access denied." });
    }

    const json = await req.json().catch(() => {
      throw new ApiError({ status: 400, code: "INVALID_JSON", message: "Invalid JSON body." });
    });
    const input = CommentCreateSchema.parse(json);

    // Honeypot field for bot submissions: treat as accepted and no-op.
    if (input.website) {
      return { comment: null };
    }

    if (input.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: input.parentId },
        select: { id: true, postId: true },
      });
      if (!parent || parent.postId !== pid) {
        throw new ApiError({
          status: 400,
          code: "INVALID_PARENT",
          message: "parentId must reference a comment on the same post.",
        });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: input.content,
        userId: user.id,
        postId: pid,
        parentId: input.parentId ?? null,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        parentId: true,
        user: { select: { id: true, name: true } },
      },
    });

    invalidatePostDetailCache(postAccess.slug);
    invalidatePostListCache();

    return { comment };
  }, { status: 201 });
}

