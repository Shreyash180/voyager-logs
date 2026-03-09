import Link from "next/link";

type PrivateLogCardData = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string;
  thumbnailUrl: string | null;
  createdAt: string | Date;
  isPublic: boolean;
  isApproved: boolean;
  publishedByAdmin: boolean;
};

function getStatus(post: Pick<PrivateLogCardData, "isPublic" | "isApproved" | "publishedByAdmin">) {
  if (post.isPublic && post.isApproved && post.publishedByAdmin) return "Published";
  if (!post.isApproved) return "Under Review";
  return "Private";
}

function estimateReadMinutes(text?: string | null) {
  if (!text) return 1;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function PrivateLogCard({ post }: { post: PrivateLogCardData }) {
  const created = typeof post.createdAt === "string" ? new Date(post.createdAt) : post.createdAt;
  const status = getStatus(post);
  const readMin = estimateReadMinutes(post.content ?? post.excerpt);

  return (
    <article className="neon-card group">
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
          {readMin} min read
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="line-clamp-2 text-lg font-semibold tracking-tight">
            <Link href={`/posts/${post.slug}`} className="hover:underline">
              {post.title}
            </Link>
          </h2>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-foreground/75">{status}</span>
        </div>

        {post.excerpt ? <p className="line-clamp-2 text-sm text-foreground/72">{post.excerpt}</p> : null}

        <div className="flex items-center justify-between text-xs text-foreground/62">
          <span>{created.toLocaleDateString()}</span>
          <div className="flex items-center gap-3">
            <Link href={`/posts/${post.slug}`} className="hover:underline">
              Open
            </Link>
            <Link href={`/dashboard/private-logs/${post.id}/edit`} className="hover:underline">
              Edit
            </Link>
            {status === "Published" ? (
              <Link href={`/posts/${post.slug}`} className="hover:underline">
                View
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
