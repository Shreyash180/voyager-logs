import Link from "next/link";

import { TagPill } from "@/components/ui/tag-pill";

type PostTag = {
  id: string;
  name: string;
  slug: string;
};

export type PostCardData = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string;
  thumbnailUrl: string | null;
  createdAt: string | Date;
  views: number;
  author?: { id: string; name: string | null } | null;
  tags: PostTag[];
  _count?: { likes: number; comments: number; bookmarks: number };
};

function estimateReadMinutes(text?: string | null) {
  if (!text) return 1;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function PostCard({ post }: { post: PostCardData }) {
  const created = typeof post.createdAt === "string" ? new Date(post.createdAt) : post.createdAt;
  const readMin = estimateReadMinutes(post.content ?? post.excerpt);

  return (
    <article className="neon-card group">
      <Link href={`/posts/${post.slug}`} className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/20">
          {post.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.thumbnailUrl}
              alt={post.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.08]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-foreground/50">
              No thumbnail
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 text-xs text-white/80">
            {post.author?.name ?? "Admin"} | {readMin} min read
          </div>
        </div>

        <div className="space-y-3 p-4">
          <h2 className="line-clamp-2 text-lg font-semibold tracking-tight">{post.title}</h2>

          {post.excerpt ? <p className="line-clamp-2 text-sm text-foreground/72">{post.excerpt}</p> : null}

          <div className="flex flex-wrap gap-2">
            {post.tags?.slice(0, 4).map((t) => (
              <TagPill key={t.id} name={t.name} />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-foreground/62">
            <span>{created.toLocaleDateString()}</span>
            <div className="flex items-center gap-2">
              <span>{post.views} views</span>
              <span>{post._count?.likes ?? 0} likes</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
