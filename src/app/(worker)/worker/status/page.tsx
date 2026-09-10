import {
  getCurrentWorkerProfile,
  getWorkerStatus,
} from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  LinkButton,
  SectionHeading,
  SetupState,
  StatCard,
  StatusPill,
} from "@/components/shared/ui";
import { AvailabilityControl } from "@/components/worker/availability-control";
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
    const tone =
      profile.verification_status === "approved"
        ? "success"
        : profile.verification_status === "rejected"
          ? "danger"
          : "warning";
    return (
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Application status"
          title="Know where you stand"
          description="Your application and incoming opportunities live here."
          action={
            <StatusPill tone={tone}>
              {profile.verification_status.replace("_", " ")}
            </StatusPill>
          }
        />
        <section className="mt-7 rounded-2xl border border-[#eee5eb] bg-white p-4 shadow-[0_8px_24px_rgba(31,17,29,0.03)] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Your visibility
              </p>
              <h2 className="mt-1 text-base font-semibold">
                Let employers know when you are open to work
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                This preference helps salons decide when to reach out.
              </p>
            </div>
            <AvailabilityControl value={profile.availability_status} />
          </div>
        </section>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Pending"
            value={status.pending.length}
            detail="Need your response"
          />
          <StatCard
            label="Accepted"
            value={status.accepted.length}
            detail="Active connections"
          />
          <div className="col-span-2 sm:col-span-1">
            <StatCard
              label="Profile status"
              value={formatStatus(profile.verification_status)}
              detail="Review progress"
            />
          </div>
        </div>
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

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
