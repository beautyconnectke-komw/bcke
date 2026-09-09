"use client";

import Link from "next/link";
import { MapPin, UserRound } from "lucide-react";
import { useState } from "react";
import { respondToWorkerRequestAction } from "@/app/actions/beauty-connect";
import { env } from "@/config/env";
import type { WorkerRequestWithEmployer } from "@/lib/domain/beauty-connect";
import { formatDate, publicImageUrl } from "@/lib/utils";
import { Button, StatusPill } from "@/components/shared/ui";

export function WorkerRequestCard({
  request,
}: {
  request: WorkerRequestWithEmployer;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function respond(response: "accepted" | "considering" | "declined") {
    setBusy(true);
    setMessage(null);
    try {
      await respondToWorkerRequestAction({ requestId: request.id, response });
      setMessage("Response saved. Refreshing your status…");
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
  const employer = request.employer;
  const image = publicImageUrl(
    env.supabase.url,
    "employer-images",
    employer?.profile_image_path,
  );
  const tone =
    request.status === "accepted"
      ? "success"
      : request.status === "declined" || request.status === "expired"
        ? "danger"
        : request.status === "considering"
          ? "warning"
          : "neutral";
  return (
    <article className="border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-4">
        {employer ? (
          <Link
            href={`/worker/status/employers/${employer.id}`}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="grid size-14 shrink-0 place-items-center overflow-hidden bg-muted">
              {image ? (
                <img src={image} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {formatDate(request.created_at)}
              </p>
              <h3 className="mt-1 truncate text-lg font-semibold underline-offset-4 hover:underline">
                {employer.business_name}
              </h3>
              <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                {employer.location ?? "Location not shared"}
              </p>
            </div>
          </Link>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground">
              {formatDate(request.created_at)}
            </p>
            <h3 className="mt-2 text-lg font-semibold">A salon</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Location not shared
            </p>
          </div>
        )}
        <StatusPill tone={tone}>{request.status}</StatusPill>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {request.message ||
          employer?.description ||
          "This employer would like to connect about an opportunity."}
      </p>
      {request.status === "pending" || request.status === "considering" ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            disabled={busy}
            onClick={() => respond("declined")}
            variant="secondary"
          >
            Decline
          </Button>
          <Button
            disabled={busy}
            onClick={() => respond("considering")}
            variant="secondary"
          >
            Consider
          </Button>
          <Button disabled={busy} onClick={() => respond("accepted")}>
            Accept
          </Button>
        </div>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      ) : null}
    </article>
  );
}
