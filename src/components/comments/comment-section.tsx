"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

type CommentNode = {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  user: { id: string; name: string | null };
  children: CommentNode[];
};

const CommentItem = memo(function CommentItem({
  node,
  depth,
  onReply,
}: {
  node: CommentNode;
  depth: number;
  onReply: (parentId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border bg-background/60 p-3">
        <div className="flex items-center justify-between text-xs text-foreground/60">
          <span>{node.user.name ?? "Anonymous"}</span>
          <span>{new Date(node.createdAt).toLocaleString()}</span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm">{node.content}</p>
        <button
          type="button"
          onClick={() => onReply(node.id)}
          className="mt-2 text-xs font-medium text-foreground/70 hover:underline"
        >
          Reply
        </button>
      </div>
      {node.children?.length ? (
        <div className="space-y-3" style={{ marginLeft: Math.min(24, depth * 12) }}>
          {node.children.map((c) => (
            <CommentItem key={c.id} node={c} depth={depth + 1} onReply={onReply} />
          ))}
        </div>
      ) : null}
    </div>
  );
});

export function CommentSection({ postId }: { postId: string }) {
  const { push } = useToast();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/posts/${postId}/comments`, { cache: "no-store" }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res || !res.ok) {
      const message = data?.error?.message ?? "Failed to load comments.";
      setError(message);
      push(message, "error");
      setLoading(false);
      return;
    }
    setComments(data.comments ?? []);
    setLoading(false);
  }, [postId, push]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (Date.now() < cooldownUntil) {
      const message = "Please wait a few seconds before posting again.";
      setError(message);
      push(message, "error");
      return;
    }

    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, parentId, website }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res || !res.ok) {
      const message = data?.error?.message ?? "Failed to post comment.";
      setError(message);
      push(message, "error");
      return;
    }

    setContent("");
    setWebsite("");
    setParentId(null);
    setCooldownUntil(Date.now() + 3_000);
    push("Comment posted.", "success");
    await load();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Comments</h2>
        <button
          type="button"
          onClick={load}
          className="text-xs font-medium text-foreground/70 hover:underline"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-xl border bg-background/60 p-4">
        <div className="text-xs text-foreground/60">
          {parentId ? (
            <div className="flex items-center justify-between">
              <span>Replying to a comment</span>
              <button
                type="button"
                className="font-medium hover:underline"
                onClick={() => setParentId(null)}
              >
                Cancel reply
              </button>
            </div>
          ) : (
            <span>Write a comment</span>
          )}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          placeholder="Share your thoughts..."
        />
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background">
          Post comment
        </button>
        <p className="text-xs text-foreground/60">Tip: if posting fails, you may need to login first.</p>
      </form>

      {loading ? (
        <p className="text-sm text-foreground/60">Loading...</p>
      ) : comments.length ? (
        <div className="space-y-3">
          {comments.map((c) => (
            <CommentItem key={c.id} node={c} depth={1} onReply={(id) => setParentId(id)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-foreground/60">No comments yet.</p>
      )}
    </section>
  );
}
