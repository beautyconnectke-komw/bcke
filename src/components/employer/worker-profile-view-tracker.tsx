"use client";

import { useEffect } from "react";
import { recordWorkerProfileViewAction } from "@/app/actions/beauty-connect";

export function WorkerProfileViewTracker({
  workerProfileId,
}: {
  workerProfileId: string;
}) {
  useEffect(() => {
    void recordWorkerProfileViewAction(workerProfileId).catch(() => {
      // View analytics must never block the worker profile.
    });
  }, [workerProfileId]);

  return null;
}
