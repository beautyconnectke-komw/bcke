import Link from "next/link";
import { getAdminEmployers } from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  SectionHeading,
  SetupState,
  StatusPill,
} from "@/components/shared/ui";

export default async function AdminEmployersPage() {
  try {
    const employers = await getAdminEmployers();
    return (
      <div>
        <SectionHeading
          eyebrow="Businesses"
          title="Employers"
          description="Review the salons and businesses using the marketplace."
        />
        <div className="mt-8 grid gap-3">
          {employers.map((employer) => (
            <Link
              key={employer.id}
              href={`/admin/employers/${employer.id}`}
              className="flex flex-wrap items-center justify-between gap-4 border border-border bg-background p-5 hover:border-foreground"
            >
              <div>
                <h2 className="font-semibold">{employer.business_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {employer.location || "Location not shared"}
                </p>
              </div>
              <StatusPill tone={employer.is_suspended ? "danger" : "success"}>
                {employer.is_suspended ? "Suspended" : "Active"}
              </StatusPill>
            </Link>
          ))}
          {employers.length === 0 ? (
            <EmptyState
              title="No employers yet"
              description="Employer profiles will appear here after onboarding."
            />
          ) : null}
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
