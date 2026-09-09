import { RoleSelector } from "@/components/shared/role-selector";

export default function SelectRolePage() {
  return (
    <section className="w-full max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        One account, one path
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        How will you use Beauty Connect?
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Your choice opens the right onboarding path. It only becomes permanent
        when you submit a worker application or create an employer profile.
      </p>
      <div className="mt-8">
        <RoleSelector />
      </div>
    </section>
  );
}
