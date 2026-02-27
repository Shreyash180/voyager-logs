export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
          Voyager Logs
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          A personal vlog platform for long-form stories and reflections.
        </h1>
        <p className="max-w-2xl text-sm text-foreground/70">
          This app is your laboratory for learning real-world web architecture:
          server-side rendered pages, relational data with PostgreSQL, JWT-based
          authentication, and production-minded patterns like rate limiting and
          caching.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-background/60 p-4">
          <h2 className="text-sm font-semibold">Public experience</h2>
          <p className="mt-2 text-xs text-foreground/70">
            Browse vlogs, read long-form reflections, search by title or tags,
            and explore individual stories. This page will evolve into the
            paginated feed of latest posts.
          </p>
        </div>
        <div className="rounded-xl border bg-background/60 p-4">
          <h2 className="text-sm font-semibold">Creator tools</h2>
          <p className="mt-2 text-xs text-foreground/70">
            As the admin, you&apos;ll publish posts with video embeds, photos,
            and writing, manage comments, and see engagement analytics.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-background/60 p-4">
        <h2 className="text-sm font-semibold">What&apos;s next</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-foreground/75">
          <li>Wire up PostgreSQL and Prisma models for users and posts.</li>
          <li>Add JWT-based authentication and role-aware APIs.</li>
          <li>
            Build out the homepage feed, post pages, and admin dashboard on top
            of that foundation.
          </li>
        </ol>
      </section>
    </div>
  );
}
