import { getAdminWorkerDetails } from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  LinkButton,
  SectionHeading,
  SetupState,
} from "@/components/shared/ui";
import { AdminWorkerDetailView } from "@/components/admin/worker-detail";

export default async function AdminWorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const detail = await getAdminWorkerDetails(id);
    if (!detail)
      return (
        <EmptyState
          title="Worker not found"
          description="This profile is not available."
          action={
            <LinkButton href="/admin/workers">Back to workers</LinkButton>
          }
        />
      );
    return (
      <div className="max-w-4xl">
        <SectionHeading
          eyebrow="Worker record"
          title={detail.worker.full_name}
          description="Review everything submitted in the worker application before making a moderation decision."
        />
        <AdminWorkerDetailView detail={detail} />
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
