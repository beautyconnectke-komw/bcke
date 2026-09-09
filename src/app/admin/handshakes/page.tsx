import { getAdminHandshakes } from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  SectionHeading,
  SetupState,
  StatusPill,
} from "@/components/shared/ui";
import { formatDate } from "@/lib/utils";

export default async function AdminHandshakesPage() {
  try {
    const handshakes = await getAdminHandshakes();
    return (
      <div>
        <SectionHeading
          eyebrow="Connections"
          title="Handshakes"
          description="Monitor mutual connections without manually changing their state."
        />
        <div className="mt-8 grid gap-3">
          {handshakes.map((handshake) => (
            <article
              key={handshake.id}
              className="flex flex-wrap items-center justify-between gap-4 border border-border bg-background p-5"
            >
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {handshake.id}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Created {formatDate(handshake.created_at)}
                </p>
              </div>
              <div className="text-right">
                <StatusPill
                  tone={
                    handshake.status === "completed" ? "success" : "warning"
                  }
                >
                  {handshake.status}
                </StatusPill>
                <p className="mt-2 text-xs text-muted-foreground">
                  Worker {handshake.worker_profile_id.slice(0, 8)} · Employer{" "}
                  {handshake.employer_profile_id.slice(0, 8)}
                </p>
              </div>
            </article>
          ))}
          {handshakes.length === 0 ? (
            <EmptyState
              title="No handshakes yet"
              description="Mutual worker connections will appear here."
            />
          ) : null}
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
