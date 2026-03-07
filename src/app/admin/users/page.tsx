import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/server";
import { AdminUsersPanel } from "@/components/admin/users-panel";

export const runtime = "nodejs";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "ADMIN") redirect("/");

  const [users, audit] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
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
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
        actor: { select: { id: true, email: true, name: true } },
        targetUser: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Manage users</h1>
        <p className="text-sm text-foreground/70">
          Update roles/status, track online presence, and review audit logs.
        </p>
      </header>

      <AdminUsersPanel
        initialUsers={users}
        initialAudit={audit}
        currentAdminId={currentUser.id}
      />
    </div>
  );
}
