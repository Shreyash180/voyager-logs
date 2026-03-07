import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";
import { ThemeToggle } from "../components/theme-toggle";
import { getCurrentUser } from "@/lib/auth/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { NeonButton } from "@/components/ui/neon-button";
import { Avatar } from "@/components/ui/avatar";
import { AuthHeartbeat } from "@/components/auth/auth-heartbeat";

export const metadata: Metadata = {
  title: "Voyager Logs",
  description:
    "Voyager Logs is a personal vlog storytelling platform for long-form video, photos, and reflective writing.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased page-container bg-background text-foreground">
        <header className="border-b border-white/10 bg-[color:var(--surface-strong)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/90">
                Voyager
              </span>
              <span className="text-sm text-foreground/65">Logs</span>
            </div>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/" className="border-b border-transparent pb-0.5 hover:border-cyan-300/70">
                Home
              </Link>
              {user ? (
                <>
                  <Link href="/profile" className="border-b border-transparent pb-0.5 hover:border-cyan-300/70">
                    Profile
                  </Link>
                  {user.role === "ADMIN" ? (
                    <Link
                      href="/admin"
                      className="hidden border-b border-transparent pb-0.5 hover:border-cyan-300/70 md:inline"
                    >
                      Admin
                    </Link>
                  ) : null}
                  {user.role === "ADMIN" ? (
                    <NeonButton href="/admin/posts/new" className="hidden h-9 px-3 text-xs sm:inline-flex">
                      Quick Create
                    </NeonButton>
                  ) : null}
                  <Avatar name={user.name ?? user.email} imageUrl={user.avatarUrl} size="sm" />
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="border-b border-transparent pb-0.5 hover:border-cyan-300/70">
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="hidden border-b border-transparent pb-0.5 hover:border-cyan-300/70 md:inline"
                  >
                    Register
                  </Link>
                </>
              )}
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="page-main">
          {user ? <AuthHeartbeat /> : null}
          <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
        </main>
        <footer className="page-footer border-t border-white/10 bg-[color:var(--surface-strong)]/85">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-xs text-foreground/60">
            <span>Copyright {new Date().getFullYear()} Voyager Logs.</span>
            <span>Built with Next.js & PostgreSQL.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
