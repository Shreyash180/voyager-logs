"use client";

import { useState } from "react";

export function BookmarkButton(props: {
  postId: string;
  initialBookmarked: boolean;
  initialCount: number;
}) {
  const [bookmarked, setBookmarked] = useState(props.initialBookmarked);
  const [count, setCount] = useState(props.initialCount);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);

    const next = !bookmarked;
    setBookmarked(next);
    setCount((c) => c + (next ? 1 : -1));

    const res = await fetch(`/api/posts/${props.postId}/bookmark`, {
      method: next ? "POST" : "DELETE",
    });

    if (!res.ok) {
      setBookmarked(bookmarked);
      setCount(props.initialCount);
    } else {
      const data = (await res.json().catch(() => null)) as { bookmarks?: number } | null;
      if (data?.bookmarks !== undefined) setCount(data.bookmarks);
    }

    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-violet-300/35 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-100 hover:bg-violet-400/20 disabled:opacity-60"
      disabled={loading}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      <span>{bookmarked ? "Saved" : "Bookmark"}</span>
      <span className="text-foreground/60">({count})</span>
    </button>
  );
}

