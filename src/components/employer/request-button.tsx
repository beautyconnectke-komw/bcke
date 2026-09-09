"use client";

import { useState } from "react";
import { requestWorkerAction } from "@/app/actions/beauty-connect";
import { Button } from "@/components/shared/ui";

export function RequestButton({
  workerId,
  disabled,
}: {
  workerId: string;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  async function request() {
    setState("busy");
    setError(null);
    try {
      await requestWorkerAction({
        workerProfileId: workerId,
        message: message || null,
      });
      setState("sent");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not send this request.",
      );
      setState("idle");
    }
  }
  if (state === "sent")
    return (
      <p className="border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Request sent. You can follow its progress from your status page.
      </p>
    );
  return (
    <div className="grid gap-3">
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        className="field min-h-24 py-3"
        placeholder="Add a short note (optional)"
        disabled={disabled || state === "busy"}
      />
      <Button
        type="button"
        onClick={request}
        disabled={disabled || state === "busy"}
      >
        {state === "busy" ? "Sending…" : "Request this worker"}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
