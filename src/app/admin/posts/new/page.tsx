import { PostEditor } from "@/components/posts/post-editor";

export default function NewPostPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New post</h1>
        <p className="text-sm text-foreground/70">
          Create a vlog post with optional video embed and thumbnail.
        </p>
      </header>
      <div className="rounded-xl border bg-background/60 p-4">
        <PostEditor mode="create" />
      </div>
    </div>
  );
}

