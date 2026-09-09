import { AuthForm } from "@/components/shared/auth-form";

export default function LoginPage() {
  return (
    <section className="w-full max-w-md">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Welcome back
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Log in to Beauty Connect
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Continue to your worker, employer, or admin workspace.
      </p>
      <div className="mt-8">
        <AuthForm mode="login" />
      </div>
    </section>
  );
}
