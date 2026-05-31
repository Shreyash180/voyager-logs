import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/server";
import { PostEditor } from "@/components/posts/post-editor";
import { normalizeLegacyPostContent } from "@/lib/markdown";

export const runtime = "nodejs";

export default async function EditPrivateLogPage(props: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await props.params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      isPublic: true,
      publishedByAdmin: true,
      title: true,
      excerpt: true,
      content: true,
      videoUrl: true,
      thumbnailUrl: true,
      published: true,
      tags: { select: { tag: { select: { name: true } } } },
    },
  });

  if (!post) redirect("/dashboard/private-logs");
  if (post.authorId !== user.id) redirect("/dashboard/private-logs");
  if (post.isPublic || post.publishedByAdmin) redirect("/dashboard/private-logs");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Edit private log</h1>
        <p className="text-sm text-foreground/70">
          Update your private submission before it is published.
        </p>
      </header>
      <div className="glass-panel p-4">
        <PostEditor
          mode="edit"
          postId={post.id}
          redirectPath="/dashboard/private-logs"
          showPublishedToggle
          publishedLabel="Request public publish (admin review)"
          initial={{
            title: post.title,
            excerpt: post.excerpt,
            content: normalizeLegacyPostContent(post.content),
            videoUrl: post.videoUrl,
            thumbnailUrl: post.thumbnailUrl,
            published: post.published,
            tags: post.tags.map((t) => ({ name: t.tag.name })),
          }}
        />
      </div>
    </div>
  );
}
