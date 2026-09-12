"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ReactivationReviewActions,
  WorkerReviewActions,
} from "@/components/admin/admin-actions";
import { Button, EmptyState, StatusPill } from "@/components/shared/ui";
import type {
  AdminApplicationReactivationRequest,
  AdminApplicationWorker,
} from "@/lib/types/admin-applications";

type ApplicationTab = "workers" | "reactivations";

const applicationQueryKeys = {
  workers: ["admin", "applications", "workers"] as const,
  reactivations: ["admin", "applications", "reactivations"] as const,
};

async function fetchApplications<T>(tab: ApplicationTab): Promise<T> {
  const response = await fetch(`/api/admin/applications?tab=${tab}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message || "Unable to load applications.");
  }

  return response.json() as Promise<T>;
}

export function ApplicationTabs() {
  const [tab, setTab] = useState<ApplicationTab>("workers");
  const workersQuery = useQuery({
    queryKey: applicationQueryKeys.workers,
    queryFn: () => fetchApplications<AdminApplicationWorker[]>("workers"),
  });
  const reactivationsQuery = useQuery({
    queryKey: applicationQueryKeys.reactivations,
    queryFn: () =>
      fetchApplications<AdminApplicationReactivationRequest[]>("reactivations"),
  });

  return (
    <div className="mt-8 grid gap-5">
      <div
        className="grid grid-cols-2 rounded-xl border border-border bg-muted/30 p-1"
        role="tablist"
        aria-label="Application queues"
      >
        <ApplicationTabButton
          active={tab === "workers"}
          count={workersQuery.data?.length}
          id="workers"
          label="Worker applications"
          onClick={() => setTab("workers")}
        />
        <ApplicationTabButton
          active={tab === "reactivations"}
          count={reactivationsQuery.data?.length}
          id="reactivations"
          label="Reactivation requests"
          onClick={() => setTab("reactivations")}
        />
      </div>
      <div
        id="admin-applications-panel"
        role="tabpanel"
        aria-labelledby={`admin-applications-tab-${tab}`}
        className="grid gap-3"
      >
        {tab === "workers" ? (
          <WorkerApplicationsPanel query={workersQuery} />
        ) : (
          <ReactivationRequestsPanel query={reactivationsQuery} />
        )}
      </div>
    </div>
  );
}

function ApplicationTabButton({
  active,
  count,
  id,
  label,
  onClick,
}: {
  active: boolean;
  count?: number;
  id: ApplicationTab;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`admin-applications-tab-${id}`}
      aria-controls="admin-applications-panel"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-10 rounded-lg px-3 text-sm font-medium transition ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label} <span className="ml-1 text-xs">{count ?? "…"}</span>
    </button>
  );
}

function WorkerApplicationsPanel({
  query,
}: {
  query: ReturnType<typeof useQuery<AdminApplicationWorker[]>>;
}) {
  if (query.isPending) return <ApplicationPanelSkeleton />;
  if (query.isError) {
    return (
      <ApplicationPanelError
        message={query.error.message}
        onRetry={query.refetch}
      />
    );
  }

  return (
    <div className="grid gap-3" aria-live="polite">
      {query.data.map((worker) => (
        <article
          key={worker.id}
          className="border border-border bg-background p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link
                href={`/admin/applications/${worker.id}`}
                className="text-lg font-semibold hover:underline"
              >
                {worker.full_name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {worker.location || "Location not shared"} ·{" "}
                {worker.years_experience} years experience
              </p>
            </div>
            <StatusPill tone="warning">Pending review</StatusPill>
          </div>
          <div className="mt-5">
            <WorkerReviewActions
              workerId={worker.id}
              status={worker.verification_status}
            />
          </div>
        </article>
      ))}
      {query.data.length === 0 ? (
        <EmptyState
          title="The review queue is clear."
          description="New worker applications will appear here."
        />
      ) : null}
    </div>
  );
}

function ReactivationRequestsPanel({
  query,
}: {
  query: ReturnType<typeof useQuery<AdminApplicationReactivationRequest[]>>;
}) {
  if (query.isPending) return <ApplicationPanelSkeleton />;
  if (query.isError) {
    return (
      <ApplicationPanelError
        message={query.error.message}
        onRetry={query.refetch}
      />
    );
  }

  return (
    <div className="grid gap-3" aria-live="polite">
      {query.data.map((request) => (
        <article
          key={request.id}
          className="border border-border bg-background p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {request.worker ? (
                <Link
                  href={`/admin/applications/${request.worker.id}`}
                  className="text-lg font-semibold hover:underline"
                >
                  {request.worker.full_name}
                </Link>
              ) : (
                <h2 className="text-lg font-semibold">
                  Worker profile unavailable
                </h2>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted{" "}
                {new Date(request.created_at).toLocaleDateString("en-KE")}
              </p>
            </div>
            <StatusPill tone="warning">Pending review</StatusPill>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {request.reason || "No reason was provided."}
          </p>
          <div className="mt-5">
            <ReactivationReviewActions requestId={request.id} />
          </div>
        </article>
      ))}
      {query.data.length === 0 ? (
        <EmptyState
          title="No reactivation requests."
          description="Approved worker reactivation requests will appear here."
        />
      ) : null}
    </div>
  );
}

function ApplicationPanelSkeleton() {
  return (
    <div
      className="grid gap-3"
      aria-label="Loading applications"
      aria-live="polite"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="animate-pulse border border-border bg-background p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="grid flex-1 gap-3">
              <div className="h-5 max-w-xs rounded bg-muted" />
              <div className="h-3 max-w-sm rounded bg-muted" />
            </div>
            <div className="h-6 w-24 rounded-full bg-muted" />
          </div>
          <div className="mt-5 h-10 w-32 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function ApplicationPanelError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <h2 className="text-lg font-medium">We could not load this queue</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {message}
      </p>
      <Button className="mt-5" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
