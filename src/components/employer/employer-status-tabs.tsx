"use client";

import Link from "next/link";
import { MapPin, UserRound } from "lucide-react";
import { useState } from "react";
import type { EmployerStatusItem } from "@/lib/domain/beauty-connect";
import { env } from "@/config/env";
import { formatDate, publicImageUrl } from "@/lib/utils";
import { EmptyState, StatusPill } from "@/components/shared/ui";

export function EmployerStatusTabs({
  pending,
  agreed,
}: {
  pending: EmployerStatusItem[];
  agreed: EmployerStatusItem[];
}) {
  const [tab, setTab] = useState<"pending" | "agreed">("pending");
  const items = tab === "pending" ? pending : agreed;

  return (
    <div className="mt-8 grid gap-5">
      <div className="grid grid-cols-2 border-b border-border" role="tablist">
        {(
          [
            ["pending", "Pending", pending.length],
            ["agreed", "Agreed", agreed.length],
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
          ? "Requests awaiting a worker response or being considered."
          : "Requests that became confirmed handshakes."}
      </p>
      <div className="grid gap-3">
        {items.map((item) => (
          <StatusRequestCard key={item.id} item={item} tab={tab} />
        ))}
        {items.length === 0 ? (
          <EmptyState
            title={
              tab === "pending"
                ? "No pending requests."
                : "No agreed requests yet."
            }
            description={
              tab === "pending"
                ? "When you send a worker request, it will appear here until they respond."
                : "A request moves here after the worker accepts and the handshake is created."
            }
            action={
              tab === "pending" ? (
                <Link
                  href="/employer/workers"
                  className="text-sm font-medium underline underline-offset-4"
                >
                  Browse workers
                </Link>
              ) : undefined
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function StatusRequestCard({
  item,
  tab,
}: {
  item: EmployerStatusItem;
  tab: "pending" | "agreed";
}) {
  const worker = item.worker;
  const image = publicImageUrl(
    env.supabase.url,
    "worker-profile-images",
    worker?.profile_photo_path,
  );

  return (
    <Link
      href={worker ? `/employer/workers/${worker.id}` : "/employer/workers"}
      className="flex min-w-0 items-center gap-3 border border-border bg-background p-3 transition hover:border-foreground"
    >
      <div className="grid size-14 shrink-0 place-items-center overflow-hidden bg-muted">
        {image ? (
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <UserRound className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold">
          {worker?.full_name ?? "Worker"}
        </h2>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {worker?.category_name ?? "Beauty professional"}
        </p>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          {[worker?.town, worker?.county].filter(Boolean).join(", ") ||
            worker?.location ||
            "Location not shared"}
        </p>
      </div>
      <div className="grid shrink-0 justify-items-end gap-1">
        <StatusPill tone={tab === "agreed" ? "success" : "warning"}>
          {tab === "agreed" ? "Agreed" : item.status}
        </StatusPill>
        <span className="text-[11px] text-muted-foreground">
          {formatDate(item.created_at)}
        </span>
      </div>
    </Link>
  );
}
