"use client";

import { useMemo, useState } from "react";

import { useToast } from "@/components/ui/toast-provider";

type Submission = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  isPublic: boolean;
  isApproved: boolean;
  publishedByAdmin: boolean;
  createdAt: string | Date;
  author: { id: string; name: string | null };
};

function getStatus(post: Pick<Submission, "isPublic" | "isApproved" | "publishedByAdmin">) {
  if (post.isPublic && post.isApproved && post.publishedByAdmin) return "Published";
  if (!post.isApproved) return "Under Review";
  return "Private";
}

export function SubmissionsPanel({ initial }: { initial: Submission[] }) {
  const { push } = useToast();
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = useMemo(() => rows.filter((r) => !r.isApproved), [rows]);

  const review = async (id: string, action: "publish" | "private") => {
    setBusyId(id);
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);

    if (!res || !res.ok) {
      push(data?.error?.message ?? "Failed to update submission.", "error");
      setBusyId(null);
      return;
    }

    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              isPublic: data.post.isPublic,
              isApproved: data.post.isApproved,
              publishedByAdmin: data.post.publishedByAdmin,
            }
          : r,
      ),
    );
    push(action === "publish" ? "Submission published." : "Submission kept private.", "success");
    setBusyId(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this submission permanently?")) return;
    setBusyId(id);

    const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res || !res.ok) {
      push(data?.error?.message ?? "Failed to delete submission.", "error");
      setBusyId(null);
      return;
    }

    setRows((prev) => prev.filter((r) => r.id !== id));
    push("Submission deleted.", "success");
    setBusyId(null);
  };

  return (
    <section className="overflow-hidden rounded-xl border bg-background/60">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">User Submissions</h2>
        <p className="text-xs text-foreground/60">Review and publish community logs.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs text-foreground/60">
            <tr>
              <th className="px-4 py-3">Post</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pending.length ? (
              pending.map((s) => {
                const status = getStatus(s);
                return (
                  <tr key={s.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.title}</div>
                      <div className="line-clamp-2 text-xs text-foreground/60">
                        {s.excerpt ?? s.content.slice(0, 120)}
                      </div>
                    </td>
                    <td className="px-4 py-3">{s.author.name ?? "Unknown"}</td>
                    <td className="px-4 py-3 text-xs text-foreground/60">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border px-2 py-0.5 text-xs">{status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => review(s.id, "publish")}
                          disabled={busyId === s.id}
                          className="rounded-lg border px-2 py-1 text-xs hover:bg-foreground/5 disabled:opacity-60"
                        >
                          Publish Publicly
                        </button>
                        <button
                          type="button"
                          onClick={() => review(s.id, "private")}
                          disabled={busyId === s.id}
                          className="rounded-lg border px-2 py-1 text-xs hover:bg-foreground/5 disabled:opacity-60"
                        >
                          Keep Private
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(s.id)}
                          disabled={busyId === s.id}
                          className="rounded-lg border border-red-300/40 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-foreground/60" colSpan={5}>
                  No pending user submissions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
