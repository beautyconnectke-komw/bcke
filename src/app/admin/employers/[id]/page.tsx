import { getAdminEmployers } from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  LinkButton,
  SectionHeading,
  SetupState,
  StatusPill,
} from "@/components/shared/ui";
import { Button } from "@/components/shared/ui";

export default async function AdminEmployerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const employer = (await getAdminEmployers()).find((item) => item.id === id);
    if (!employer)
      return (
        <EmptyState
          title="Employer not found"
          description="This profile is not available."
          action={
            <LinkButton href="/admin/employers">Back to employers</LinkButton>
          }
        />
      );
    return (
      <div className="max-w-4xl">
        <SectionHeading
          eyebrow="Employer record"
          title={employer.business_name}
          description="Keep business access and public profile information under review."
          action={
            <StatusPill tone={employer.is_suspended ? "danger" : "success"}>
              {employer.is_suspended ? "Suspended" : "Active"}
            </StatusPill>
          }
        />
        <div className="mt-8 grid gap-6 border border-border bg-background p-6">
          <Detail label="Contact person" value={employer.contact_person} />
          <Detail label="Email" value={employer.business_email} />
          <Detail label="Phone" value={employer.phone} />
          <Detail label="Location" value={employer.location} />
          <Detail label="Description" value={employer.description} />
          <div className="border-t border-border pt-5">
            <EmployerActions
              employerId={employer.id}
              suspended={employer.is_suspended}
            />
          </div>
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
        {value || "Not provided"}
      </p>
    </div>
  );
}
async function EmployerActions({
  employerId,
  suspended,
}: {
  employerId: string;
  suspended: boolean;
}) {
  const { suspendEmployerAction, restoreEmployerAction } =
    await import("@/app/actions/beauty-connect");
  return (
    <form
      action={async () => {
        if (suspended) await restoreEmployerAction(employerId);
        else
          await suspendEmployerAction({
            employerProfileId: employerId,
            reason: "Suspended by administrator.",
          });
      }}
    >
      <Button type="submit" variant={suspended ? "secondary" : "danger"}>
        {suspended ? "Restore employer" : "Suspend employer"}
      </Button>
    </form>
  );
}
