import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <p className="text-sm text-foreground/70">
          Use your account to like, comment, and bookmark posts.
        </p>
      </div>
      <div className="rounded-xl border bg-background/60 p-4">
        <AuthForm mode="login" />
      </div>
      <p className="text-sm text-foreground/70">
        New here?{" "}
        <a href="/register" className="font-medium hover:underline">
          Create an account
        </a>
        .
      </p>
    </div>
  );
}

