import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/server";
import { PrivateLogCard } from "@/components/posts/private-log-card";
import { NeonButton } from "@/components/ui/neon-button";

export const runtime = "nodejs";

export default async function PrivateLogsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      thumbnailUrl: true,
      isPublic: true,
      isApproved: true,
      publishedByAdmin: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Your Private Logs</h1>
          <p className="text-sm text-foreground/70">
            Draft, review, and published status of your voyager logs.
          </p>
        </div>
        <NeonButton href="/dashboard/private-logs/new">Start Writing</NeonButton>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.length ? (
          posts.map((post) => <PrivateLogCard key={post.id} post={post} />)
        ) : (
          <div className="glass-panel col-span-full p-6 text-sm text-foreground/70">
            You have not created any logs yet.
          </div>
        )}
      </section>
    </div>
  );
}
