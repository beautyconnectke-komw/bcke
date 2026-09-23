"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  cancelPushCampaignAction,
  duplicatePushCampaignAction,
  pausePushCampaignAction,
  resumePushCampaignAction,
} from "@/app/actions/beauty-connect";
import { Button, LinkButton } from "@/components/shared/ui";

export function PushCampaignActions({
  campaignId,
  status,
  compact = false,
}: {
  campaignId: string;
  status: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "pause" | "resume" | "cancel" | "duplicate") {
    if (
      action === "cancel" &&
      !window.confirm("Cancel this campaign permanently?")
    ) {
      return;
    }
    setBusy(action);
    setError(null);
    try {
      if (action === "pause") await pausePushCampaignAction(campaignId);
      if (action === "resume") await resumePushCampaignAction(campaignId);
      if (action === "cancel") await cancelPushCampaignAction(campaignId);
      if (action === "duplicate") {
        const duplicateId = await duplicatePushCampaignAction(campaignId);
        router.push(`/admin/campaigns/${duplicateId}`);
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Campaign action failed.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {!compact ? (
          <LinkButton
            href={`/admin/campaigns/${campaignId}`}
            variant="secondary"
          >
            View
          </LinkButton>
        ) : null}
        {status === "scheduled" || status === "active" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null}
            onClick={() => void run("pause")}
          >
            {busy === "pause" ? "Pausing..." : "Pause"}
          </Button>
        ) : null}
        {status === "paused" ? (
          <Button
            type="button"
            disabled={busy !== null}
            onClick={() => void run("resume")}
          >
            {busy === "resume" ? "Resuming..." : "Resume"}
          </Button>
        ) : null}
        {!["completed", "cancelled"].includes(status) ? (
          <Button
            type="button"
            variant="danger"
            disabled={busy !== null}
            onClick={() => void run("cancel")}
          >
            {busy === "cancel" ? "Cancelling..." : "Cancel"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          disabled={busy !== null}
          onClick={() => void run("duplicate")}
        >
          {busy === "duplicate" ? "Duplicating..." : "Duplicate"}
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
