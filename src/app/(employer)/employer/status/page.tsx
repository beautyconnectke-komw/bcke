import { Suspense } from "react";
import { getEmployerStatusPage } from "@/lib/domain/beauty-connect";
import { EmployerStatusTabs } from "@/components/employer/employer-status-tabs";
import { LinkButton, SectionHeading, SetupState } from "@/components/shared/ui";

export default async function EmployerStatusPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  try {
    const params = searchParams ? await searchParams : {};
    const requestedPage =
      typeof params.page === "string" ? Number(params.page) : 1;
    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? Math.min(requestedPage, 1000)
        : 1;
    const statusPromise = getEmployerStatusPage(page);
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
        <Suspense fallback={<EmployerStatusFallback />}>
          <EmployerStatusContent statusPromise={statusPromise} />
        </Suspense>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}

async function EmployerStatusContent({
  statusPromise,
}: {
  statusPromise: ReturnType<typeof getEmployerStatusPage>;
}) {
  try {
    const status = await statusPromise;
    return (
      <EmployerStatusTabs
        pending={status.pending}
        agreed={status.agreed}
        declined={status.declined}
        hasMore={status.hasMore}
        page={status.page}
      />
    );
  } catch {
    return <SetupState />;
  }
}

function EmployerStatusFallback() {
  return (
    <div className="mt-8 grid gap-5" aria-label="Loading connections">
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/30 p-1">
        <div className="h-10 animate-pulse rounded-lg bg-background" />
        <div className="h-10 animate-pulse rounded-lg bg-transparent" />
        <div className="h-10 animate-pulse rounded-lg bg-transparent" />
      </div>
      <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
      <div className="grid gap-3">
        <div className="h-20 animate-pulse rounded border border-border bg-muted/50" />
        <div className="h-20 animate-pulse rounded border border-border bg-muted/50" />
      </div>
    </div>
  );
}
