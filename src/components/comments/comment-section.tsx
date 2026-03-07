"use client";

import { useEffect, useState } from "react";

type CommentNode = {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  user: { id: string; name: string | null };
  children: CommentNode[];
};

function CommentItem({
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
}

export function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/posts/${postId}/comments`, { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error?.message ?? "Failed to load comments.");
      setLoading(false);
      return;
    }
    setComments(data.comments ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, parentId }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error?.message ?? "Failed to post comment.");
      return;
    }

    setContent("");
    setParentId(null);
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
