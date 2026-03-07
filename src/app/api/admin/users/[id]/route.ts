import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { withRoute } from "@/lib/http/route";
import { requireAdmin } from "@/lib/auth/require";
import { enforceRateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/http/errors";
import { prisma } from "@/lib/prisma";
import {
  AdminUserDeleteSchema,
  AdminUserPatchSchema,
} from "@/lib/validation/admin-users";
import { logAdminAudit } from "@/lib/audit";

export const runtime = "nodejs";

const UserIdSchema = z.string().uuid();

async function ensureCanRemoveAdminPrivileges(targetUserId: string) {
  const remaining = await prisma.user.count({
    where: {
      id: { not: targetUserId },
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  if (remaining < 1) {
    throw new ApiError({
      status: 400,
      code: "LAST_ADMIN_PROTECTED",
      message: "You cannot remove privileges from the last active admin.",
    });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return withRoute(async () => {
    const admin = await requireAdmin(req);
    enforceRateLimit(req, {
      name: "admin-user-update",
      max: 80,
      windowMs: 10 * 60 * 1000,
      key: `user:${admin.id}`,
    });

    const { id } = await ctx.params;
    const userId = UserIdSchema.parse(id);
    const json = await req.json().catch(() => {
      throw new ApiError({ status: 400, code: "INVALID_JSON", message: "Invalid JSON body." });
    });
    const input = AdminUserPatchSchema.parse(json);

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });
    if (!target) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: "User not found." });
    }

    if (target.id === admin.id && input.role === "USER") {
      throw new ApiError({
        status: 400,
        code: "SELF_DEMOTE_BLOCKED",
        message: "You cannot demote your own admin role.",
      });
    }

    if (target.id === admin.id && input.status === "BANNED") {
      throw new ApiError({
        status: 400,
        code: "SELF_BAN_BLOCKED",
        message: "You cannot ban your own account.",
      });
    }

    if (input.status === "BANNED" && input.confirmEmail !== target.email) {
      throw new ApiError({
        status: 400,
        code: "CONFIRMATION_REQUIRED",
        message: "To ban a user, confirmation email must match the target user email.",
      });
    }

    const removingAdminRole = target.role === "ADMIN" && input.role === "USER";
    const banningAdmin = target.role === "ADMIN" && input.status === "BANNED";
    if (removingAdminRole || banningAdmin) {
      await ensureCanRemoveAdminPrivileges(target.id);
    }

    const data: { role?: "ADMIN" | "USER"; status?: "ACTIVE" | "BANNED" } = {};
    if (input.role && input.role !== target.role) data.role = input.role;
    if (input.status && input.status !== target.status) data.status = input.status;

    if (!Object.keys(data).length) {
      return { user: target, unchanged: true };
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (data.role) {
      await logAdminAudit({
        actorId: admin.id,
        targetUserId: target.id,
        action: "USER_ROLE_CHANGED",
        details: {
          previousRole: target.role,
          nextRole: data.role,
          reason: input.reason ?? null,
        },
      });
    }

    if (data.status) {
      await logAdminAudit({
        actorId: admin.id,
        targetUserId: target.id,
        action: "USER_STATUS_CHANGED",
        details: {
          previousStatus: target.status,
          nextStatus: data.status,
          reason: input.reason ?? null,
        },
      });
    }

    return { user: updated };
  });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return withRoute(async () => {
    const admin = await requireAdmin(req);
    enforceRateLimit(req, {
      name: "admin-user-delete",
      max: 20,
      windowMs: 10 * 60 * 1000,
      key: `user:${admin.id}`,
    });

    const { id } = await ctx.params;
    const userId = UserIdSchema.parse(id);
    const json = await req.json().catch(() => {
      throw new ApiError({ status: 400, code: "INVALID_JSON", message: "Invalid JSON body." });
    });
    const input = AdminUserDeleteSchema.parse(json);

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        _count: { select: { posts: true, comments: true } },
      },
    });
    if (!target) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: "User not found." });
    }

    if (target.id === admin.id) {
      throw new ApiError({
        status: 400,
        code: "SELF_DELETE_BLOCKED",
        message: "You cannot delete your own account.",
      });
    }

    if (input.confirmEmail !== target.email) {
      throw new ApiError({
        status: 400,
        code: "CONFIRMATION_REQUIRED",
        message: "To delete this user, confirmation email must match the target user email.",
      });
    }

    if (target.role === "ADMIN") {
      await ensureCanRemoveAdminPrivileges(target.id);
    }

    if (target._count.posts > 0 || target._count.comments > 0) {
      throw new ApiError({
        status: 409,
        code: "DELETE_BLOCKED",
        message:
          "Cannot delete user with existing posts/comments. Ban the user instead.",
      });
    }

    await logAdminAudit({
      actorId: admin.id,
      targetUserId: target.id,
      action: "USER_DELETED",
      details: {
        targetEmail: target.email,
        previousRole: target.role,
        previousStatus: target.status,
        reason: input.reason ?? null,
      },
    });

    try {
      await prisma.user.delete({ where: { id: target.id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        throw new ApiError({
          status: 409,
          code: "DELETE_BLOCKED",
          message:
            "Cannot delete this user due to linked records. Ban the user instead.",
        });
      }
      throw err;
    }

    return { ok: true };
  });
}
