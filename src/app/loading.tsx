export default function RootLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded bg-foreground/15" />
        <div className="h-4 w-80 animate-pulse rounded bg-foreground/10" />
      </div>

      <div className="glass-panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="h-10 flex-1 animate-pulse rounded bg-foreground/10" />
          <div className="h-10 w-40 animate-pulse rounded bg-foreground/10" />
          <div className="h-10 w-24 animate-pulse rounded bg-foreground/10" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-panel overflow-hidden">
            <div className="aspect-[16/9] animate-pulse bg-foreground/10" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-4/5 animate-pulse rounded bg-foreground/10" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
