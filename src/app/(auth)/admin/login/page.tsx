import { AuthForm } from "@/components/shared/auth-form";

export default function AdminLoginPage() {
  return (
    <section className="w-full max-w-md">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Internal access
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Admin login</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Admin access is assigned internally. This page does not create
        administrator accounts.
      </p>
      <div className="mt-8">
        <AuthForm
          mode="login"
          redirectTo="/admin/dashboard"
          showGoogle={false}
        />
      </div>
    </section>
  );
}
