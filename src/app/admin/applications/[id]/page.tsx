import Link from "next/link";
import { getAdminWorkerDetails } from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  LinkButton,
  SectionHeading,
  SetupState,
  StatusPill,
} from "@/components/shared/ui";
import { AdminWorkerDetailView } from "@/components/admin/worker-detail";

export default async function AdminApplicationDetailPage({
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
          title="Application not found"
          description="This worker may have been removed or is no longer accessible."
          action={
            <LinkButton href="/admin/applications">
              Back to applications
            </LinkButton>
          }
        />
      );
    return (
      <div className="max-w-4xl">
        <Link
          href="/admin/applications"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to applications
        </Link>
        <div className="mt-6">
          <SectionHeading
            eyebrow="Application review"
            title={detail.worker.full_name}
            description="Review the complete submitted profile before changing its marketplace visibility."
            action={
              <StatusPill
                tone={
                  detail.worker.verification_status === "approved"
                    ? "success"
                    : detail.worker.verification_status === "rejected"
                      ? "danger"
                      : "warning"
                }
              >
                {detail.worker.verification_status.replace("_", " ")}
              </StatusPill>
            }
          />
        </div>
        <AdminWorkerDetailView detail={detail} />
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
