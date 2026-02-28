import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-foreground/70">
          Register to join Voyager Logs and interact with posts.
        </p>
      </div>
      <div className="rounded-xl border bg-background/60 p-4">
        <AuthForm mode="register" />
      </div>
      <p className="text-sm text-foreground/70">
        Already have an account?{" "}
        <a href="/login" className="font-medium hover:underline">
          Login
        </a>
        .
      </p>
    </div>
  );
}

