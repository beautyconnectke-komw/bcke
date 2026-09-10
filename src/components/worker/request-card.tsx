"use client";

import Link from "next/link";
import { MapPin, UserRound } from "lucide-react";
import { env } from "@/config/env";
import type { WorkerRequestWithEmployer } from "@/lib/domain/beauty-connect";
import { cn, formatDate, publicImageUrl } from "@/lib/utils";
import { StatusPill } from "@/components/shared/ui";
import { WorkerRequestActions } from "@/components/worker/worker-request-actions";

export function WorkerRequestCard({
  request,
  className,
}: {
  request: WorkerRequestWithEmployer;
  className?: string;
}) {
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
    <article
      className={cn(
        "rounded-2xl border border-[#eee5eb] bg-white p-4 shadow-[0_4px_18px_rgba(31,17,29,0.03)] sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {employer ? (
          <Link
            href={`/worker/status/employers/${employer.id}`}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f3eef1]">
              {image ? (
                <img src={image} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-5 text-[#a19aa0]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#7a7478]">
                {formatDate(request.created_at)}
              </p>
              <h3 className="mt-1 truncate text-base font-semibold tracking-[-0.01em] underline-offset-4 hover:underline">
                {employer.business_name}
              </h3>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#7a7478]">
                <MapPin className="size-3 shrink-0" />
                {employer.location ?? "Location not shared"}
              </p>
            </div>
          </Link>
        ) : (
          <div>
            <p className="text-xs text-[#7a7478]">
              {formatDate(request.created_at)}
            </p>
            <h3 className="mt-2 text-base font-semibold">A salon</h3>
            <p className="mt-1 text-xs text-[#7a7478]">Location not shared</p>
          </div>
        )}
        <StatusPill tone={tone}>{request.status}</StatusPill>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#7a7478]">
        {request.message ||
          employer?.description ||
          "This employer would like to connect about an opportunity."}
      </p>
      {request.status === "pending" || request.status === "considering" ? (
        <div className="mt-5">
          <WorkerRequestActions requestId={request.id} />
        </div>
      ) : null}
    </article>
  );
}
