import { redirect } from "next/navigation";

import { PostEditor } from "@/components/posts/post-editor";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export default async function EditPostPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      excerpt: true,
      published: true,
      content: true,
      videoUrl: true,
      thumbnailUrl: true,
      tags: { select: { tag: { select: { name: true } } } },
    },
  });

  if (!post) redirect("/admin");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Edit post</h1>
        <p className="text-sm text-foreground/70">
          Update the post content, tags, and media URLs.
        </p>
      </header>
      <div className="glass-panel p-4">
        <PostEditor
          mode="edit"
          postId={post.id}
          initial={{
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
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

