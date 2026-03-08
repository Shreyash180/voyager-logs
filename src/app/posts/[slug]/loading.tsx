export default function PostLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-foreground/12" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-foreground/12" />
        <div className="h-4 w-56 animate-pulse rounded bg-foreground/10" />
      </div>

      <div className="aspect-video animate-pulse rounded-xl border bg-foreground/8" />
      <div className="h-40 animate-pulse rounded-xl border bg-foreground/8" />
      <div className="h-32 animate-pulse rounded-xl border bg-foreground/8" />
    </div>
  );
}
