import { Suspense } from "react";
import {
  getCurrentWorkerProfile,
  getWorkerStatusPage,
} from "@/lib/domain/beauty-connect";
import {
  EmptyState,
  LinkButton,
  SectionHeading,
  SetupState,
} from "@/components/shared/ui";
import { WorkerStatusTabs } from "@/components/worker/worker-status-tabs";

export default async function WorkerStatusPage({
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
    const profilePromise = getCurrentWorkerProfile();
    const statusPromise = getWorkerStatusPage(page);
    const profile = await profilePromise;
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
        <Suspense fallback={<WorkerStatusFallback />}>
          <WorkerStatusContent statusPromise={statusPromise} />
        </Suspense>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}

async function WorkerStatusContent({
  statusPromise,
}: {
  statusPromise: ReturnType<typeof getWorkerStatusPage>;
}) {
  try {
    const status = await statusPromise;
    return (
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
          hasMore={status.hasMore}
          page={status.page}
        />
      </div>
    );
  } catch {
    return <SetupState />;
  }
}

function WorkerStatusFallback() {
  return (
    <div className="mt-10 grid gap-4" aria-label="Loading requests">
      <div className="h-7 w-64 animate-pulse rounded bg-muted" />
      <div className="h-10 animate-pulse rounded border border-border bg-muted/50" />
      <div className="h-20 animate-pulse rounded border border-border bg-muted/50" />
    </div>
  );
}
