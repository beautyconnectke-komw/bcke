import Link from "next/link";
import { PushCampaignForm } from "@/components/admin/push-campaign-form";
import { PushCampaignList } from "@/components/admin/push-campaign-list";
import { EmptyState, SectionHeading, SetupState } from "@/components/shared/ui";
import {
  getPushCampaigns,
  getPushCampaignSetupData,
} from "@/lib/domain/push-campaigns";

type SearchParams = {
  tab?: string | string[];
  target?: string | string[];
  campaignType?: string | string[];
  status?: string | string[];
  activity?: string | string[];
  period?: string | string[];
  from?: string | string[];
  to?: string | string[];
  promotedWorker?: string | string[];
};

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const tab = valueOf(params.tab) === "manage" ? "manage" : "create";

  try {
    const data = await getPushCampaignSetupData();
    const campaigns =
      tab === "manage"
        ? await getPushCampaigns({
            target: valueOf(params.target) as
              "worker" | "employer" | "both" | undefined,
            campaignType: valueOf(params.campaignType) as
              "general" | "promote_worker" | undefined,
            status: valueOf(params.status) as
              | "draft"
              | "scheduled"
              | "active"
              | "paused"
              | "completed"
              | "cancelled"
              | undefined,
            activity: valueOf(params.activity) as
              "active" | "inactive" | undefined,
            periodDays: valueOf(params.period)
              ? Number(valueOf(params.period))
              : undefined,
            fromDate: valueOf(params.from) || undefined,
            toDate: valueOf(params.to) || undefined,
            promotedWorkerProfileId:
              valueOf(params.promotedWorker) || undefined,
          })
        : [];

    return (
      <div>
        <SectionHeading
          eyebrow="Admin communications"
          title="Push Campaigns"
          description="Create deliberate audience campaigns without changing Beauty Connect's transactional notification flows."
        />
        <nav
          className="mt-6 flex gap-1 rounded-xl border border-[#c0c9ba]/30 bg-[#f6f3f5] p-1"
          aria-label="Push campaign sections"
        >
          <Link
            href="/admin/campaigns?tab=create"
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "create" ? "bg-[#035715] text-white" : "text-[#40493e] hover:bg-white"}`}
          >
            Create
          </Link>
          <Link
            href="/admin/campaigns?tab=manage"
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "manage" ? "bg-[#035715] text-white" : "text-[#40493e] hover:bg-white"}`}
          >
            Manage
          </Link>
        </nav>

        {tab === "create" && data ? (
          <div className="mt-8 max-w-4xl">
            <PushCampaignForm
              categories={data.categories}
              initialWorkers={data.workers}
            />
          </div>
        ) : null}

        {tab === "manage" ? (
          <div className="mt-8 grid gap-6">
            <form className="grid gap-3 border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4">
              <select
                name="target"
                className="field"
                defaultValue={valueOf(params.target) ?? ""}
              >
                <option value="">All targets</option>
                <option value="worker">Workers</option>
                <option value="employer">Employers</option>
                <option value="both">Both</option>
              </select>
              <select
                name="campaignType"
                className="field"
                defaultValue={valueOf(params.campaignType) ?? ""}
              >
                <option value="">All campaign types</option>
                <option value="general">General campaign</option>
                <option value="promote_worker">Promote a worker</option>
              </select>
              <select
                name="status"
                className="field"
                defaultValue={valueOf(params.status) ?? ""}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                name="activity"
                className="field"
                defaultValue={valueOf(params.activity) ?? ""}
              >
                <option value="">Active or inactive</option>
                <option value="active">Active campaigns</option>
                <option value="inactive">Inactive campaigns</option>
              </select>
              <select
                name="period"
                className="field"
                defaultValue={valueOf(params.period) ?? ""}
              >
                <option value="">Any period</option>
                <option value="1">1 day</option>
                <option value="2">2 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
              <select
                name="promotedWorker"
                className="field"
                defaultValue={valueOf(params.promotedWorker) ?? ""}
              >
                <option value="">Any promoted worker</option>
                {data.workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.full_name}
                  </option>
                ))}
              </select>
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                From
                <input
                  type="date"
                  name="from"
                  className="field"
                  defaultValue={valueOf(params.from) ?? ""}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                To
                <input
                  type="date"
                  name="to"
                  className="field"
                  defaultValue={valueOf(params.to) ?? ""}
                />
              </label>
              <button
                className="min-h-10 rounded-md bg-foreground px-4 text-sm font-medium text-background"
                type="submit"
              >
                Filter campaigns
              </button>
            </form>
            <PushCampaignList campaigns={campaigns} />
          </div>
        ) : null}
      </div>
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Supabase environment configuration")
    )
      return <SetupState />;
    return (
      <EmptyState
        title="Campaigns are not available"
        description={
          error instanceof Error
            ? error.message
            : "We could not load the campaign workspace."
        }
      />
    );
  }
}
