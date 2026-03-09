import { redirect } from "next/navigation";

import { PostEditor } from "@/components/posts/post-editor";
import { getCurrentUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export default async function NewPrivateLogPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">New voyager log</h1>
        <p className="text-sm text-foreground/70">
          New user logs are private by default and sent for admin review when submitted.
        </p>
      </header>
      <div className="glass-panel p-4">
        <PostEditor
          mode="create"
          redirectPath="/dashboard/private-logs"
          showPublishedToggle
          publishedLabel="Request public publish (admin review)"
        />
      </div>
    </div>
  );
}
