import { AdminDashboard } from "@/components/admin/admin-dashboard";
import {
  getAdminDashboardData,
  parseDashboardRange,
} from "@/lib/domain/admin-dashboard";
import { getAuthContext } from "@/lib/domain/auth";
import { ErrorState, SetupState } from "@/components/shared/ui";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const range = parseDashboardRange(params.range);

  try {
    const [data, auth] = await Promise.all([
      getAdminDashboardData(range),
      getAuthContext(),
    ]);
    return <AdminDashboard data={data} displayName={auth.profile?.display_name} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "The dashboard could not be loaded.";
    if (message.includes("Supabase environment configuration")) {
      return <SetupState />;
    }
    return <ErrorState message="We could not load the admin analytics right now. Please refresh and try again." />;
  }
}
