"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { NeonButton } from "@/components/ui/neon-button";
import { useToast } from "@/components/ui/toast-provider";

type Mode = "login" | "register";
type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
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
    }).catch(() => null);

    const data = await res?.json().catch(() => null);

    if (!res || !res.ok) {
      const nextFieldErrors: FieldErrors = {};
      const serverFieldErrors = data?.error?.details?.fieldErrors as
        | Record<string, string[]>
        | undefined;

      if (serverFieldErrors && typeof serverFieldErrors === "object") {
        const supportedFields: Array<keyof FieldErrors> = ["name", "email", "password"];
        for (const key of supportedFields) {
          const firstError = serverFieldErrors[key]?.[0];
          if (firstError) nextFieldErrors[key] = firstError;
        }
      }

      setFieldErrors(nextFieldErrors);
      const message = data?.error?.message ?? Object.values(nextFieldErrors)[0] ?? "Request failed.";
      setError(message);
      push(message, "error");
      setLoading(false);
      return;
    }

    if (mode === "register") {
      push("Account created. Please login.", "success");
      router.push("/login");
    } else {
      push("Login successful.", "success");
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
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/20"
            placeholder="Your name"
            autoComplete="name"
          />
          {fieldErrors.name ? <p className="text-xs text-red-200">{fieldErrors.name}</p> : null}
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/80">Email</label>
        <input
          name="email"
          required
          className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/20"
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
        />
        {fieldErrors.email ? <p className="text-xs text-red-200">{fieldErrors.email}</p> : null}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/80">Password</label>
        <input
          name="password"
          required
          type="password"
          className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/20"
          placeholder="********"
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
        />
        {mode === "register" ? (
          <p className="text-xs text-foreground/70">Use at least 8 characters.</p>
        ) : null}
        {fieldErrors.password ? <p className="text-xs text-red-200">{fieldErrors.password}</p> : null}
      </div>

      {error ? <p className="rounded-lg border border-red-400/35 bg-red-500/10 p-2 text-sm text-red-200">{error}</p> : null}

      <NeonButton
        type="submit"
        disabled={loading}
        className="h-10 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Please wait..." : mode === "register" ? "Create account" : "Login"}
      </NeonButton>
    </form>
  );
}
