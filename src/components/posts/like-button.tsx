"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

export function LikeButton(props: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const { push } = useToast();
  const [liked, setLiked] = useState(props.initialLiked);
  const [count, setCount] = useState(props.initialCount);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    const res = await fetch(`/api/posts/${props.postId}/like`, {
      method: nextLiked ? "POST" : "DELETE",
    }).catch(() => null);

    if (!res || !res.ok) {
      setLiked(prevLiked);
      setCount(prevCount);
      push("Could not update like right now.", "error");
    } else {
      const data = (await res.json().catch(() => null)) as { likes?: number } | null;
      if (data?.likes !== undefined) setCount(data.likes);
    }

    setLoading(false);
  }, [count, liked, loading, props.postId, push]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-60"
      disabled={loading}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      <span>{liked ? "Liked" : "Like"}</span>
      <span className="text-foreground/60">({count})</span>
    </button>
  );
}

