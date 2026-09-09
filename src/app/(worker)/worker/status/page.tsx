import Link from "next/link";
import {
  getCurrentWorkerProfile,
  getWorkerStatus,
} from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  LinkButton,
  SectionHeading,
  SetupState,
  StatusPill,
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
        <section className="mt-8 border border-border bg-background p-6">
          <h2 className="text-lg font-semibold">
            {profile.verification_status === "draft"
              ? "Your profile is not yet submitted."
              : profile.verification_status === "pending_review"
                ? "Your profile is waiting for review."
                : profile.verification_status === "approved"
                  ? "Your profile is approved and visible to employers."
                  : "Your profile needs changes before it can be approved."}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {profile.verification_status === "approved"
              ? "Approved workers can receive requests from employers. Keep your availability up to date as your plans change."
              : "You can continue shaping your profile at any time. It will not appear in the marketplace until it has been approved."}
          </p>
          {profile.verification_status !== "pending_review" &&
          profile.verification_status !== "approved" ? (
            <Link
              href="/worker/onboarding"
              className="mt-5 inline-flex text-sm font-medium underline underline-offset-4"
            >
              Continue application -&gt;
            </Link>
          ) : null}
        </section>
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
