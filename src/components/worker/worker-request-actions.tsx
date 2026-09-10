"use client";

import { useState } from "react";
import { respondToWorkerRequestAction } from "@/app/actions/beauty-connect";
import { Button } from "@/components/shared/ui";

export function WorkerRequestActions({ requestId }: { requestId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function respond(response: "accepted" | "considering" | "declined") {
    setBusy(true);
    setMessage(null);
    try {
      await respondToWorkerRequestAction({ requestId, response });
      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not update this request.",
      );
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        <Button
          disabled={busy}
          onClick={() => respond("accepted")}
          className="min-h-10 rounded-xl bg-[#035715] px-3 text-xs text-white hover:bg-[#024210]"
        >
          Accept
        </Button>
        <Button
          disabled={busy}
          onClick={() => respond("considering")}
          variant="secondary"
          className="min-h-10 rounded-xl border-0 bg-[#f2edf2] px-3 text-xs text-[#514d50] hover:bg-[#e9e1e9]"
        >
          Consider
        </Button>
        <Button
          disabled={busy}
          onClick={() => respond("declined")}
          variant="secondary"
          className="min-h-10 rounded-xl border-0 bg-[#e8def8] px-3 text-xs text-[#514d50] hover:bg-[#ddd0f0]"
        >
          Decline
        </Button>
      </div>
      {message ? (
        <p className="mt-3 text-sm text-[#7a7478]">{message}</p>
      ) : null}
    </div>
  );
}
