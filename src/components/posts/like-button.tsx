"use client";

import { useState } from "react";

export function LikeButton(props: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(props.initialLiked);
  const [count, setCount] = useState(props.initialCount);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    const res = await fetch(`/api/posts/${props.postId}/like`, {
      method: nextLiked ? "POST" : "DELETE",
    });

    if (!res.ok) {
      setLiked(liked);
      setCount(props.initialCount);
    } else {
      const data = (await res.json().catch(() => null)) as { likes?: number } | null;
      if (data?.likes !== undefined) setCount(data.likes);
    }

    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium hover:bg-foreground hover:text-background disabled:opacity-60"
      disabled={loading}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      <span>{liked ? "Liked" : "Like"}</span>
      <span className="text-foreground/60">({count})</span>
    </button>
  );
}

