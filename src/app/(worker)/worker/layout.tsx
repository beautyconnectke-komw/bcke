import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { SetupState } from "@/components/shared/ui";
import { getAuthContext } from "@/lib/domain/auth";
import { getUnreadNotificationCount } from "@/lib/domain/beauty-connect";
import { AuthenticationRequiredError } from "@/lib/domain/errors";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { profile } = await getAuthContext();
    if (!profile) redirect("/select-role");
    if (profile.role === null) return <>{children}</>;
    if (profile.role !== "worker")
      redirect(
        profile.role === "employer" ? "/employer/home" : "/admin/dashboard",
      );
    const unreadNotificationCount = await getUnreadNotificationCount();
    return (
      <AppShell
        role="worker"
        displayName={profile.display_name}
        initialUnreadCount={unreadNotificationCount}
      >
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
