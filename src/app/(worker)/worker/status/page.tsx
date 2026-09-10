import {
  getCurrentWorkerProfile,
  getWorkerStatus,
} from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  LinkButton,
  SectionHeading,
  SetupState,
} from "@/components/shared/ui";
import { WorkerStatusTabs } from "@/components/worker/worker-status-tabs";

export default async function WorkerStatusPage() {
  try {
    const [profile, status] = await Promise.all([
      getCurrentWorkerProfile(),
      getWorkerStatus(),
    ]);
    if (!profile)
      return (
        <EmptyState
          title="Your profile is not started"
          description="Complete your worker profile before submitting it for review."
          action={
            <LinkButton href="/worker/onboarding">Start application</LinkButton>
          }
        />
      );
    return (
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Application status"
          title="Know where you stand"
          description="Your application and incoming opportunities live here."
        />
        <div className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Requests
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Incoming from employers
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {status.pending.length + status.accepted.length} total
            </span>
          </div>
          <WorkerStatusTabs
            pending={status.pending}
            accepted={status.accepted}
          />
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
