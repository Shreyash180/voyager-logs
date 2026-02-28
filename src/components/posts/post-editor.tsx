"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Mode = "create" | "edit";

export function PostEditor(props: {
  mode: Mode;
  postId?: string;
  initial?: {
    title: string;
    content: string;
    videoUrl?: string | null;
    thumbnailUrl?: string | null;
    tags?: { name: string }[];
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(props.initial?.title ?? "");
  const [content, setContent] = useState(props.initial?.content ?? "");
  const [videoUrl, setVideoUrl] = useState(props.initial?.videoUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(props.initial?.thumbnailUrl ?? "");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [tags, setTags] = useState((props.initial?.tags ?? []).map((t) => t.name).join(", "));

  useEffect(() => {
    setTitle(props.initial?.title ?? "");
    setContent(props.initial?.content ?? "");
    setVideoUrl(props.initial?.videoUrl ?? "");
    setThumbnailUrl(props.initial?.thumbnailUrl ?? "");
    setTags((props.initial?.tags ?? []).map((t) => t.name).join(", "));
  }, [props.initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      title,
      content,
      videoUrl,
      thumbnailUrl,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const res =
      props.mode === "create"
        ? await fetch("/api/posts", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/posts/${props.postId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error?.message ?? "Save failed.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
    setLoading(false);
  };

  const remove = async () => {
    if (!props.postId) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/posts/${props.postId}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error?.message ?? "Delete failed.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
    setLoading(false);
  };

  const uploadThumbnail = async () => {
    if (!thumbnailFile || uploading) return;
    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append("file", thumbnailFile);

    const res = await fetch("/api/admin/uploads", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error?.message ?? "Upload failed.");
      setUploading(false);
      return;
    }

    setThumbnailUrl(data?.image?.url ?? "");
    setThumbnailFile(null);
    setUploading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/80">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/80">Video URL</label>
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/embed/..."
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/80">Thumbnail URL (S3 / CDN)</label>
        <input
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
            className="text-xs"
          />
          <button
            type="button"
            onClick={uploadThumbnail}
            disabled={!thumbnailFile || uploading}
            className="inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium hover:bg-foreground/5 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload thumbnail"}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/80">Tags (comma-separated)</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="travel, india, reflection"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/80">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={12}
          className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
          disabled={loading || uploading}
        >
          {loading ? "Saving..." : props.mode === "create" ? "Create post" : "Save changes"}
        </button>
        {props.mode === "edit" ? (
          <button
            type="button"
            onClick={remove}
            className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            disabled={loading || uploading}
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
