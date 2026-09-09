"use client";

import { useState } from "react";
import { updateWorkerAvailabilityAction } from "@/app/actions/beauty-connect";
import { Button } from "@/components/shared/ui";

export function AvailabilityControl({
  value,
}: {
  value: "available" | "considering" | "matched";
}) {
  const [current, setCurrent] = useState(value);
  const [busy, setBusy] = useState(false);
  async function update(next: "available" | "considering") {
    setBusy(true);
    try {
      await updateWorkerAvailabilityAction(next);
      setCurrent(next);
    } finally {
      setBusy(false);
    }
  }
  if (current === "matched")
    return (
      <p className="text-sm text-muted-foreground">
        Your availability is matched and managed by your connection.
      </p>
    );
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant={current === "available" ? "primary" : "secondary"}
        disabled={busy}
        onClick={() => update("available")}
      >
        Available
      </Button>
      <Button
        type="button"
        variant={current === "considering" ? "primary" : "secondary"}
        disabled={busy}
        onClick={() => update("considering")}
      >
        Considering
      </Button>
    </div>
  );
}
