import { AuthForm } from "@/components/shared/auth-form";

export default function SignupPage() {
  return (
    <section className="w-full max-w-md">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Make your next move
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Create your account
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Choose your path after signing up. Admin access is assigned internally.
      </p>
      <div className="mt-8">
        <AuthForm mode="signup" />
      </div>
    </section>
  );
}
