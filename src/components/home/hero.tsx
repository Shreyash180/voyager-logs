import { NeonButton } from "@/components/ui/neon-button";

export function Hero({
  totalPosts,
  totalUsers,
  todayLabel,
  canWrite,
}: {
  totalPosts: number;
  totalUsers: number;
  todayLabel: string;
  canWrite: boolean;
}) {
  return (
    <section className="hero-border">
      <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-20 left-4 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">{todayLabel}</p>
          <h1 className="max-w-3xl text-3xl font-semibold sm:text-4xl">Welcome to Voyager Logs</h1>
          <p className="max-w-2xl text-sm text-foreground/75 sm:text-base">
            Every explorer leaves a trace. Record your journeys, reflections, and discoveries.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <NeonButton href={canWrite ? "/admin/posts/new" : "/login"}>Start Writing</NeonButton>
            <NeonButton href="/#explore" variant="outline">
              Explore Logs
            </NeonButton>
          </div>
          <div className="grid max-w-xl gap-3 pt-2 sm:grid-cols-2">
            <Stat label="Published logs" value={totalPosts.toLocaleString()} />
            <Stat label="Community members" value={totalUsers.toLocaleString()} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs uppercase tracking-[0.2em] text-foreground/55">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
