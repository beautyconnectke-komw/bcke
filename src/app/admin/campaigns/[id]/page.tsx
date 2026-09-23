import Link from "next/link";
import { PushCampaignActions } from "@/components/admin/push-campaign-actions";
import {
  EmptyState,
  SectionHeading,
  SetupState,
  StatusPill,
} from "@/components/shared/ui";
import { getPushCampaignDetails } from "@/lib/domain/push-campaigns";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

export default async function AdminCampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const data = await getPushCampaignDetails(id);
    if (!data) {
      return (
        <EmptyState
          title="Campaign not found"
          description="This campaign may have been removed from the current database."
          action={
            <Link href="/admin/campaigns?tab=manage">Back to campaigns</Link>
          }
        />
      );
    }
    const { campaign, analytics } = data;
    const completed = campaign.sent_count + campaign.failed_count;
    const progress = campaign.scheduled_delivery_count
      ? Math.min(100, (completed / campaign.scheduled_delivery_count) * 100)
      : 0;
    return (
      <div>
        <Link
          href="/admin/campaigns?tab=manage"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to campaigns
        </Link>
        <div className="mt-5">
          <SectionHeading
            eyebrow="Campaign details"
            title={campaign.title}
            description={campaign.body}
            action={
              <PushCampaignActions
                campaignId={campaign.id}
                status={campaign.status}
                compact
              />
            }
          />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Status"
            value={<StatusPill>{label(campaign.status)}</StatusPill>}
          />
          <Metric label="Target" value={label(campaign.target)} />
          <Metric label="Campaign type" value={label(campaign.campaign_type)} />
          <Metric
            label="Recipients"
            value={campaign.recipient_count.toLocaleString("en-KE")}
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="grid gap-4 border border-border bg-background p-6">
            <h2 className="text-lg font-semibold">Audience and schedule</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail
                label="Audience estimate"
                value={`${campaign.audience_estimated_count.toLocaleString("en-KE")} eligible`}
              />
              <Detail
                label="Selected audience"
                value={`${campaign.audience_selected_count.toLocaleString("en-KE")} (${campaign.audience_percentage}%)`}
              />
              <Detail
                label="Period"
                value={`${campaign.campaign_period_days} days`}
              />
              <Detail
                label="Sends per recipient"
                value={String(campaign.sends_per_recipient)}
              />
              <Detail label="Start" value={formatDate(campaign.starts_at)} />
              <Detail label="End" value={formatDate(campaign.ends_at)} />
              <Detail
                label="Daily window"
                value={`${campaign.delivery_window_start.slice(0, 5)} – ${campaign.delivery_window_end.slice(0, 5)} ${campaign.delivery_timezone}`}
              />
              <Detail
                label="County"
                value={campaign.county ?? "All counties / derived promotion"}
              />
              <Detail
                label="Speciality"
                value={
                  data.specialtyName
                    ? `${data.specialtyName} (${campaign.specialty_scope === "main" ? "main only" : campaign.specialty_scope === "extra" ? "extra only" : "main or extra"})`
                    : "All specialities / derived promotion"
                }
              />
              <Detail
                label="Promoted worker"
                value={data.promotedWorkerName ?? "None"}
              />
            </dl>
          </section>
          <section className="grid gap-4 border border-border bg-background p-6">
            <h2 className="text-lg font-semibold">Delivery progress</h2>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-[#035715]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {completed.toLocaleString("en-KE")} of{" "}
              {campaign.scheduled_delivery_count.toLocaleString("en-KE")}{" "}
              delivery occurrences completed.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric
                label="Sent"
                value={campaign.sent_count.toLocaleString("en-KE")}
              />
              <Metric
                label="Failed"
                value={campaign.failed_count.toLocaleString("en-KE")}
              />
            </div>
            {analytics ? (
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                <Metric
                  label="Profile visits"
                  value={analytics.profile_visits.toLocaleString("en-KE")}
                />
                <Metric
                  label="Opened"
                  value={analytics.opened.toLocaleString("en-KE")}
                />
                <Metric
                  label="Clicked"
                  value={analytics.clicked.toLocaleString("en-KE")}
                />
              </div>
            ) : null}
          </section>
        </div>
        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          Push delivery success means the configured push provider accepted the
          request. Browser delivery receipts are not available through the
          current Web Push infrastructure; opened/clicked reflects notification
          opens recorded by the existing notification read path.
        </p>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#f6f3f5] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
