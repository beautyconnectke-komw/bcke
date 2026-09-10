import { getEmployerStatus } from "@/lib/domain/beauty-connect";
import { EmployerStatusTabs } from "@/components/employer/employer-status-tabs";
import {
  LinkButton,
  SectionHeading,
  SetupState,
  StatCard,
} from "@/components/shared/ui";

export default async function EmployerStatusPage() {
  try {
    const status = await getEmployerStatus();
    return (
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Employer status"
          title="Your connections"
          description="Track requests waiting for a response and workers you have successfully handshaken with."
          action={
            <LinkButton href="/employer/workers" variant="secondary">
              Find a worker
            </LinkButton>
          }
        />
        <div className="mt-7 grid grid-cols-2 gap-3">
          <StatCard
            label="Pending"
            value={status.pending.length}
            detail="Awaiting a worker response"
          />
          <StatCard
            label="Agreed"
            value={status.agreed.length}
            detail="Confirmed connections"
          />
        </div>
        <EmployerStatusTabs pending={status.pending} agreed={status.agreed} />
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
