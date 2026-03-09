import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";

import { BookmarkButton } from "@/components/posts/bookmark-button";
import { LikeButton } from "@/components/posts/like-button";
import { getBaseUrl } from "@/lib/base-url";
import { TagPill } from "@/components/ui/tag-pill";
import { PostViewTracker } from "@/components/posts/post-view-tracker";

const CommentSection = dynamic(
  () => import("@/components/comments/comment-section").then((m) => m.CommentSection),
  {
    loading: () => (
      <section className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-foreground/15" />
        <div className="h-28 animate-pulse rounded-xl border bg-foreground/8" />
      </section>
    ),
  },
);

type PageProps = { params: Promise<{ slug: string }> };

async function fetchPost(slug: string) {
  const baseUrl = await getBaseUrl();
  const url = new URL(`/api/posts/${encodeURIComponent(slug)}`, baseUrl);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const parsed = await res.json().catch(() => null);
  if (!parsed || typeof parsed !== "object") return null;
  return parsed as {
    post: {
      id: string;
      title: string;
      slug: string;
      excerpt?: string | null;
      content: string;
      published: boolean;
      videoUrl: string | null;
      thumbnailUrl: string | null;
      views: number;
      createdAt: string;
      updatedAt: string;
      author: { id: string; name: string | null };
      tags: { id: string; name: string; slug: string }[];
      _count: { likes: number; comments: number; bookmarks: number };
    };
    viewer: { liked: boolean; bookmarked: boolean };
  };
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const data = await fetchPost(slug);
  if (!data) return { title: "Post not found | Voyager Logs" };

  return {
    title: `${data.post.title} | Voyager Logs`,
    description: data.post.content.slice(0, 160),
    openGraph: {
      title: data.post.title,
      description: data.post.content.slice(0, 160),
      images: data.post.thumbnailUrl ? [data.post.thumbnailUrl] : [],
    },
  };
}

export default async function PostPage(props: PageProps) {
  const { slug } = await props.params;
  const data = await fetchPost(slug);

  if (!data) {
    return (
      <div className="glass-panel p-6">
        <h1 className="text-xl font-semibold">Post not found</h1>
        <p className="mt-2 text-sm text-foreground/70">
          The post you are looking for does not exist (or has not been published yet).
        </p>
        <Link href="/" className="mt-4 inline-flex text-sm font-medium hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const { post, viewer } = data;

  return (
    <div className="space-y-8">
      <PostViewTracker slug={post.slug} />
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {post.tags.map((t) => (
            <TagPill key={t.id} name={t.name} href={`/?tag=${encodeURIComponent(t.slug)}`} />
          ))}
        </div>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/60">
          <span>By {post.author.name ?? "Admin"}</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          <span>{post.views} views</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <LikeButton postId={post.id} initialLiked={viewer.liked} initialCount={post._count.likes} />
          <BookmarkButton
            postId={post.id}
            initialBookmarked={viewer.bookmarked}
            initialCount={post._count.bookmarks}
          />
        </div>
      </header>

      {post.videoUrl ? (
        <section className="glass-panel overflow-hidden bg-black">
          <div className="aspect-video w-full">
            <iframe
              src={post.videoUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}

      {post.thumbnailUrl ? (
        <section className="glass-panel overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full object-cover"
          />
        </section>
      ) : null}

      <section className="glass-panel p-5">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </section>

      <CommentSection postId={post.id} />
    </div>
  );
}
