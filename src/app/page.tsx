import { PostCard, type PostCardData } from "@/components/posts/post-card";
import { getBaseUrl } from "@/lib/base-url";
import { Hero } from "@/components/home/hero";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { NeonButton } from "@/components/ui/neon-button";

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string; tag?: string }>;
};

export default async function Home(props: PageProps) {
  const sp = await props.searchParams;
  const page = sp.page ?? "1";
  const q = sp.q ?? "";
  const tag = sp.tag ?? "";

  const baseUrl = await getBaseUrl();
  const url = new URL("/api/posts", baseUrl);
  url.searchParams.set("page", page);
  url.searchParams.set("limit", "10");
  if (q) url.searchParams.set("q", q);
  if (tag) url.searchParams.set("tag", tag);

  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json()) as { posts: PostCardData[]; total: number; hasMore: boolean };
  const [user, totalPostsCount, totalUsersCount] = await Promise.all([
    getCurrentUser(),
    prisma.post.count({ where: { published: true } }),
    prisma.user.count(),
  ]);

  const currentPage = Number(page) || 1;
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <Hero
        totalPosts={totalPostsCount}
        totalUsers={totalUsersCount}
        todayLabel={todayLabel}
        canWrite={Boolean(user && user.role === "ADMIN")}
      />

      <section id="explore" className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Explore recent logs</h2>
        <p className="text-sm text-foreground/70">
          Search, filter by tags, and open a post to watch and read the long-form reflection.
        </p>
      </section>

      <section className="glass-panel p-4">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-foreground/80">Search</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search title or content..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground/80">Tag</label>
            <input
              name="tag"
              defaultValue={tag}
              placeholder="e.g. travel"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <NeonButton className="h-10 px-4">Apply</NeonButton>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.posts?.length ? (
          data.posts.map((p) => <PostCard key={p.id} post={p} />)
        ) : (
          <div className="glass-panel col-span-full p-6 text-sm text-foreground/70">
            No posts yet.
          </div>
        )}
      </section>

      <section className="flex items-center justify-between">
        <a
          className={`rounded-lg border px-3 py-2 text-sm ${
            currentPage <= 1 ? "pointer-events-none opacity-50" : "hover:bg-foreground/5"
          }`}
          href={`/?page=${Math.max(1, currentPage - 1)}&q=${encodeURIComponent(
            q,
          )}&tag=${encodeURIComponent(tag)}`}
        >
          Previous
        </a>
        <span className="text-sm text-foreground/60">
          Page {currentPage} - {data.total ?? 0} total
        </span>
        <a
          className={`rounded-lg border px-3 py-2 text-sm ${
            !data.hasMore ? "pointer-events-none opacity-50" : "hover:bg-foreground/5"
          }`}
          href={`/?page=${currentPage + 1}&q=${encodeURIComponent(q)}&tag=${encodeURIComponent(
            tag,
          )}`}
        >
          Next
        </a>
      </section>
    </div>
  );
}
