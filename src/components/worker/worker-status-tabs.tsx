"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { WorkerStatusItem } from "@/lib/domain/beauty-connect";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/ui";
import { WorkerRequestCard } from "@/components/worker/request-card";

type EmployerView = "all" | "pending" | "accepted";

export function WorkerStatusTabs({
  pending,
  accepted,
  hasMore,
  page,
}: {
  pending: WorkerStatusItem[];
  accepted: WorkerStatusItem[];
  hasMore: boolean;
  page: number;
}) {
  const [view, setView] = useState<EmployerView>("pending");
  const [draftView, setDraftView] = useState<EmployerView>("pending");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const allItems = useMemo(
    () =>
      [...pending, ...accepted].sort(
        (left, right) =>
          Date.parse(right.created_at) - Date.parse(left.created_at),
      ),
    [accepted, pending],
  );
  const viewItems =
    view === "all" ? allItems : view === "pending" ? pending : accepted;
  const normalizedSearch = search.trim().toLowerCase();
  const items = viewItems.filter((item) => {
    if (!normalizedSearch) return true;
    const searchableText = [
      item.employer?.business_name,
      item.employer?.location,
      item.employer?.description,
      item.message,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchableText.includes(normalizedSearch);
  });

  useEffect(() => {
    if (!filterOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filterOpen]);

  const filterIsActive = view !== "pending";
  const emptyTitle = normalizedSearch
    ? "No employers match your search."
    : view === "pending"
      ? "No pending requests."
      : view === "accepted"
        ? "No accepted requests yet."
        : "No employer connections yet.";
  const emptyDescription = normalizedSearch
    ? "Try another employer name, location, or keyword."
    : view === "pending"
      ? "New salon requests will appear here when employers want to connect."
      : view === "accepted"
        ? "Accepted requests will appear here after you accept a salon opportunity."
        : "Employer requests and accepted connections will appear here.";

  return (
    <div className="mt-8 grid gap-5">
      <div className="flex items-center gap-2 rounded-2xl border border-[#eee5eb] bg-white p-2 shadow-[0_4px_18px_rgba(31,17,29,0.03)]">
        <Search className="ml-2 size-4 shrink-0 text-[#a19aa0]" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search employers"
          aria-label="Search employers"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-[#a19aa0]"
        />
        <button
          type="button"
          onClick={() => {
            setDraftView(view);
            setFilterOpen(true);
          }}
          aria-label="Filter employers"
          className={cn(
            "relative grid size-10 shrink-0 place-items-center rounded-xl text-[#514d50] transition hover:bg-[#f7f1f5]",
            filterIsActive && "bg-[#1b1b1d] text-white hover:bg-[#1b1b1d]",
          )}
        >
          <SlidersHorizontal className="size-4" />
          {filterIsActive ? (
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#d89bc2]" />
          ) : null}
        </button>
      </div>

      <div
        className="grid grid-cols-3 rounded-xl border border-[#eee5eb] bg-[#f7f1f5] p-1"
        role="tablist"
        aria-label="Worker requests"
      >
        {(
          [
            ["all", "All", allItems.length],
            ["pending", "Pending", pending.length],
            ["accepted", "Accepted", accepted.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`worker-status-tab-${value}`}
            aria-controls="worker-status-panel"
            aria-selected={view === value}
            onClick={() => setView(value)}
            className={`min-h-10 rounded-lg px-3 text-sm font-medium transition ${
              view === value
                ? "bg-white text-[#1b1b1d] shadow-sm"
                : "text-[#7a7478] hover:text-[#1b1b1d]"
            }`}
          >
            {label} <span className="ml-1 text-xs">{count}</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {view === "pending"
          ? "Requests waiting for your response or still being considered."
          : view === "accepted"
            ? "Salons whose requests you accepted and handshook with."
            : "All incoming employer requests and accepted connections."}
      </p>
      <div
        id="worker-status-panel"
        role="tabpanel"
        aria-labelledby={`worker-status-tab-${view}`}
        className="grid gap-4"
      >
        {items.map((item) => (
          <WorkerRequestCard key={item.id} request={item} />
        ))}
        {items.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : null}
      </div>
      {hasMore ? (
        <div className="flex justify-center">
          <Link
            href={`/worker/status?page=${page + 1}`}
            className="rounded-md border border-border px-5 py-3 text-sm font-medium transition hover:border-foreground"
          >
            See More
          </Link>
        </div>
      ) : null}
      {filterOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-end bg-[#1b1b1d]/35 p-0 sm:items-center sm:justify-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFilterOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="worker-employer-filter-title"
            className="w-full max-w-lg overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"
          >
            <div className="flex items-center justify-between border-b border-[#eee5eb] px-5 py-4">
              <h2
                id="worker-employer-filter-title"
                className="text-sm font-semibold"
              >
                Filter employers
              </h2>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                aria-label="Close employer filters"
                className="grid size-9 place-items-center rounded-full text-[#7a7478] hover:bg-[#f7f1f5] hover:text-[#1b1b1d]"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a7478]">
                Request status
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All employers"],
                    ["pending", "Pending"],
                    ["accepted", "Accepted"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraftView(value)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-xs font-medium transition",
                      draftView === value
                        ? "border-[#1b1b1d] bg-[#1b1b1d] text-white"
                        : "border-[#eee5eb] bg-white text-[#514d50] hover:border-[#1b1b1d]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 border-t border-[#eee5eb] bg-[#fffafb] p-4 sm:p-5">
              <button
                type="button"
                onClick={() => {
                  setDraftView("pending");
                  setView("pending");
                  setFilterOpen(false);
                }}
                className="min-h-11 flex-1 rounded-xl border border-[#d8d0d5] px-4 text-sm font-medium text-[#514d50] transition hover:border-[#1b1b1d]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setView(draftView);
                  setFilterOpen(false);
                }}
                className="min-h-11 flex-1 rounded-xl bg-[#1b1b1d] px-4 text-sm font-medium text-white transition hover:bg-[#363337]"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
