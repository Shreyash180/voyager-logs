import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "../components/theme-toggle";
import { getCurrentUser } from "@/lib/auth/server";
import { LogoutButton } from "@/components/auth/logout-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased page-container bg-background text-foreground`}
      >
        <header className="border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/70">
                Voyager
              </span>
              <span className="text-sm text-foreground/60">Logs</span>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/" className="hover:underline">
                Home
              </a>
              {user ? (
                <>
                  <a href="/profile" className="hover:underline">
                    Profile
                  </a>
                  {user.role === "ADMIN" ? (
                    <a href="/admin" className="hidden hover:underline md:inline">
                      Admin
                    </a>
                  ) : null}
                  <LogoutButton />
                </>
              ) : (
                <>
                  <a href="/login" className="hover:underline">
                    Login
                  </a>
                  <a href="/register" className="hidden hover:underline md:inline">
                    Register
                  </a>
                </>
              )}
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="page-main">
          <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
        </main>
        <footer className="page-footer border-t bg-background/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-xs text-foreground/60">
            <span>© {new Date().getFullYear()} Voyager Logs.</span>
            <span>Built with Next.js & PostgreSQL.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
