"use client";

import { useState } from "react";
import {
  addAdminEmailAction,
  removeAdminEmailAction,
  setFeaturedWorkersAction,
} from "@/app/actions/beauty-connect";
import type { AdminWorker } from "@/lib/domain/beauty-connect";
import { Button } from "@/components/shared/ui";

export function AdminWhitelistForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await addAdminEmailAction({ email });
      setEmail("");
      setMessage("The email is whitelisted and can access the admin area.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not whitelist that email.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="field"
        placeholder="admin@example.com"
      />
      <Button disabled={busy}>
        {busy ? "Checking..." : "Whitelist email"}
      </Button>
      {message ? (
        <p className="text-sm text-emerald-700 sm:col-span-2">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700 sm:col-span-2">{error}</p>
      ) : null}
    </form>
  );
}

export function AdminWhitelistRemove({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await removeAdminEmailAction(email);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="secondary" disabled={busy} onClick={remove}>
      {busy ? "Removing..." : "Remove"}
    </Button>
  );
}

export function FeaturedWorkerManager({ workers }: { workers: AdminWorker[] }) {
  const candidates = workers.filter(
    (worker) =>
      worker.verification_status === "approved" && !worker.is_suspended,
  );
  const initialSelected = candidates
    .filter((worker) => worker.featured_rank !== null)
    .sort((a, b) => (a.featured_rank ?? 99) - (b.featured_rank ?? 99))
    .map((worker) => worker.id);
  const [selectedIds, setSelectedIds] = useState(initialSelected);
  const [ranks, setRanks] = useState<Record<string, string>>(
    Object.fromEntries(
      candidates
        .filter((worker) => worker.featured_rank !== null)
        .map((worker) => [worker.id, String(worker.featured_rank)]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleWorker(workerId: string) {
    setError(null);
    if (selectedIds.includes(workerId)) {
      setSelectedIds((current) => current.filter((id) => id !== workerId));
      return;
    }
    if (selectedIds.length >= 8) {
      setError("You can feature at most 8 workers.");
      return;
    }
    setSelectedIds((current) => [...current, workerId]);
    setRanks((current) => {
      const usedRanks = new Set(
        selectedIds.map((id) => Number(current[id])).filter(Number.isInteger),
      );
      const nextRank = Array.from({ length: 8 }, (_, index) => index + 1).find(
        (rank) => !usedRanks.has(rank),
      );
      return {
        ...current,
        [workerId]: String(nextRank ?? selectedIds.length + 1),
      };
    });
  }

  async function save() {
    const ranked = selectedIds.map((id) => ({
      id,
      rank: Number(ranks[id]),
    }));
    const rankValues = ranked.map((item) => item.rank);
    if (
      ranked.some(
        (item) =>
          !Number.isInteger(item.rank) || item.rank < 1 || item.rank > 8,
      ) ||
      new Set(rankValues).size !== rankValues.length
    ) {
      setError("Give each featured worker a unique number from 1 to 8.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await setFeaturedWorkersAction(
        ranked.sort((a, b) => a.rank - b.rank).map((item) => item.id),
      );
      window.location.reload();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save featured workers.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h2 className="text-lg font-semibold">Featured workers</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Choose up to 8 approved workers. Number 1 appears first on the
            employer home.
          </p>
        </div>
        <p className="text-sm font-medium">{selectedIds.length} / 8 selected</p>
      </div>
      <div className="grid gap-2">
        {candidates.map((worker) => {
          const selected = selectedIds.includes(worker.id);
          return (
            <label
              key={worker.id}
              className={`flex min-h-14 items-center gap-3 border px-3 py-3 ${
                selected
                  ? "border-foreground bg-muted"
                  : "border-border bg-background"
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleWorker(worker.id)}
                className="size-4 accent-current"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {worker.full_name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {worker.category_name || "Speciality not selected"}
                </span>
              </span>
              {selected ? (
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={ranks[worker.id] ?? ""}
                  onChange={(event) =>
                    setRanks((current) => ({
                      ...current,
                      [worker.id]: event.target.value,
                    }))
                  }
                  aria-label={`Featured rank for ${worker.full_name}`}
                  className="field w-16 text-center"
                />
              ) : null}
            </label>
          );
        })}
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Approved, active workers will appear here once available.
          </p>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div>
        <Button type="button" disabled={busy} onClick={save}>
          {busy ? "Saving..." : "Save featured order"}
        </Button>
      </div>
    </div>
  );
}
