import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export default async function AdminPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      slug: true,
      views: true,
      createdAt: true,
      _count: { select: { likes: true, comments: true, bookmarks: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-foreground/70">
            Create and manage posts, and view engagement stats.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="/admin/comments" className="font-medium hover:underline">
              Manage comments
            </a>
            <a href="/admin/users" className="font-medium hover:underline">
              Manage users
            </a>
          </div>
        </div>
        <a
          href="/admin/posts/new"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background"
        >
          New post
        </a>
      </header>

      <section className="overflow-hidden rounded-xl border bg-background/60">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-xs text-foreground/60">
              <tr>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Likes</th>
                <th className="px-4 py-3">Comments</th>
                <th className="px-4 py-3">Bookmarks</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {posts.length ? (
                posts.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-foreground/60">/{p.slug}</div>
                    </td>
                    <td className="px-4 py-3">{p.views}</td>
                    <td className="px-4 py-3">{p._count.likes}</td>
                    <td className="px-4 py-3">{p._count.comments}</td>
                    <td className="px-4 py-3">{p._count.bookmarks}</td>
                    <td className="px-4 py-3 text-xs text-foreground/60">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        className="text-xs font-medium hover:underline"
                        href={`/admin/posts/${p.id}/edit`}
                      >
                        Edit
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-foreground/60" colSpan={7}>
                    No posts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

