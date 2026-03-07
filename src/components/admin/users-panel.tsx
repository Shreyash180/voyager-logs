"use client";

import { useEffect, useMemo, useState } from "react";

import { NeonButton } from "@/components/ui/neon-button";

type ManagedUser = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "BANNED";
  lastSeen: string | Date | null;
  createdAt: string | Date;
  _count: {
    posts: number;
    comments: number;
    likes: number;
    bookmarks: number;
  };
};

type AuditEntry = {
  id: string;
  action: string;
  createdAt: string | Date;
  actor: { id: string; email: string; name: string | null } | null;
  targetUser: { id: string; email: string; name: string | null } | null;
  details: unknown;
};

export function AdminUsersPanel(props: {
  initialUsers: ManagedUser[];
  initialAudit: AuditEntry[];
  currentAdminId: string;
}) {
  const [users, setUsers] = useState(props.initialUsers);
  const [audit, setAudit] = useState(props.initialAudit);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const isOnline = (lastSeen: string | Date | null) => {
    if (!lastSeen) return false;
    const seen = typeof lastSeen === "string" ? new Date(lastSeen).getTime() : lastSeen.getTime();
    return nowTs - seen <= 10 * 60 * 1000;
  };

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.name ?? ""} ${u.email}`.toLowerCase().includes(q),
    );
  }, [users, query]);

  const onRoleChange = async (user: ManagedUser, nextRole: "ADMIN" | "USER") => {
    if (user.id === props.currentAdminId && nextRole === "USER") {
      setError("You cannot demote yourself.");
      return;
    }
    if (user.role === nextRole) return;
    await patchUser(user.id, { role: nextRole, reason: "Role updated from admin panel" });
  };

  const onStatusChange = async (user: ManagedUser, nextStatus: "ACTIVE" | "BANNED") => {
    if (user.status === nextStatus) return;
    if (user.id === props.currentAdminId && nextStatus === "BANNED") {
      setError("You cannot ban your own account.");
      return;
    }

    let confirmEmail: string | undefined;
    if (nextStatus === "BANNED") {
      const typed = window.prompt(`Type "${user.email}" to confirm ban:`) ?? "";
      if (typed !== user.email) {
        setError("Ban canceled. Confirmation email did not match.");
        return;
      }
      confirmEmail = typed;
    }

    await patchUser(user.id, {
      status: nextStatus,
      confirmEmail,
      reason: nextStatus === "BANNED" ? "Banned from admin panel" : "Re-activated from admin panel",
    });
  };

  const onDeleteUser = async (user: ManagedUser) => {
    if (user.id === props.currentAdminId) {
      setError("You cannot delete your own account.");
      return;
    }
    const typed = window.prompt(`Delete user "${user.email}"? Type email to confirm:`) ?? "";
    if (typed !== user.email) {
      setError("Delete canceled. Confirmation email did not match.");
      return;
    }
    const accepted = window.confirm(
      "This permanently deletes the user if they have no posts/comments. Continue?",
    );
    if (!accepted) return;

    setBusyUserId(user.id);
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        confirmEmail: typed,
        reason: "Deleted from admin panel",
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error?.message ?? "Delete failed.");
      setBusyUserId(null);
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    setAudit((prev) =>
      [
        {
          id: crypto.randomUUID(),
          action: "USER_DELETED",
          createdAt: new Date(),
          actor: null,
          targetUser: { id: user.id, email: user.email, name: user.name },
          details: null,
        },
        ...prev,
      ].slice(0, 20),
    );
    setBusyUserId(null);
  };

  const patchUser = async (
    userId: string,
    payload: {
      role?: "ADMIN" | "USER";
      status?: "ACTIVE" | "BANNED";
      confirmEmail?: string;
      reason?: string;
    },
  ) => {
    setBusyUserId(userId);
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error?.message ?? "Update failed.");
      setBusyUserId(null);
      return;
    }

    const updated = data?.user as ManagedUser | undefined;
    if (updated?.id) {
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    }
    setBusyUserId(null);
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel space-y-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/80">Search users</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="name or email"
              className="w-64 rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/20"
            />
          </div>
          <NeonButton type="button" variant="outline" className="h-10 px-3" onClick={() => setQuery("")}>
            Clear
          </NeonButton>
        </div>

        {error ? <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-200">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs text-foreground/65">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Online</th>
                <th className="px-3 py-2">Activity</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-b-0">
                    <td className="px-3 py-2">
                      <div className="font-medium">{u.name ?? "Unnamed"}</div>
                      <div className="text-xs text-foreground/60">{u.email}</div>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={u.role}
                        onChange={(e) => onRoleChange(u, e.target.value as "ADMIN" | "USER")}
                        disabled={busyUserId === u.id || u.id === props.currentAdminId}
                        className="rounded-md border border-white/15 bg-black/20 px-2 py-1 text-xs"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={u.status}
                        onChange={(e) => onStatusChange(u, e.target.value as "ACTIVE" | "BANNED")}
                        disabled={busyUserId === u.id}
                        className="rounded-md border border-white/15 bg-black/20 px-2 py-1 text-xs"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="BANNED">BANNED</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                          isOnline(u.lastSeen)
                            ? "bg-green-500/20 text-green-200"
                            : "bg-white/10 text-foreground/60"
                        }`}
                      >
                        {isOnline(u.lastSeen) ? "Online" : "Offline"}
                      </span>
                      <div className="mt-1 text-[11px] text-foreground/55">
                        {u.lastSeen ? new Date(u.lastSeen).toLocaleString() : "Never seen"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground/70">
                      <div>Posts: {u._count.posts}</div>
                      <div>Comments: {u._count.comments}</div>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onDeleteUser(u)}
                        disabled={busyUserId === u.id || u.id === props.currentAdminId}
                        className="rounded-lg border border-red-300/35 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4 text-foreground/60" colSpan={6}>
                    No users matched.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel p-4">
        <h2 className="text-sm font-semibold">Recent Admin Audit Logs</h2>
        <ul className="mt-3 space-y-2 text-xs">
          {audit.length ? (
            audit.map((log) => (
              <li key={log.id} className="rounded-md border border-white/10 bg-black/15 p-2">
                <div className="font-medium">{log.action}</div>
                <div className="text-foreground/65">
                  {new Date(log.createdAt).toLocaleString()} | actor:{" "}
                  {log.actor?.email ?? "unknown"} | target: {log.targetUser?.email ?? "deleted user"}
                </div>
              </li>
            ))
          ) : (
            <li className="text-foreground/60">No audit logs yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
