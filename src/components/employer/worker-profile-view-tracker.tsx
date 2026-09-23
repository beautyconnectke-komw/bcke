"use client";

import { useEffect } from "react";
import {
  recordPushCampaignProfileVisitAction,
  recordWorkerProfileViewAction,
} from "@/app/actions/beauty-connect";

export function WorkerProfileViewTracker({
  workerProfileId,
  campaignId,
}: {
  workerProfileId: string;
  campaignId?: string | null;
}) {
  useEffect(() => {
    void recordWorkerProfileViewAction(workerProfileId).catch(() => {
      // View analytics must never block the worker profile.
    });
    if (campaignId) {
      void recordPushCampaignProfileVisitAction(
        workerProfileId,
        campaignId,
      ).catch(() => {
        // Campaign attribution must never block the worker profile.
      });
    }
  }, [campaignId, workerProfileId]);

  return null;
}
