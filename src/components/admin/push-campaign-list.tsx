"use client";

import Link from "next/link";
import { PushCampaignActions } from "@/components/admin/push-campaign-actions";
import { EmptyState, StatusPill } from "@/components/shared/ui";
import type { PushCampaignListItem } from "@/lib/domain/push-campaigns";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function statusTone(status: string) {
  if (status === "active" || status === "completed") return "success" as const;
  if (status === "cancelled") return "danger" as const;
  if (status === "paused" || status === "scheduled") return "warning" as const;
  return "neutral" as const;
}

export function PushCampaignList({
  campaigns,
}: {
  campaigns: PushCampaignListItem[];
}) {
  if (!campaigns.length) {
    return (
      <EmptyState
        title="No campaigns yet"
        description="Create a campaign to start building an auditable audience and delivery schedule."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {campaigns.map((campaign) => {
        const completedDeliveries = campaign.sent_count + campaign.failed_count;
        const totalDeliveries = campaign.scheduled_delivery_count;
        return (
          <article
            key={campaign.id}
            className="grid gap-5 border border-border bg-background p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
          >
            <Link
              href={`/admin/campaigns/${campaign.id}`}
              className="min-w-0 hover:text-[#035715]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-semibold">{campaign.title}</h2>
                <StatusPill tone={statusTone(campaign.status)}>
                  {label(campaign.status)}
                </StatusPill>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {label(campaign.target)} · {label(campaign.campaign_type)}
                {campaign.promotedWorkerName
                  ? ` · ${campaign.promotedWorkerName}`
                  : ""}
                {campaign.specialtyName ? ` · ${campaign.specialtyName}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {campaign.recipient_count.toLocaleString("en-KE")} recipients ·{" "}
                {campaign.sends_per_recipient} sends/recipient ·{" "}
                {campaign.campaign_period_days} days
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(campaign.starts_at)} →{" "}
                {formatDate(campaign.ends_at)}
              </p>
              <div className="mt-3 h-2 max-w-xl overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-[#035715]"
                  style={{
                    width: `${totalDeliveries ? Math.min(100, (completedDeliveries / totalDeliveries) * 100) : 0}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {completedDeliveries.toLocaleString("en-KE")} of{" "}
                {totalDeliveries.toLocaleString("en-KE")} delivery occurrences
                completed · {campaign.sent_count.toLocaleString("en-KE")} sent ·{" "}
                {campaign.failed_count.toLocaleString("en-KE")} failed
              </p>
            </Link>
            <PushCampaignActions
              campaignId={campaign.id}
              status={campaign.status}
            />
          </article>
        );
      })}
    </div>
  );
}
