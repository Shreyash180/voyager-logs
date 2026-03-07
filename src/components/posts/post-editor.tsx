"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { NeonButton } from "@/components/ui/neon-button";
import { ThumbnailUploader } from "@/components/posts/thumbnail-uploader";

type Mode = "create" | "edit";

export function PostEditor(props: {
  mode: Mode;
  postId?: string;
  initial?: {
    title: string;
    excerpt?: string | null;
    content: string;
    videoUrl?: string | null;
    thumbnailUrl?: string | null;
    published?: boolean;
    tags?: { name: string }[];
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(props.initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(props.initial?.excerpt ?? "");
  const [content, setContent] = useState(props.initial?.content ?? "");
  const [videoUrl, setVideoUrl] = useState(props.initial?.videoUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(props.initial?.thumbnailUrl ?? "");
  const [published, setPublished] = useState(props.initial?.published ?? true);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [tags, setTags] = useState((props.initial?.tags ?? []).map((t) => t.name).join(", "));

  const parsedVideoEmbed = useMemo(() => {
    if (!videoUrl) return null;
    const value = videoUrl.trim();
    if (!value) return null;

    if (value.includes("youtube.com/watch?v=")) {
      const id = new URL(value).searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (value.includes("youtu.be/")) {
      const id = value.split("youtu.be/")[1]?.split(/[?&]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return value;
  }, [videoUrl]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError("Title should be at least 3 characters.");
      return;
    }
    if (content.trim().length < 10) {
      setError("Content should be at least 10 characters.");
      return;
    }

    setLoading(true);

    const payload = {
      title,
      excerpt,
      content,
      videoUrl,
      thumbnailUrl,
      published,
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
    if (!thumbnailFile.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (thumbnailFile.size > 5 * 1024 * 1024) {
      setError("Thumbnail must be 5MB or smaller.");
      return;
    }

    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append("file", thumbnailFile);

    try {
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
      return;
    }
    catch {
      setError("Upload request failed. Check server status and try again.");
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium text-foreground/80">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground/80">Tags (comma-separated)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="travel, reflection"
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/20"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/80">Excerpt</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          maxLength={320}
          placeholder="Short summary used in cards/search snippets"
          className="w-full resize-y rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/20"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground/80">Video URL</label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/20"
          />
          <div className="glass-panel overflow-hidden rounded-xl">
            <div className="aspect-video w-full">
              {parsedVideoEmbed ? (
                <iframe
                  src={parsedVideoEmbed}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-foreground/55">
                  Video preview
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/80">Thumbnail URL</label>
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/20"
            />
          </div>
          <ThumbnailUploader
            file={thumbnailFile}
            previewUrl={thumbnailUrl}
            onFileChange={setThumbnailFile}
            onUpload={uploadThumbnail}
            uploading={uploading}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/80">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={12}
          className="w-full resize-y rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/20"
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-foreground/80">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-white/30 bg-black/20"
        />
        Published
      </label>

      {error ? <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-200">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <NeonButton className="h-10 px-4 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading || uploading}>
          {loading ? "Saving..." : props.mode === "create" ? "Create post" : "Save changes"}
        </NeonButton>
        {props.mode === "edit" ? (
          <button
            type="button"
            onClick={remove}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-red-300/35 px-4 text-sm font-medium text-red-200 hover:bg-red-500/15 disabled:opacity-60"
            disabled={loading || uploading}
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
