import Link from "next/link";
import { getAdminWorkers } from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  SectionHeading,
  SetupState,
  StatusPill,
} from "@/components/shared/ui";

export default async function AdminWorkersPage() {
  try {
    const workers = await getAdminWorkers();
    return (
      <div>
        <SectionHeading
          eyebrow="People"
          title="Workers"
          description="Search and monitor worker profiles across the platform."
        />
        <form className="mt-6">
          <input
            name="search"
            className="field max-w-lg"
            placeholder="Search workers"
          />
        </form>
        <div className="mt-6 grid gap-3">
          {workers.map((worker) => (
            <Link
              key={worker.id}
              href={`/admin/workers/${worker.id}`}
              className="flex flex-wrap items-center justify-between gap-4 border border-border bg-background p-5 hover:border-foreground"
            >
              <div>
                <h2 className="font-semibold">{worker.full_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {worker.category_name || "Speciality not selected"} ·{" "}
                  {[worker.town, worker.county].filter(Boolean).join(", ") ||
                    worker.location ||
                    "Location not shared"}
                </p>
              </div>
              <div className="flex gap-2">
                <StatusPill
                  tone={
                    worker.verification_status === "approved"
                      ? "success"
                      : worker.verification_status === "rejected"
                        ? "danger"
                        : "warning"
                  }
                >
                  {worker.verification_status.replace("_", " ")}
                </StatusPill>
                <StatusPill>{worker.availability_status}</StatusPill>
              </div>
            </Link>
          ))}
          {workers.length === 0 ? (
            <EmptyState
              title="No workers yet"
              description="Worker profiles will appear here after signup."
            />
          ) : null}
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
