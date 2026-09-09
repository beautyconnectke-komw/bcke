import Link from "next/link";
import { getAdminWorkers } from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  SectionHeading,
  SetupState,
  StatusPill,
} from "@/components/shared/ui";
import { WorkerReviewActions } from "@/components/admin/admin-actions";

export default async function AdminApplicationsPage() {
  try {
    const workers = (await getAdminWorkers()).filter(
      (worker) => worker.verification_status === "pending_review",
    );
    return (
      <div>
        <SectionHeading
          eyebrow="Moderation"
          title="Worker applications"
          description="Review the people waiting to become visible in the marketplace."
        />
        <div className="mt-8 grid gap-3">
          {workers.map((worker) => (
            <article
              key={worker.id}
              className="border border-border bg-background p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/admin/applications/${worker.id}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {worker.full_name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {worker.location || "Location not shared"} ·{" "}
                    {worker.years_experience} years experience
                  </p>
                </div>
                <StatusPill tone="warning">Pending review</StatusPill>
              </div>
              <div className="mt-5">
                <WorkerReviewActions
                  workerId={worker.id}
                  status={worker.verification_status}
                />
              </div>
            </article>
          ))}
          {workers.length === 0 ? (
            <EmptyState
              title="The review queue is clear."
              description="New worker applications will appear here."
            />
          ) : null}
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
