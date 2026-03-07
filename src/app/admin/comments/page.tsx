import { prisma } from "@/lib/prisma";
import { parsePagination } from "@/lib/pagination";
import { AdminDeleteCommentButton } from "@/components/comments/admin-delete-comment-button";

export const runtime = "nodejs";

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function AdminCommentsPage(props: PageProps) {
  const sp = await props.searchParams;
  const searchParams = new URLSearchParams();
  if (sp.page) searchParams.set("page", sp.page);
  if (sp.q) searchParams.set("q", sp.q);
  const { page, skip, take } = parsePagination(searchParams);
  const q = sp.q?.trim() ?? "";

  const where = q
    ? {
        OR: [
          { content: { contains: q, mode: "insensitive" as const } },
          { user: { email: { contains: q, mode: "insensitive" as const } } },
          { post: { title: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [total, comments] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        post: { select: { title: true, slug: true } },
      },
    }),
  ]);

  const hasMore = skip + comments.length < total;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Manage comments</h1>
        <p className="text-sm text-foreground/70">
          Moderate community comments and remove spam quickly.
        </p>
      </header>

      <section className="rounded-xl border bg-background/60 p-4">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-foreground/80">Search comments</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by post, author email, or content"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <button className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background">
            Apply
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background/60">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-xs text-foreground/60">
              <tr>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {comments.length ? (
                comments.map((comment) => (
                  <tr key={comment.id} className="border-b last:border-b-0 align-top">
                    <td className="px-4 py-3">
                      <a href={`/posts/${comment.post.slug}`} className="font-medium hover:underline">
                        {comment.post.title}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-foreground/70">
                        {comment.user.name ?? "Unknown user"}
                      </div>
                      <div className="text-xs text-foreground/60">{comment.user.email}</div>
                    </td>
                    <td className="max-w-xl px-4 py-3 text-foreground/80">
                      <p className="line-clamp-4 whitespace-pre-wrap">{comment.content}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/60">
                      {new Date(comment.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AdminDeleteCommentButton commentId={comment.id} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-foreground/60" colSpan={5}>
                    No comments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex items-center justify-between">
        <a
          className={`rounded-lg border px-3 py-2 text-sm ${
            page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-foreground/5"
          }`}
          href={`/admin/comments?page=${Math.max(1, page - 1)}&q=${encodeURIComponent(q)}`}
        >
          Previous
        </a>
        <span className="text-sm text-foreground/60">
          Page {page} - {total} total
        </span>
        <a
          className={`rounded-lg border px-3 py-2 text-sm ${
            !hasMore ? "pointer-events-none opacity-50" : "hover:bg-foreground/5"
          }`}
          href={`/admin/comments?page=${page + 1}&q=${encodeURIComponent(q)}`}
        >
          Next
        </a>
      </section>
    </div>
  );
}
