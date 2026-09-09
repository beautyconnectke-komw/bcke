import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { SetupState } from "@/components/shared/ui";
import { getAuthContext } from "@/lib/domain/auth";
import { AuthenticationRequiredError } from "@/lib/domain/errors";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { profile } = await getAuthContext();
    if (!profile) redirect("/select-role");
    if (profile.role === null) return <>{children}</>;
    if (profile.role !== "employer")
      redirect(profile.role === "worker" ? "/worker/home" : "/admin/dashboard");
    return (
      <AppShell role="employer" displayName={profile.display_name}>
        {children}
      </AppShell>
    );
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/login");
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <SetupState />
      </main>
    );
  }
}
