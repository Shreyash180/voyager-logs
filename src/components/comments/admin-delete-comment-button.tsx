"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminDeleteCommentButton({ commentId }: { commentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (loading) return;
    if (!confirm("Delete this comment?")) return;

    setLoading(true);
    const res = await fetch(`/api/admin/comments/${commentId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) return;
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
