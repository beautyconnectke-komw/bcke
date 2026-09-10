"use client";

import { useState } from "react";
import { updateWorkerAvailabilityAction } from "@/app/actions/beauty-connect";
import { Button } from "@/components/shared/ui";
import { cn } from "@/lib/utils";

export function AvailabilityControl({
  value,
  className,
}: {
  value: "available" | "considering" | "matched";
  className?: string;
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
      <p className={cn("text-sm text-muted-foreground", className)}>
        Your availability is matched and managed by your connection.
      </p>
    );
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        type="button"
        variant={current === "available" ? "primary" : "secondary"}
        disabled={busy}
        onClick={() => update("available")}
        className={cn(
          "rounded-full px-4 text-xs",
          current === "available"
            ? "bg-[#035715] text-white hover:bg-[#024210]"
            : "border-[#ded4dc] bg-white text-[#514d50] hover:bg-[#f7f1f6]",
        )}
      >
        Available
      </Button>
      <Button
        type="button"
        variant={current === "considering" ? "primary" : "secondary"}
        disabled={busy}
        onClick={() => update("considering")}
        className={cn(
          "rounded-full px-4 text-xs",
          current === "considering"
            ? "bg-[#035715] text-white hover:bg-[#024210]"
            : "border-[#ded4dc] bg-white text-[#514d50] hover:bg-[#f7f1f6]",
        )}
      >
        Considering
      </Button>
    </div>
  );
}
