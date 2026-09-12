"use client";

import { useState } from "react";
import type { ReactivationRequest } from "@/lib/domain/beauty-connect";
import { requestWorkerReactivationAction } from "@/app/actions/beauty-connect";
import { Button } from "@/components/shared/ui";

export function WorkerReactivationForm({
  request,
}: {
  request: ReactivationRequest | null;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (request?.status === "pending") {
    return (
      <div className="rounded-2xl border border-[#eadfe7] bg-[#fff8fc] p-4">
        <p className="text-sm font-semibold text-[#1b1b1d]">
          Reactivation request under review
        </p>
        <p className="mt-1 text-sm leading-6 text-[#7a7478]">
          Your profile will stay off the marketplace until an administrator
          reviews the request.
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border border-[#eadfe7] bg-[#fff8fc] p-4"
      action={async () => {
        setBusy(true);
        setError(null);
        try {
          await requestWorkerReactivationAction({
            reason: reason.trim() || null,
          });
          window.location.reload();
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "We could not submit the reactivation request.",
          );
          setBusy(false);
        }
      }}
    >
      <p className="text-sm font-semibold text-[#1b1b1d]">
        Request marketplace reactivation
      </p>
      <p className="mt-1 text-sm leading-6 text-[#7a7478]">
        After a connection, you are off-market. Ask an administrator to make
        your profile available for new opportunities.
      </p>
      {request?.status === "declined" ? (
        <p className="mt-3 text-xs font-medium text-[#9f3d58]">
          Your previous request was declined. You can submit a new request.
        </p>
      ) : null}
      <label className="mt-4 block text-xs font-semibold text-[#514d50]">
        Optional note
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Tell the admin why you are ready to accept new opportunities."
          className="mt-2 w-full rounded-xl border border-[#d8d0d5] bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-[#035715]"
        />
      </label>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-[#7a7478]">Admin approval required</span>
        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send request"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-[#9f3d58]">{error}</p> : null}
    </form>
  );
}
