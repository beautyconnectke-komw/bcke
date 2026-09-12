"use client";

import { useState } from "react";
import {
  approveWorkerAction,
  approveWorkerReactivationAction,
  declineWorkerReactivationAction,
  rejectWorkerAction,
  restoreWorkerAction,
  suspendWorkerAction,
} from "@/app/actions/beauty-connect";
import { Button } from "@/components/shared/ui";

export function WorkerReviewActions({
  workerId,
  status,
  compact = false,
}: {
  workerId: string;
  status: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(action: "approve" | "reject" | "suspend" | "restore") {
    setBusy(true);
    setError(null);
    try {
      if (action === "approve")
        await approveWorkerAction({ workerProfileId: workerId });
      if (action === "reject")
        await rejectWorkerAction({
          workerProfileId: workerId,
          reason: "Please review and update your profile before resubmitting.",
        });
      if (action === "suspend")
        await suspendWorkerAction({
          workerProfileId: workerId,
          reason: "Suspended by administrator.",
        });
      if (action === "restore") await restoreWorkerAction(workerId);
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending_review" ? (
        <>
          <Button disabled={busy} onClick={() => run("approve")}>
            Approve
          </Button>
          <Button
            disabled={busy}
            variant="secondary"
            onClick={() => run("reject")}
          >
            Reject
          </Button>
        </>
      ) : null}
      {status === "approved" ? (
        <Button disabled={busy} variant="danger" onClick={() => run("suspend")}>
          Suspend
        </Button>
      ) : null}
      {status === "rejected" || status === "draft" || status === "suspended" ? (
        <Button
          disabled={busy}
          variant="secondary"
          onClick={() => run("restore")}
        >
          Restore
        </Button>
      ) : null}
      {error ? (
        <p className="basis-full text-sm text-red-700">{error}</p>
      ) : null}
      {compact ? null : null}
    </div>
  );
}

export function CategoryToggle({
  categoryId,
  active,
}: {
  categoryId: string;
  active: boolean;
}) {
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    const { toggleCategoryAction } =
      await import("@/app/actions/beauty-connect");
    try {
      await toggleCategoryAction(categoryId, !active);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="secondary" disabled={busy} onClick={toggle}>
      {active ? "Deactivate" : "Activate"}
    </Button>
  );
}

export function ReactivationReviewActions({
  requestId,
}: {
  requestId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review(action: "approve" | "decline") {
    setBusy(true);
    setError(null);
    try {
      if (action === "approve") {
        await approveWorkerReactivationAction(requestId);
      } else {
        await declineWorkerReactivationAction(
          requestId,
          "Please remain off-market until you are ready to accept new opportunities.",
        );
      }
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button disabled={busy} onClick={() => review("approve")}>
        Approve reactivation
      </Button>
      <Button
        disabled={busy}
        variant="secondary"
        onClick={() => review("decline")}
      >
        Decline
      </Button>
      {error ? (
        <p className="basis-full text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
