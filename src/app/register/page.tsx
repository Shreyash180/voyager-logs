import { AuthForm } from "@/components/auth/auth-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-foreground/70">
          Register to join Voyager Logs and interact with posts.
        </p>
      </div>
      <div className="glass-panel p-4">
        <AuthForm mode="register" />
      </div>
      <p className="text-sm text-foreground/70">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-cyan-200 hover:underline">
          Login
        </Link>
        .
      </p>
    </div>
  );
}

