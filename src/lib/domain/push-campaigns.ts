import "server-only";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/domain/auth";
import { AuthorizationError, DomainError } from "@/lib/domain/errors";
import type { Tables } from "@/types/database";
import {
  pushCampaignAudiencePreviewSchema,
  pushCampaignSchema,
  type PushCampaignAudiencePreviewInput,
  type PushCampaignInput,
} from "@/lib/validations/push-campaign";

const campaignSelect =
  "id, created_by, title, body, target, campaign_type, status, audience_mode, audience_percentage, audience_estimated_count, audience_selected_count, campaign_period_days, sends_per_recipient, starts_at, ends_at, delivery_window_start, delivery_window_end, delivery_timezone, county, specialty_id, specialty_scope, promoted_worker_profile_id, worker_destination, employer_destination, recipient_count, scheduled_delivery_count, sent_count, failed_count, created_at, updated_at";

type PushCampaign = Tables<"push_campaigns">;

export type PushCampaignWorker = {
  id: string;
  full_name: string;
  county: string | null;
  category_id: string | null;
  extra_specialty_ids: string[];
};

export type PushCampaignAnalytics = {
  intended_audience: number;
  scheduled_recipients: number;
  sent: number;
  delivered: number;
  failed: number;
  profile_visits: number;
  opened: number;
  clicked: number;
};

export type PushCampaignDetails = {
  campaign: PushCampaign;
  specialtyName: string | null;
  promotedWorkerName: string | null;
  analytics: PushCampaignAnalytics | null;
};

export type PushCampaignListItem = PushCampaign & {
  specialtyName: string | null;
  promotedWorkerName: string | null;
};

export type PushCampaignFilters = {
  target?: PushCampaign["target"];
  campaignType?: PushCampaign["campaign_type"];
  status?: PushCampaign["status"];
  activity?: "active" | "inactive";
  periodDays?: number;
  fromDate?: string;
  toDate?: string;
  promotedWorkerProfileId?: string;
};

function normalizeError(error: { message: string } | null) {
  if (error) throw new DomainError(error.message, error);
}

async function requireAdmin() {
  const context = await getAuthContext();
  if (context.profile?.role !== "admin") throw new AuthorizationError();
  return context;
}

function getCampaignTimes(input: PushCampaignInput) {
  const startsAt =
    input.startMode === "now" ? new Date() : new Date(input.startsAt ?? "");
  if (Number.isNaN(startsAt.getTime())) {
    throw new DomainError("Choose a valid campaign start time.");
  }
  if (startsAt.getTime() < Date.now() - 60_000) {
    throw new DomainError("Campaign start cannot be in the past.");
  }

  const endsAt = new Date(
    startsAt.getTime() + input.campaignPeriodDays * 24 * 60 * 60 * 1000,
  );
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

function toPreviewInput(
  input: PushCampaignInput,
): PushCampaignAudiencePreviewInput {
  return pushCampaignAudiencePreviewSchema.parse({
    target: input.target,
    campaignType: input.campaignType,
    audienceMode: input.audienceMode,
    audiencePercentage:
      input.audienceMode === "all" ? 100 : input.audiencePercentage,
    county: input.county,
    specialtyId: input.specialtyId,
    specialtyScope: input.specialtyScope,
    promotedWorkerProfileId: input.promotedWorkerProfileId,
  });
}

export async function getPushCampaignSetupData() {
  const { supabase } = await requireAdmin();
  const [
    { data: categories, error: categoriesError },
    { data: workers, error: workersError },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("display_order")
      .order("name"),
    supabase
      .from("worker_profiles")
      .select("id, full_name, county, category_id, extra_specialty_ids")
      .eq("verification_status", "approved")
      .eq("is_suspended", false)
      .eq("public_visible", true)
      .order("full_name")
      .limit(50),
  ]);
  normalizeError(categoriesError);
  normalizeError(workersError);
  return { categories: categories ?? [], workers: workers ?? [] };
}

export async function searchPushCampaignWorkers(search: string) {
  const { supabase } = await requireAdmin();
  const term = search.trim().replace(/[%_,]/g, " ");
  let query = supabase
    .from("worker_profiles")
    .select("id, full_name, county, category_id, extra_specialty_ids")
    .eq("verification_status", "approved")
    .eq("is_suspended", false)
    .eq("public_visible", true)
    .order("full_name")
    .limit(50);
  if (term) query = query.ilike("full_name", `%${term}%`);
  const { data, error } = await query;
  normalizeError(error);
  return data ?? [];
}

export async function previewPushCampaignAudience(input: PushCampaignInput) {
  const { supabase } = await requireAdmin();
  const parsed = toPreviewInput(input);
  const { data, error } = await supabase.rpc(
    "bc_preview_push_campaign_audience",
    {
      p_target: parsed.target,
      p_campaign_type: parsed.campaignType,
      p_audience_percentage: parsed.audiencePercentage,
      p_county: parsed.county,
      p_specialty_id: parsed.specialtyId,
      p_specialty_scope: parsed.specialtyScope,
      p_promoted_worker_profile_id: parsed.promotedWorkerProfileId,
    },
  );
  normalizeError(error);
  return data?.[0] ?? { eligible_count: 0, selected_count: 0 };
}

