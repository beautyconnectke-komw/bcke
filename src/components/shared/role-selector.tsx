"use client";

import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Scissors } from "lucide-react";
import { useState } from "react";
import { setRoleAction } from "@/app/actions/beauty-connect";

export function RoleSelector() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  async function choose(role: "worker" | "employer") {
    setBusy(role);
    setError(null);
    try {
      await setRoleAction(role);
      router.push(
        role === "worker" ? "/worker/onboarding" : "/employer/onboarding",
      );
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save your role.",
      );
      setBusy(null);
    }
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        onClick={() => choose("worker")}
        disabled={busy !== null}
        className="group border border-border bg-background p-6 text-left transition hover:-translate-y-1 hover:border-foreground"
      >
        <Scissors className="size-5" />
        <h2 className="mt-8 text-xl font-semibold">I’m a Worker</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          For beauty professionals looking for trusted opportunities.
        </p>
        <span className="mt-6 block text-sm font-medium">
          {busy === "worker" ? "Saving…" : "Continue as Worker →"}
        </span>
      </button>
      <button
        onClick={() => choose("employer")}
        disabled={busy !== null}
        className="group border border-border bg-background p-6 text-left transition hover:-translate-y-1 hover:border-foreground"
      >
        <BriefcaseBusiness className="size-5" />
        <h2 className="mt-8 text-xl font-semibold">I’m an Employer</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          For salons and businesses looking for trusted workers.
        </p>
        <span className="mt-6 block text-sm font-medium">
          {busy === "employer" ? "Saving…" : "Continue as Employer →"}
        </span>
      </button>
      {error ? (
        <p className="text-sm text-red-700 sm:col-span-2">{error}</p>
      ) : null}
    </div>
  );
}
