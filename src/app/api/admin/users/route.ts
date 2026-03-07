import type { NextRequest } from "next/server";

import { withRoute } from "@/lib/http/route";
import { requireAdmin } from "@/lib/auth/require";
import { enforceRateLimit } from "@/lib/rate-limit";
import { parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { AdminUsersQuerySchema } from "@/lib/validation/admin-users";

export const runtime = "nodejs";

const ONLINE_WINDOW_MINUTES = 10;

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    const admin = await requireAdmin(req);
    enforceRateLimit(req, {
      name: "admin-users-list",
      max: 120,
      windowMs: 10 * 60 * 1000,
      key: `user:${admin.id}`,
    });

    const { page, limit, skip, take } = parsePagination(req.nextUrl.searchParams);
    const { q, role, status } = AdminUsersQuerySchema.parse({
      q: req.nextUrl.searchParams.get("q") ?? undefined,
      role: req.nextUrl.searchParams.get("role") ?? undefined,
      status: req.nextUrl.searchParams.get("status") ?? undefined,
    });

    const where = {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          lastSeen: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              likes: true,
              bookmarks: true,
            },
          },
        },
      }),
    ]);

    const onlineThreshold = new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60 * 1000);

    return {
      page,
      limit,
      total,
      hasMore: skip + users.length < total,
      onlineWindowMinutes: ONLINE_WINDOW_MINUTES,
      currentAdminId: admin.id,
      users: users.map((u) => ({
        ...u,
        online: Boolean(u.lastSeen && u.lastSeen >= onlineThreshold),
      })),
    };
  });
}