async function createCampaign(input: PushCampaignInput) {
  const { supabase } = await requireAdmin();
  const parsed = pushCampaignSchema.parse(input);
  const { startsAt, endsAt } = getCampaignTimes(parsed);
  const { data, error } = await supabase.rpc("bc_create_push_campaign", {
    p_title: parsed.title,
    p_body: parsed.body,
    p_target: parsed.target,
    p_campaign_type: parsed.campaignType,
    p_audience_mode: parsed.audienceMode,
    p_audience_percentage:
      parsed.audienceMode === "all" ? 100 : parsed.audiencePercentage,
    p_campaign_period_days: parsed.campaignPeriodDays,
    p_sends_per_recipient: parsed.sendsPerRecipient,
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_delivery_window_start: parsed.deliveryWindowStart,
    p_delivery_window_end: parsed.deliveryWindowEnd,
    p_delivery_timezone: parsed.deliveryTimezone,
    p_county: parsed.county,
    p_specialty_id: parsed.specialtyId,
    p_specialty_scope: parsed.specialtyScope,
    p_promoted_worker_profile_id: parsed.promotedWorkerProfileId,
    p_worker_destination: parsed.workerDestination,
    p_employer_destination: parsed.employerDestination,
  });
  normalizeError(error);
  if (!data) throw new DomainError("The campaign could not be created.");
  return data;
}

export async function createPushCampaignDraft(input: PushCampaignInput) {
  const id = await createCampaign(input);
  revalidatePath("/admin/campaigns");
  return id;
}

export async function createAndActivatePushCampaign(input: PushCampaignInput) {
  const { supabase } = await requireAdmin();
  const id = await createCampaign(input);
  const { error } = await supabase.rpc("bc_activate_push_campaign", {
    p_campaign_id: id,
  });
  normalizeError(error);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  return id;
}

export async function getPushCampaigns(filters: PushCampaignFilters = {}) {
  const { supabase } = await requireAdmin();
  let query = supabase
    .from("push_campaigns")
    .select(campaignSelect)
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.target) query = query.eq("target", filters.target);
  if (filters.campaignType)
    query = query.eq("campaign_type", filters.campaignType);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.activity === "active")
    query = query.in("status", ["scheduled", "active", "paused"]);
  if (filters.activity === "inactive")
    query = query.in("status", ["draft", "completed", "cancelled"]);
  if (filters.periodDays)
    query = query.eq("campaign_period_days", filters.periodDays);
  if (filters.fromDate) query = query.gte("starts_at", filters.fromDate);
  if (filters.toDate) query = query.lte("starts_at", filters.toDate);
  if (filters.promotedWorkerProfileId) {
    query = query.eq(
      "promoted_worker_profile_id",
      filters.promotedWorkerProfileId,
    );
  }
  const { data, error } = await query;
  normalizeError(error);
  const campaigns = data ?? [];
  const specialtyIds = campaigns
    .map((campaign) => campaign.specialty_id)
    .filter((id): id is string => Boolean(id));
  const workerIds = campaigns
    .map((campaign) => campaign.promoted_worker_profile_id)
    .filter((id): id is string => Boolean(id));
  const [
    { data: categories, error: categoriesError },
    { data: workers, error: workersError },
  ] = await Promise.all([
    specialtyIds.length
      ? supabase.from("categories").select("id, name").in("id", specialtyIds)
      : Promise.resolve({ data: [], error: null }),
    workerIds.length
      ? supabase
          .from("worker_profiles")
          .select("id, full_name")
          .in("id", workerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  normalizeError(categoriesError);
  normalizeError(workersError);
  const categoryNames = new Map(
    (categories ?? []).map((category) => [category.id, category.name]),
  );
  const workerNames = new Map(
    (workers ?? []).map((worker) => [worker.id, worker.full_name]),
  );
  return campaigns.map((campaign) => ({
    ...campaign,
    specialtyName: campaign.specialty_id
      ? (categoryNames.get(campaign.specialty_id) ?? null)
      : null,
    promotedWorkerName: campaign.promoted_worker_profile_id
      ? (workerNames.get(campaign.promoted_worker_profile_id) ?? null)
      : null,
  }));
}

export async function getPushCampaignDetails(
  campaignId: string,
): Promise<PushCampaignDetails | null> {
  const { supabase } = await requireAdmin();
  const [
    { data: campaign, error: campaignError },
    { data: analytics, error: analyticsError },
  ] = await Promise.all([
    supabase
      .from("push_campaigns")
      .select(campaignSelect)
      .eq("id", campaignId)
      .maybeSingle(),
    supabase.rpc("bc_get_push_campaign_analytics", {
      p_campaign_id: campaignId,
    }),
  ]);
  normalizeError(campaignError);
  normalizeError(analyticsError);
  if (!campaign) return null;

  const [
    { data: specialty, error: specialtyError },
    { data: worker, error: workerError },
  ] = await Promise.all([
    campaign.specialty_id
      ? supabase
          .from("categories")
          .select("name")
          .eq("id", campaign.specialty_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    campaign.promoted_worker_profile_id
      ? supabase
          .from("worker_profiles")
          .select("full_name")
          .eq("id", campaign.promoted_worker_profile_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  normalizeError(specialtyError);
  normalizeError(workerError);
  return {
    campaign,
    specialtyName: specialty?.name ?? null,
    promotedWorkerName: worker?.full_name ?? null,
    analytics: analytics?.[0] ?? null,
  };
}

export async function pausePushCampaign(campaignId: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("bc_pause_push_campaign", {
    p_campaign_id: campaignId,
  });
  normalizeError(error);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);
  return data;
}

export async function resumePushCampaign(campaignId: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("bc_resume_push_campaign", {
    p_campaign_id: campaignId,
  });
  normalizeError(error);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);
  return data;
}

export async function cancelPushCampaign(campaignId: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("bc_cancel_push_campaign", {
    p_campaign_id: campaignId,
  });
  normalizeError(error);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);
  return data;
}

export async function duplicatePushCampaign(campaignId: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("bc_duplicate_push_campaign", {
    p_campaign_id: campaignId,
  });
  normalizeError(error);
  revalidatePath("/admin/campaigns");
  return data;
}
