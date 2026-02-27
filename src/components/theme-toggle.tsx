"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "voyager-logs-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.remove("light", "dark");

  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
  root.classList.add(effectiveTheme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored ?? "system";

    setTheme(initial);
    applyTheme(initial);
  }, []);

  const handleToggle = () => {
    const nextTheme: Theme =
      theme === "light" ? "dark" : theme === "dark" ? "light" : getSystemTheme();

    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    }
    applyTheme(nextTheme);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-foreground hover:text-background"
      aria-label={isDark ? "Use light mode" : "Use dark mode"}
    >
      <span className="h-2 w-2 rounded-full bg-foreground" />
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

