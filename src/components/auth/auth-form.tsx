"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") ?? "").trim() || undefined,
            email: String(form.get("email") ?? "").trim(),
            password: String(form.get("password") ?? ""),
          }
        : {
            email: String(form.get("email") ?? "").trim(),
            password: String(form.get("password") ?? ""),
          };

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error?.message ?? "Request failed.");
      setLoading(false);
      return;
    }

    if (mode === "register") {
      router.push("/login");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "register" ? (
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground/80">Name</label>
          <input
            name="name"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/80">Email</label>
        <input
          name="email"
          required
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/80">Password</label>
        <input
          name="password"
          required
          type="password"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          placeholder="••••••••"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity disabled:opacity-60"
      >
        {loading ? "Please wait…" : mode === "register" ? "Create account" : "Login"}
      </button>
    </form>
  );
}

