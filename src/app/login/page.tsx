import { AuthForm } from "@/components/auth/auth-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <p className="text-sm text-foreground/70">
          Use your account to like, comment, and bookmark posts.
        </p>
      </div>
      <div className="glass-panel p-4">
        <AuthForm mode="login" />
      </div>
      <p className="text-sm text-foreground/70">
        New here?{" "}
        <Link href="/register" className="font-medium text-cyan-200 hover:underline">
          Create an account
        </Link>
        .
      </p>
    </div>
  );
}

