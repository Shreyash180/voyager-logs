import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [likes, bookmarks, comments] = await Promise.all([
    prisma.like.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { post: { select: { id: true, title: true, slug: true, createdAt: true } } },
    }),
    prisma.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { post: { select: { id: true, title: true, slug: true, createdAt: true } } },
    }),
    prisma.comment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        content: true,
        createdAt: true,
        post: { select: { id: true, title: true, slug: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-foreground/70">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-background/60 p-4">
          <h2 className="text-sm font-semibold">Likes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {likes.length ? (
              likes.map((l) => (
                <li key={l.post.id}>
                  <a className="hover:underline" href={`/posts/${l.post.slug}`}>
                    {l.post.title}
                  </a>
                  <div className="text-xs text-foreground/60">
                    {new Date(l.post.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))
            ) : (
              <li className="text-foreground/60">No likes yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border bg-background/60 p-4">
          <h2 className="text-sm font-semibold">Bookmarks</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {bookmarks.length ? (
              bookmarks.map((b) => (
                <li key={b.post.id}>
                  <a className="hover:underline" href={`/posts/${b.post.slug}`}>
                    {b.post.title}
                  </a>
                  <div className="text-xs text-foreground/60">
                    {new Date(b.post.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))
            ) : (
              <li className="text-foreground/60">No bookmarks yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border bg-background/60 p-4">
          <h2 className="text-sm font-semibold">Recent comments</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {comments.length ? (
              comments.map((c) => (
                <li key={c.id} className="space-y-1">
                  <a className="text-xs font-medium hover:underline" href={`/posts/${c.post.slug}`}>
                    {c.post.title}
                  </a>
                  <div className="text-xs text-foreground/60">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-3">{c.content}</p>
                </li>
              ))
            ) : (
              <li className="text-foreground/60">No comments yet.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

