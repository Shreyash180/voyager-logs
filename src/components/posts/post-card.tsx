import type { Tag } from "@prisma/client";

export type PostCardData = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  createdAt: string | Date;
  views: number;
  tags: Tag[];
  _count?: { likes: number; comments: number; bookmarks: number };
};

export function PostCard({ post }: { post: PostCardData }) {
  const created =
    typeof post.createdAt === "string" ? new Date(post.createdAt) : post.createdAt;

  return (
    <article className="group overflow-hidden rounded-xl border bg-background/60">
      <a href={`/posts/${post.slug}`} className="block">
        <div className="aspect-[16/9] w-full bg-foreground/5">
          {post.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-foreground/50">
              No thumbnail
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <h2 className="line-clamp-2 text-base font-semibold tracking-tight">
            {post.title}
          </h2>
          <div className="flex flex-wrap gap-2">
            {post.tags?.slice(0, 4).map((t) => (
              <span
                key={t.id}
                className="rounded-full border px-2 py-0.5 text-[11px] text-foreground/70"
              >
                {t.name}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-foreground/60">
            <span>{created.toLocaleDateString()}</span>
            <span>{post.views} views</span>
          </div>
        </div>
      </a>
    </article>
  );
}

