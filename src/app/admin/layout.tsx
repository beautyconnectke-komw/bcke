import { redirect } from "next/navigation";
import { AdminShell } from "@/components/shared/app-shell";
import { SetupState } from "@/components/shared/ui";
import { getAuthContext } from "@/lib/domain/auth";
import { AuthenticationRequiredError } from "@/lib/domain/errors";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { profile } = await getAuthContext();
    if (!profile) redirect("/admin/login");
    if (profile.role !== "admin")
      redirect(profile.role === "worker" ? "/worker/home" : "/employer/home");
    return (
      <AdminShell displayName={profile.display_name}>{children}</AdminShell>
    );
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/admin/login");
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <SetupState />
      </main>
    );
  }
}
