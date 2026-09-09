"use client";

import { useState } from "react";
import type { WorkerStatusItem } from "@/lib/domain/beauty-connect";
import { EmptyState } from "@/components/shared/ui";
import { WorkerRequestCard } from "@/components/worker/request-card";

export function WorkerStatusTabs({
  pending,
  accepted,
}: {
  pending: WorkerStatusItem[];
  accepted: WorkerStatusItem[];
}) {
  const [tab, setTab] = useState<"pending" | "accepted">("pending");
  const items = tab === "pending" ? pending : accepted;

  return (
    <div className="mt-8 grid gap-5">
      <div className="grid grid-cols-2 border-b border-border" role="tablist">
        {(
          [
            ["pending", "Pending", pending.length],
            ["accepted", "Accepted", accepted.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`min-h-11 border-b-2 px-3 text-sm font-medium transition ${
              tab === value
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label} <span className="ml-1 text-xs">{count}</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {tab === "pending"
          ? "Requests waiting for your response or still being considered."
          : "Salons whose requests you accepted and handshook with."}
      </p>
      <div className="grid gap-4">
        {items.map((item) => (
          <WorkerRequestCard key={item.id} request={item} />
        ))}
        {items.length === 0 ? (
          <EmptyState
            title={
              tab === "pending"
                ? "No pending requests."
                : "No accepted requests yet."
            }
            description={
              tab === "pending"
                ? "New salon requests will appear here when employers want to connect."
                : "Accepted requests will appear here after you accept a salon opportunity."
            }
          />
        ) : null}
      </div>
    </div>
  );
}
