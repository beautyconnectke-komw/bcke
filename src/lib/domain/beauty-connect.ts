import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidateTag, unstable_cache } from "next/cache";
import { cache } from "react";
import { getSupabaseConfig } from "@/config/env";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext, getOptionalAuthContext } from "@/lib/domain/auth";
import {
  adminEmployerDecisionSchema,
  adminWorkerDecisionSchema,
  employerProfileSchema,
  marketplaceFiltersSchema,
  notificationIdSchema,
  requestWorkerSchema,
  workerReactivationRequestSchema,
  respondToWorkerRequestSchema,
  uuidSchema,
  workerApplicationSchema,
  workerApplicationSubmissionSchema,
  workerContactProfileSchema,
  workerReviewedProfileSchema,
  type AdminWorkerDecisionInput,
  type AdminEmployerDecisionInput,
  type EmployerProfileInput,
  type MarketplaceFiltersInput,
  type RequestWorkerInput,
  type WorkerReactivationRequestInput,
  type RespondToWorkerRequestInput,
  type WorkerApplicationInput,
  type WorkerApplicationSubmissionInput,
  type WorkerContactProfileInput,
  type WorkerReviewedProfileInput,
} from "@/lib/validations/beauty-connect";
import {
  adminEmailSchema,
  categorySchema,
  featuredWorkerIdsSchema,
  companyContactSchema,
  type AdminEmailInput,
  type CategoryInput,
  type CompanyContactInput,
  type FeaturedWorkerIdsInput,
} from "@/lib/validations/admin";
import type { Database, Json, Tables } from "@/types/database";
import { AuthenticationRequiredError, DomainError } from "./errors";

type Supabase = SupabaseClient<Database, "public">;

const marketplaceSelect =
  "id, full_name, location, profile_photo_path, category_id, category_name, category_slug, extra_specialty_ids, extra_specialty_names, years_experience, compensation_model, salary_expectation, commission_expectation, availability_status, created_at, updated_at, county, town, experience_months, featured_rank";
const workerProfileSelect =
  "id, full_name, location, profile_photo_path, category_id, category_name, category_slug, years_experience, short_bio, work_experience, skills, compensation_model, salary_expectation, commission_expectation, availability_status, created_at, updated_at, county, town, experience_months, extra_specialty_ids, extra_specialty_names, featured_rank";
const employerRequestSelect =
  "id, employer_profile_id, worker_profile_id, status, message, responded_at, expires_at, created_at, updated_at";
const reactivationRequestSelect =
  "id, worker_profile_id, reason, status, reviewed_at, created_at, updated_at";
const workerProfileUpdateSelect =
  "id, worker_profile_id, category_id, profile_photo_path, extra_specialty_ids, portfolio_paths, status, reviewed_at, reviewed_by, created_at, updated_at";
const handshakeSelect =
  "id, employer_profile_id, worker_profile_id, request_id, status, matched_at, completed_at, cancelled_at, created_at, updated_at";
const notificationSelect =
  "id, profile_id, type, title, body, data, read_at, created_at";
const workerProfileRowSelect =
  "id, profile_id, category_id, full_name, phone, location, county, town, profile_photo_path, years_experience, experience_months, experience_started_at, short_bio, work_experience, skills, extra_specialty_ids, featured_rank, compensation_model, salary_expectation, commission_expectation, verification_status, availability_status, is_suspended, public_visible, created_at, updated_at";
const employerProfileSelect =
  "id, profile_id, business_name, contact_person, phone, business_email, description, location, address_line, latitude, longitude, profile_image_path, salon_info, is_suspended, created_at, updated_at";
const publicEmployerProfileSelect =
  "id, business_name, description, location, address_line, profile_image_path, salon_info, created_at, updated_at";
const portfolioSelect =
  "id, worker_profile_id, storage_bucket, storage_path, display_order, alt_text, created_at, updated_at";
const publicPortfolioSelect = portfolioSelect;
const gallerySelect =
  "id, employer_profile_id, storage_bucket, storage_path, display_order, created_at, updated_at";
const handshakeRowSelect =
  "id, employer_profile_id, worker_profile_id, request_id, status, matched_at, completed_at, cancelled_at, created_at, updated_at";
const categorySelect =
  "id, name, slug, is_active, display_order, image_path, created_at, updated_at";
const adminEmailSelect = "email, created_at";

type WorkerMarketplaceRow =
  Database["public"]["Views"]["public_worker_profiles"]["Row"];
export type WorkerMarketplaceItem = Pick<
  WorkerMarketplaceRow,
  | "id"
  | "full_name"
  | "location"
  | "profile_photo_path"
  | "category_id"
  | "category_name"
  | "category_slug"
  | "extra_specialty_ids"
  | "extra_specialty_names"
  | "years_experience"
  | "compensation_model"
  | "salary_expectation"
  | "commission_expectation"
  | "availability_status"
  | "created_at"
  | "updated_at"
  | "county"
  | "town"
  | "experience_months"
  | "featured_rank"
>;
export type WorkerMarketplacePage = {
  workers: WorkerMarketplaceItem[];
  hasMore: boolean;
  page: number;
};
export type PublicEmployerProfile =
  Database["public"]["Views"]["public_employer_profiles"]["Row"] & {
    contact_person: string | null;
    phone: string | null;
    business_email: string | null;
    contact_unlocked: boolean;
  };
export type Notification = Tables<"notifications">;
export type WorkerProfile = Tables<"worker_profiles">;
export type AdminWorker = WorkerProfile & {
  category_name: string | null;
  extra_specialty_names: string[];
};
export type ReactivationRequest = Tables<"worker_reactivation_requests">;
export type AdminReactivationRequest = ReactivationRequest & {
  worker: AdminWorker | null;
};
export type WorkerPublicProfile =
  Database["public"]["Views"]["public_worker_profiles"]["Row"] & {
    phone: string | null;
    contact_unlocked: boolean;
  };
export type AdminWorkerDetail = {
  worker: AdminWorker;
  portfolio: Tables<"worker_portfolio">[];
  profileUpdate: AdminWorkerProfileUpdate | null;
};
export type AdminWorkerProfileUpdate = Tables<"worker_profile_updates"> & {
  category_name: string | null;
  extra_specialty_names: string[];
};
export type AdminProfileUpdateRequest = AdminWorkerProfileUpdate & {
  worker: Pick<
    AdminWorker,
    "id" | "full_name" | "location" | "verification_status"
  > | null;
};
export type EmployerProfile = Tables<"employer_profiles">;
export type EmployerRequest = Tables<"employer_requests">;
export type Handshake = Tables<"handshakes">;
export type Category = Tables<"categories">;
export type CompanyContact = Pick<
  Tables<"company_settings">,
  "phone" | "email"
>;

export type WorkerRequestWithEmployer = EmployerRequest & {
  employer: Pick<
    EmployerProfile,
    "id" | "business_name" | "description" | "location" | "profile_image_path"
  > | null;
};

export type EmployerRequestWithWorker = EmployerRequest & {
  worker: WorkerMarketplaceItem | null;
};
export type EmployerStatusItem = EmployerRequestWithWorker & {
  handshake: Handshake | null;
};
export type EmployerStatus = {
  pending: EmployerStatusItem[];
  agreed: EmployerStatusItem[];
  declined: EmployerStatusItem[];
};
export type WorkerStatusItem = WorkerRequestWithEmployer & {
  handshake: Handshake | null;
};
export type WorkerStatus = {
  pending: WorkerStatusItem[];
  accepted: WorkerStatusItem[];
};
export type WorkerStatusPage = WorkerStatus & {
  hasMore: boolean;
  page: number;
};
export type EmployerStatusPage = EmployerStatus & {
  hasMore: boolean;
  page: number;
};
export type WorkerProfileAnalytics = {
  totalProfileViews: number;
  weeklyProfileViews: number;
  uniqueEmployerViews: number;
};

const getCurrentWorkerProfileForContext = cache(
  async (supabase: Supabase, userId: string): Promise<WorkerProfile | null> => {
    const { data, error } = await supabase
      .from("worker_profiles")
      .select(workerProfileRowSelect)
      .eq("profile_id", userId)
      .maybeSingle();

    normalizeError(error);
    return data;
  },
);

const getCurrentEmployerProfileForContext = cache(
  async (
    supabase: Supabase,
    userId: string,
  ): Promise<EmployerProfile | null> => {
    const { data, error } = await supabase
      .from("employer_profiles")
      .select(employerProfileSelect)
      .eq("profile_id", userId)
      .maybeSingle();

    normalizeError(error);
    return data;
  },
);

async function requireUser(supabase: Supabase) {
  const { data, error } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") {
    throw new AuthenticationRequiredError();
  }

  return { id: userId };
}

function normalizeError(error: { message: string } | null) {
  if (!error) {
    return;
  }

  throw new DomainError(error.message, error);
}

export async function createWorkerApplication(
  input: WorkerApplicationSubmissionInput,
  portfolioPaths: string[] = [],
) {
  const parsed = workerApplicationSubmissionSchema.parse(input);
  const supabase = await createClient();
  await requireUser(supabase);

  const { data, error } = await supabase.rpc("bc_submit_worker_application", {
    p_full_name: parsed.fullName,
    p_phone: parsed.phone ?? null,
    p_location: parsed.location ?? null,
    p_category_id: parsed.categoryId ?? null,
    p_profile_photo_path: parsed.profilePhotoPath ?? null,
    p_years_experience: parsed.yearsExperience,
    p_short_bio: parsed.shortBio ?? null,
    p_work_experience: parsed.workExperience ?? null,
    p_skills: parsed.skills,
    p_compensation_model: parsed.compensationModel,
    p_salary_expectation: parsed.salaryExpectation ?? null,
    p_commission_expectation: parsed.commissionExpectation ?? null,
    p_county: parsed.county,
    p_town: parsed.town,
    p_experience_months: parsed.experienceMonths,
    p_extra_specialty_ids: parsed.extraSpecialtyIds,
    p_portfolio_paths: portfolioPaths,
  });

  normalizeError(error);
  if (!data) {
    throw new DomainError("The worker application could not be created.");
  }
  const { error: roleError } = await supabase.rpc("bc_finalize_profile_role", {
    p_role: "worker",
  });
  normalizeError(roleError);
  return data;
}

export async function approveWorker(input: AdminWorkerDecisionInput) {
  const parsed = adminWorkerDecisionSchema.parse(input);
  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase.rpc("bc_approve_worker", {
    p_worker_profile_id: parsed.workerProfileId,
  });

  normalizeError(error);
}

export async function rejectWorker(input: AdminWorkerDecisionInput) {
  const parsed = adminWorkerDecisionSchema.parse(input);
  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase.rpc("bc_reject_worker", {
    p_worker_profile_id: parsed.workerProfileId,
    p_reason: parsed.reason ?? null,
  });

  normalizeError(error);
}

export async function suspendWorker(input: AdminWorkerDecisionInput) {
  const parsed = adminWorkerDecisionSchema.parse(input);
  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase.rpc("bc_suspend_worker", {
    p_worker_profile_id: parsed.workerProfileId,
    p_reason: parsed.reason ?? null,
  });

  normalizeError(error);
}

export async function restoreWorker(
  input: Pick<AdminWorkerDecisionInput, "workerProfileId">,
) {
  const parsed = adminWorkerDecisionSchema
    .pick({ workerProfileId: true })
    .parse(input);
  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase.rpc("bc_restore_worker", {
    p_worker_profile_id: parsed.workerProfileId,
  });

  normalizeError(error);
}

export async function suspendEmployer(input: AdminEmployerDecisionInput) {
  const parsed = adminEmployerDecisionSchema.parse(input);
  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase.rpc("bc_suspend_employer", {
    p_employer_profile_id: parsed.employerProfileId,
    p_reason: parsed.reason ?? null,
  });

  normalizeError(error);
}

export async function restoreEmployer(
  input: Pick<AdminEmployerDecisionInput, "employerProfileId">,
) {
  const parsed = adminEmployerDecisionSchema
    .pick({ employerProfileId: true })
    .parse(input);
  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase.rpc("bc_restore_employer", {
    p_employer_profile_id: parsed.employerProfileId,
  });

  normalizeError(error);
}

export async function updateWorkerProfile(input: WorkerContactProfileInput) {
  const parsed = workerContactProfileSchema.parse(input);
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const updatePayload = {
    phone: parsed.phone,
    county: parsed.county,
    town: parsed.town,
    short_bio: parsed.shortBio,
  };

  const { data, error } = await supabase
    .from("worker_profiles")
    .update(updatePayload)
    .eq("profile_id", user.id)
    .select()
    .single();

  normalizeError(error);
  return data;
}

export async function submitWorkerReviewedProfile(
  input: WorkerReviewedProfileInput,
) {
  const parsed = workerReviewedProfileSchema.parse(input);
  const { supabase, userId } = await getAuthContext();
  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id, verification_status")
    .eq("profile_id", userId)
    .maybeSingle();
  normalizeError(workerError);
  if (!worker) throw new DomainError("Your worker profile could not be found.");
  if (worker.verification_status !== "approved") {
    throw new DomainError(
      "Reviewed profile changes are available after your application is approved.",
    );
  }

  const { data, error } = await supabase.rpc(
    "bc_submit_worker_reviewed_profile",
    {
      p_worker_profile_id: worker.id,
      p_category_id: parsed.categoryId,
      p_profile_photo_path: parsed.profilePhotoPath ?? null,
      p_extra_specialty_ids: parsed.extraSpecialtyIds,
      p_portfolio_paths: parsed.portfolioPaths,
    },
  );
  normalizeError(error);
  return data;
}

export async function createEmployerProfile(input: EmployerProfileInput) {
  const parsed = employerProfileSchema.parse(input);
  const supabase = await createClient();
  await requireUser(supabase);

  const { data, error } = await supabase.rpc("bc_create_employer_profile", {
    p_business_name: parsed.businessName,
    p_contact_person: parsed.contactPerson ?? null,
    p_phone: parsed.phone ?? null,
    p_business_email: parsed.businessEmail ?? null,
    p_description: parsed.description ?? null,
    p_location: parsed.location ?? null,
    p_address_line: parsed.addressLine ?? null,
    p_latitude: parsed.latitude ?? null,
    p_longitude: parsed.longitude ?? null,
    p_profile_image_path: parsed.profileImagePath ?? null,
    p_salon_info: parsed.salonInfo as Json,
  });

  normalizeError(error);
  const { error: roleError } = await supabase.rpc("bc_finalize_profile_role", {
    p_role: "employer",
  });
  normalizeError(roleError);
  return data;
}

export async function removeEmployerGalleryImage(imageId: string) {
  const parsedImageId = uuidSchema.parse(imageId);
  const { supabase } = await getAuthContext();
  const { data: image, error: imageError } = await supabase
    .from("employer_gallery")
    .select("id, storage_bucket, storage_path")
    .eq("id", parsedImageId)
    .maybeSingle();

  normalizeError(imageError);
  if (!image) return;

  const { error: deleteError } = await supabase
    .from("employer_gallery")
    .delete()
    .eq("id", image.id);
  normalizeError(deleteError);

  const { error: storageError } = await supabase.storage
    .from(image.storage_bucket)
    .remove([image.storage_path]);
  normalizeError(storageError);
}

export async function requestWorker(input: RequestWorkerInput) {
  const parsed = requestWorkerSchema.parse(input);
  const supabase = await createClient();

  // bc_request_worker validates auth, employer ownership, worker state, and
  // the active-pair constraint inside the same database transaction. Avoid a
  // separate auth.getUser() round trip on this hot path.
  const { data, error } = await supabase.rpc("bc_request_worker", {
    p_worker_profile_id: parsed.workerProfileId,
    p_message: parsed.message ?? null,
  });

  if (
    error?.code === "23505" &&
    error.message.includes("employer_requests_one_active_pair")
  ) {
    throw new DomainError("Worker request already exists.", error);
  }

  normalizeError(error);
  return data;
}

export async function respondToWorkerRequest(
  input: RespondToWorkerRequestInput,
) {
  const parsed = respondToWorkerRequestSchema.parse(input);
  const supabase = await createClient();
  await requireUser(supabase);

  const { data, error } = await supabase.rpc("bc_respond_to_worker_request", {
    p_request_id: parsed.requestId,
    p_response: parsed.response,
  });

  normalizeError(error);
  return data;
}

export async function requestWorkerReactivation(
  input: WorkerReactivationRequestInput,
) {
  const parsed = workerReactivationRequestSchema.parse(input);
  const supabase = await createClient();
  await requireUser(supabase);

  const { data, error } = await supabase.rpc("bc_request_worker_reactivation", {
    p_reason: parsed.reason ?? null,
  });

  normalizeError(error);
  return data;
}

export async function completeHandshake(requestId: string) {
  return respondToWorkerRequest({
    requestId,
    response: "accepted",
  });
}

export async function getWorkerMarketplace(
  filters: MarketplaceFiltersInput = {},
  page = 1,
): Promise<WorkerMarketplacePage> {
  const parsed = marketplaceFiltersSchema.parse(filters);
  const supabase = await createClient();
  const safePage =
    Number.isInteger(page) && page > 0 ? Math.min(page, 1000) : 1;
  const pageSize = 20;
  const rankingWindowSize = 48;

  let query = supabase
    .from("public_worker_profiles")
    .select(marketplaceSelect)
    .order("featured_rank", { ascending: true, nullsFirst: false })
    .order("years_experience", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (parsed.categoryId) {
    query = query.eq("category_id", parsed.categoryId);
  }

  if (parsed.search) {
    const term = parsed.search.replace(/[%,*().]/g, " ").trim();
    if (term) {
      const matchingSpecialtyIds = (await getCategories())
        .filter((category) =>
          category.name.toLowerCase().includes(term.toLowerCase()),
        )
        .map((category) => category.id);
      const searchFilters = [
        `full_name.ilike.%${term}%`,
        `location.ilike.%${term}%`,
        `county.ilike.%${term}%`,
        `town.ilike.%${term}%`,
        `category_name.ilike.%${term}%`,
        ...matchingSpecialtyIds.map(
          (specialtyId) => `extra_specialty_ids.cs.{${specialtyId}}`,
        ),
      ];
      query = query.or(searchFilters.join(","));
    }
  }

  if (parsed.county) {
    const location = parsed.county.replace(/[%,*().]/g, " ").trim();
    if (location) {
      query = query.or(
        `county.ilike.%${location}%,town.ilike.%${location}%,location.ilike.%${location}%`,
      );
    }
  }

  if (parsed.extraSpecialtyId) {
    query = query.contains("extra_specialty_ids", [parsed.extraSpecialtyId]);
  }

  if (parsed.compensationModel) {
    query = query.eq("compensation_model", parsed.compensationModel);
  }

  if (parsed.availability) {
    query = query.eq("availability_status", parsed.availability);
  } else {
    // Matched workers are not eligible for a new employer request. Keep the
    // default marketplace bounded to workers the existing request workflow
    // can actually accept, while preserving explicit status filters.
    query = query.in("availability_status", ["available", "considering"]);
  }

  if (parsed.minimumYearsExperience !== undefined) {
    query = query.gte("years_experience", parsed.minimumYearsExperience);
  }

  // Keep the existing bounded ranking window intact so the deterministic
  // 15-minute ordering does not change between pages. Only the current page
  // is returned to the route, and the query never loads the full marketplace.
  const { data, error } = await query.limit(rankingWindowSize + 1);
  normalizeError(error);
  const rankedWorkers = rankMarketplaceWorkers(
    (data ?? []).slice(0, rankingWindowSize),
  );
  const start = (safePage - 1) * pageSize;
  return {
    workers: rankedWorkers.slice(start, start + pageSize),
    hasMore: start + pageSize < rankedWorkers.length,
    page: safePage,
  };
}

const MARKETPLACE_RANK_WINDOW_MS = 15 * 60 * 1000;
const STATUS_PAGE_SIZE = 10;

function rankMarketplaceWorkers(
  workers: WorkerMarketplaceItem[],
): WorkerMarketplaceItem[] {
  const rankWindow = Math.floor(Date.now() / MARKETPLACE_RANK_WINDOW_MS);

  return [...workers]
    .map((worker) => ({
      worker,
      score:
        (Math.min(Math.max(worker.years_experience ?? 0, 0), 20) / 20) * 0.35 +
        workerAgeScore(worker.created_at) * 0.15 +
        featuredRankScore(worker.featured_rank) * 0.15 +
        seededUnitValue(`${worker.id}:${rankWindow}`) * 0.35,
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.worker.id.localeCompare(right.worker.id),
    )
    .map(({ worker }) => worker);
}

function workerAgeScore(createdAt: string | null) {
  if (!createdAt) return 0;
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp)) return 0;
  return Math.min(
    Math.max(Date.now() - timestamp, 0) / (365 * 24 * 60 * 60 * 1000),
    1,
  );
}

function featuredRankScore(featuredRank: number | null) {
  if (featuredRank === null) return 0;
  return Math.max(0, 9 - Math.min(featuredRank, 8)) / 8;
}

function seededUnitValue(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

export async function getWorkerProfile(workerProfileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_worker_profiles")
    .select(workerProfileSelect)
    .eq("id", workerProfileId)
    .maybeSingle();

  normalizeError(error);
  if (!data) return null;

  let phone: string | null = null;
  let contactUnlocked = false;
  const auth = await getOptionalAuthContext();
  if (auth) {
    const { data: employer, error: employerError } = await auth.supabase
      .from("employer_profiles")
      .select("id")
      .eq("profile_id", auth.userId)
      .maybeSingle();
    normalizeError(employerError);

    if (employer) {
      const { data: handshake, error: handshakeError } = await auth.supabase
        .from("handshakes")
        .select("id")
        .eq("employer_profile_id", employer.id)
        .eq("worker_profile_id", workerProfileId)
        .in("status", ["matched", "completed"])
        .maybeSingle();
      normalizeError(handshakeError);
      contactUnlocked = Boolean(handshake);

      if (contactUnlocked) {
        const { data: contact, error: contactError } = await auth.supabase
          .from("worker_profiles")
          .select("phone")
          .eq("id", workerProfileId)
          .maybeSingle();
        normalizeError(contactError);
        phone = contact?.phone ?? null;
      }
    }
  }

  return { ...data, phone, contact_unlocked: contactUnlocked };
}

export async function recordWorkerProfileView(workerProfileId: string) {
  const parsedWorkerProfileId = uuidSchema.parse(workerProfileId);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bc_record_worker_profile_view", {
    p_worker_profile_id: parsedWorkerProfileId,
  });

  normalizeError(error);
  return data;
}

export async function getWorkerProfileAnalytics(): Promise<WorkerProfileAnalytics> {
  const { supabase, userId } = await getAuthContext();
  const worker = await getCurrentWorkerProfileForContext(supabase, userId);

  if (!worker) {
    return {
      totalProfileViews: 0,
      weeklyProfileViews: 0,
      uniqueEmployerViews: 0,
    };
  }

  let row:
    | {
        total_profile_views: number;
        weekly_profile_views: number;
        unique_employer_views: number;
      }
    | undefined;
  try {
    const { data, error } = await supabase.rpc(
      "bc_get_worker_profile_analytics",
      { p_worker_profile_id: worker.id },
    );
    normalizeError(error);
    row = data?.[0];
  } catch {
    // Analytics are optional until the analytics migration is deployed.
  }

  return {
    totalProfileViews: row?.total_profile_views ?? 0,
    weeklyProfileViews: row?.weekly_profile_views ?? 0,
    uniqueEmployerViews: row?.unique_employer_views ?? 0,
  };
}

export async function getCurrentWorkerProfile(): Promise<WorkerProfile | null> {
  const { supabase, userId } = await getAuthContext();
  return getCurrentWorkerProfileForContext(supabase, userId);
}

export async function getCurrentWorkerReactivationRequest(): Promise<ReactivationRequest | null> {
  const { supabase, userId } = await getAuthContext();
  const worker = await getCurrentWorkerProfileForContext(supabase, userId);
  if (!worker) return null;

  const { data, error } = await supabase
    .from("worker_reactivation_requests")
    .select(reactivationRequestSelect)
    .eq("worker_profile_id", worker.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  normalizeError(error);
  return data;
}

export async function getCurrentWorkerPortfolio() {
  const { supabase, userId } = await getAuthContext();
  const worker = await getCurrentWorkerProfileForContext(supabase, userId);
  if (!worker) return [];

  const { data, error } = await supabase
    .from("worker_portfolio")
    .select(portfolioSelect)
    .eq("worker_profile_id", worker.id)
    .order("display_order")
    .limit(50);
  normalizeError(error);
  return data ?? [];
}

export async function getCurrentEmployerProfile(): Promise<EmployerProfile | null> {
  const { supabase, userId } = await getAuthContext();
  return getCurrentEmployerProfileForContext(supabase, userId);
}

export async function getCurrentEmployerGallery(): Promise<
  Tables<"employer_gallery">[]
> {
  const { supabase, userId } = await getAuthContext();
  const employer = await getCurrentEmployerProfileForContext(supabase, userId);
  if (!employer) return [];

  const { data, error } = await supabase
    .from("employer_gallery")
    .select(gallerySelect)
    .eq("employer_profile_id", employer.id)
    .order("display_order")
    .limit(50);
  normalizeError(error);
  return data ?? [];
}

const CATEGORIES_CACHE_TAG = "beauty-connect:active-categories";

const getCachedCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const { url, publishableKey } = getSupabaseConfig();
    // Categories are explicitly public under RLS. Do not bind this cache to a
    // user's cookie-backed client or one user's session could key the result.
    const supabase = createSupabaseClient<Database>(url, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { data, error } = await supabase
      .from("categories")
      .select(categorySelect)
      .eq("is_active", true)
      .order("display_order")
      .order("name")
      .limit(200);

    normalizeError(error);
    return data ?? [];
  },
  ["beauty-connect", "active-categories"],
  { revalidate: 60, tags: [CATEGORIES_CACHE_TAG] },
);

export function getCategories(): Promise<Category[]> {
  return getCachedCategories();
}

export async function getSpecialityCarouselCategories(): Promise<Category[]> {
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createSupabaseClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { data, error } = await supabase.rpc("bc_get_speciality_carousel");

  if (error) {
    // Keep the carousel usable while an environment is waiting for the new
    // migration. The regular active-category ordering remains a safe fallback.
    return getCategories();
  }

  return data ?? [];
}

export async function getWorkerPortfolio(workerProfileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_worker_portfolio")
    .select(publicPortfolioSelect)
    .eq("worker_profile_id", workerProfileId)
    .order("display_order")
    .limit(50);

  normalizeError(error);
  return data ?? [];
}

export async function getWorkerRequests(): Promise<
  WorkerRequestWithEmployer[]
> {
  const { supabase, userId } = await getAuthContext();
  const worker = await getCurrentWorkerProfileForContext(supabase, userId);
  if (!worker) return [];

  return getWorkerRequestsForProfile(supabase, worker.id);
}

async function getWorkerRequestsForProfile(
  supabase: Supabase,
  workerProfileId: string,
): Promise<WorkerRequestWithEmployer[]> {
  const { data: requests, error } = await supabase
    .from("employer_requests")
    .select(employerRequestSelect)
    .eq("worker_profile_id", workerProfileId)
    .order("created_at", { ascending: false })
    .limit(50);

  normalizeError(error);
  if (!requests?.length) return [];

  const employerIds = [
    ...new Set(requests.map((request) => request.employer_profile_id)),
  ];
  const { data: employers, error: employerError } = await supabase
    .from("public_employer_profiles")
    .select("id, business_name, description, location, profile_image_path")
    .in("id", employerIds);

  normalizeError(employerError);
  const employerMap = new Map(
    (employers ?? []).map((employer) => [employer.id, employer]),
  );
  return requests.map((request) => ({
    ...request,
    employer: employerMap.get(request.employer_profile_id) ?? null,
  }));
}

export async function getCurrentWorkerRequestForEmployer(
  employerProfileId: string,
): Promise<WorkerRequestWithEmployer | null> {
  const parsedEmployerProfileId = uuidSchema.parse(employerProfileId);
  const { supabase, userId } = await getAuthContext();
  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();
  normalizeError(workerError);
  if (!worker) return null;

  const { data: request, error: requestError } = await supabase
    .from("employer_requests")
    .select(employerRequestSelect)
    .eq("worker_profile_id", worker.id)
    .eq("employer_profile_id", parsedEmployerProfileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  normalizeError(requestError);
  if (!request) return null;

  const { data: employer, error: employerError } = await supabase
    .from("public_employer_profiles")
    .select("id, business_name, description, location, profile_image_path")
    .eq("id", parsedEmployerProfileId)
    .maybeSingle();
  normalizeError(employerError);

  return { ...request, employer };
}

export async function getWorkerStatus(): Promise<WorkerStatus> {
  const { supabase, userId } = await getAuthContext();
  const worker = await getCurrentWorkerProfileForContext(supabase, userId);
  if (!worker) return { pending: [], accepted: [] };

  const [requests, handshakeResult] = await Promise.all([
    getWorkerRequestsForProfile(supabase, worker.id),
    supabase
      .from("handshakes")
      .select(handshakeSelect)
      .eq("worker_profile_id", worker.id)
      .in("status", ["matched", "completed"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  normalizeError(handshakeResult.error);

  const handshakeByRequestId = new Map(
    (handshakeResult.data ?? [])
      .filter((handshake) => handshake.request_id)
      .map((handshake) => [handshake.request_id, handshake]),
  );
  const items = requests.map((request) => ({
    ...request,
    handshake: handshakeByRequestId.get(request.id) ?? null,
  }));
  return {
    pending: items.filter(
      (item) => item.status === "pending" || item.status === "considering",
    ),
    accepted: items.filter(
      (item) => item.status === "accepted" || item.handshake !== null,
    ),
  };
}

export async function getWorkerStatusPage(page = 1): Promise<WorkerStatusPage> {
  const { supabase, userId } = await getAuthContext();
  const worker = await getCurrentWorkerProfileForContext(supabase, userId);
  const safePage =
    Number.isInteger(page) && page > 0 ? Math.min(page, 1000) : 1;
  if (!worker) {
    return { pending: [], accepted: [], hasMore: false, page: safePage };
  }

  const offset = (safePage - 1) * STATUS_PAGE_SIZE;
  const { data: requestRows, error: requestError } = await supabase
    .from("employer_requests")
    .select(employerRequestSelect)
    .eq("worker_profile_id", worker.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + STATUS_PAGE_SIZE);
  normalizeError(requestError);

  const hasMore = (requestRows?.length ?? 0) > STATUS_PAGE_SIZE;
  const requests = (requestRows ?? []).slice(0, STATUS_PAGE_SIZE);
  if (!requests.length) {
    return { pending: [], accepted: [], hasMore: false, page: safePage };
  }

  const employerIds = [
    ...new Set(requests.map((request) => request.employer_profile_id)),
  ];
  const requestIds = requests.map((request) => request.id);
  const [employerResult, handshakeResult] = await Promise.all([
    supabase
      .from("public_employer_profiles")
      .select("id, business_name, description, location, profile_image_path")
      .in("id", employerIds),
    supabase
      .from("handshakes")
      .select(handshakeSelect)
      .eq("worker_profile_id", worker.id)
      .in("request_id", requestIds)
      .in("status", ["matched", "completed"]),
  ]);
  normalizeError(employerResult.error);
  normalizeError(handshakeResult.error);

  const employerMap = new Map(
    (employerResult.data ?? []).map((employer) => [employer.id, employer]),
  );
  const handshakeByRequestId = new Map(
    (handshakeResult.data ?? [])
      .filter((handshake) => handshake.request_id)
      .map((handshake) => [handshake.request_id, handshake]),
  );
  const items = requests.map((request) => ({
    ...request,
    employer: employerMap.get(request.employer_profile_id) ?? null,
    handshake: handshakeByRequestId.get(request.id) ?? null,
  }));

  return {
    pending: items.filter(
      (item) => item.status === "pending" || item.status === "considering",
    ),
    accepted: items.filter(
      (item) => item.status === "accepted" || item.handshake !== null,
    ),
    hasMore,
    page: safePage,
  };
}

export async function getEmployerRequests(): Promise<
  EmployerRequestWithWorker[]
> {
  const { supabase, userId } = await getAuthContext();
  const employer = await getCurrentEmployerProfileForContext(supabase, userId);
  if (!employer) return [];

  return getEmployerRequestsForProfile(supabase, employer.id);
}

async function getEmployerRequestsForProfile(
  supabase: Supabase,
  employerProfileId: string,
): Promise<EmployerRequestWithWorker[]> {
  const { data: requests, error } = await supabase
    .from("employer_requests")
    .select(employerRequestSelect)
    .eq("employer_profile_id", employerProfileId)
    .order("created_at", { ascending: false })
    .limit(50);

  normalizeError(error);
  if (!requests?.length) return [];

  const workerIds = [
    ...new Set(requests.map((request) => request.worker_profile_id)),
  ];
  const { data: workers, error: workerError } = await supabase
    .from("public_worker_profiles")
    .select(marketplaceSelect)
    .in("id", workerIds);

  normalizeError(workerError);
  const workerMap = new Map(
    (workers ?? []).map((worker) => [worker.id, worker]),
  );
  return requests.map((request) => ({
    ...request,
    worker: workerMap.get(request.worker_profile_id) ?? null,
  }));
}

export async function getCurrentEmployerRequestForWorker(
  workerProfileId: string,
): Promise<EmployerRequest | null> {
  const parsedWorkerProfileId = uuidSchema.parse(workerProfileId);
  const { supabase, userId } = await getAuthContext();
  const employer = await getCurrentEmployerProfileForContext(supabase, userId);
  if (!employer) return null;

  const { data, error } = await supabase
    .from("employer_requests")
    .select(employerRequestSelect)
    .eq("employer_profile_id", employer.id)
    .eq("worker_profile_id", parsedWorkerProfileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  normalizeError(error);
  return data;
}

export async function getEmployerStatus(): Promise<EmployerStatus> {
  const { supabase, userId } = await getAuthContext();
  const employer = await getCurrentEmployerProfileForContext(supabase, userId);
  if (!employer) return { pending: [], agreed: [], declined: [] };

  const [requests, handshakeResult] = await Promise.all([
    getEmployerRequestsForProfile(supabase, employer.id),
    supabase
      .from("handshakes")
      .select(handshakeSelect)
      .eq("employer_profile_id", employer.id)
      .in("status", ["matched", "completed"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  normalizeError(handshakeResult.error);

  const handshakeByRequestId = new Map(
    (handshakeResult.data ?? [])
      .filter((handshake) => handshake.request_id)
      .map((handshake) => [handshake.request_id, handshake]),
  );
  const items = requests.map((request) => ({
    ...request,
    handshake: handshakeByRequestId.get(request.id) ?? null,
  }));

  return {
    pending: items.filter(
      (item) => item.status === "pending" || item.status === "considering",
    ),
    agreed: items.filter((item) => item.handshake !== null),
    declined: items.filter((item) => item.status === "declined"),
  };
}

export async function getEmployerStatusPage(
  page = 1,
): Promise<EmployerStatusPage> {
  const { supabase, userId } = await getAuthContext();
  const employer = await getCurrentEmployerProfileForContext(supabase, userId);
  const safePage =
    Number.isInteger(page) && page > 0 ? Math.min(page, 1000) : 1;
  if (!employer) {
    return {
      pending: [],
      agreed: [],
      declined: [],
      hasMore: false,
      page: safePage,
    };
  }

  const offset = (safePage - 1) * STATUS_PAGE_SIZE;
  const { data: requestRows, error: requestError } = await supabase
    .from("employer_requests")
    .select(employerRequestSelect)
    .eq("employer_profile_id", employer.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + STATUS_PAGE_SIZE);
  normalizeError(requestError);

  const hasMore = (requestRows?.length ?? 0) > STATUS_PAGE_SIZE;
  const requests = (requestRows ?? []).slice(0, STATUS_PAGE_SIZE);
  if (!requests.length) {
    return {
      pending: [],
      agreed: [],
      declined: [],
      hasMore: false,
      page: safePage,
    };
  }

  const workerIds = [
    ...new Set(requests.map((request) => request.worker_profile_id)),
  ];
  const requestIds = requests.map((request) => request.id);
  const [workerResult, handshakeResult] = await Promise.all([
    supabase
      .from("public_worker_profiles")
      .select(marketplaceSelect)
      .in("id", workerIds),
    supabase
      .from("handshakes")
      .select(handshakeSelect)
      .eq("employer_profile_id", employer.id)
      .in("request_id", requestIds)
      .in("status", ["matched", "completed"]),
  ]);
  normalizeError(workerResult.error);
  normalizeError(handshakeResult.error);

  const workerMap = new Map(
    (workerResult.data ?? []).map((worker) => [worker.id, worker]),
  );
  const handshakeByRequestId = new Map(
    (handshakeResult.data ?? [])
      .filter((handshake) => handshake.request_id)
      .map((handshake) => [handshake.request_id, handshake]),
  );
  const items = requests.map((request) => ({
    ...request,
    worker: workerMap.get(request.worker_profile_id) ?? null,
    handshake: handshakeByRequestId.get(request.id) ?? null,
  }));

  return {
    pending: items.filter(
      (item) => item.status === "pending" || item.status === "considering",
    ),
    agreed: items.filter((item) => item.handshake !== null),
    declined: items.filter((item) => item.status === "declined"),
    hasMore,
    page: safePage,
  };
}

export async function getAdminMetrics() {
  const { supabase } = await getAuthContext();
  const [workers, pending, approved, employers, requests, handshakes] =
    await Promise.all([
      supabase
        .from("worker_profiles")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("worker_profiles")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "pending_review"),
      supabase
        .from("worker_profiles")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "approved")
        .eq("is_suspended", false),
      supabase
        .from("employer_profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_suspended", false),
      supabase
        .from("employer_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "considering"]),
      supabase
        .from("handshakes")
        .select("id", { count: "exact", head: true })
        .in("status", ["matched", "completed"]),
    ]);

  [workers, pending, approved, employers, requests, handshakes].forEach(
    (result) => normalizeError(result.error),
  );
  return {
    workers: workers.count ?? 0,
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    employers: employers.count ?? 0,
    requests: requests.count ?? 0,
    handshakes: handshakes.count ?? 0,
  };
}

export async function getAdminWorkers(): Promise<AdminWorker[]> {
  const { supabase } = await getAuthContext();
  const [{ data, error }, { data: categories, error: categoriesError }] =
    await Promise.all([
      supabase
        .from("worker_profiles")
        .select(workerProfileRowSelect)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("categories").select("id, name"),
    ]);
  normalizeError(error);
  normalizeError(categoriesError);
  const categoryNames = new Map(
    (categories ?? []).map((category) => [category.id, category.name]),
  );
  return (data ?? []).map((worker) => ({
    ...worker,
    category_name: worker.category_id
      ? (categoryNames.get(worker.category_id) ?? null)
      : null,
    extra_specialty_names: worker.extra_specialty_ids
      .map((specialtyId) => categoryNames.get(specialtyId))
      .filter((name): name is string => Boolean(name)),
  }));
}

export async function getAdminProfileUpdates(): Promise<
  AdminProfileUpdateRequest[]
> {
  const { supabase } = await getAuthContext();
  const { data: updates, error } = await supabase
    .from("worker_profile_updates")
    .select(workerProfileUpdateSelect)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);
  normalizeError(error);
  if (!updates?.length) return [];

  const workerIds = [
    ...new Set(updates.map((update) => update.worker_profile_id)),
  ];
  const [
    { data: workers, error: workerError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase
      .from("worker_profiles")
      .select(workerProfileRowSelect)
      .in("id", workerIds),
    supabase.from("categories").select("id, name"),
  ]);
  normalizeError(workerError);
  normalizeError(categoriesError);

  const categoryNames = new Map(
    (categories ?? []).map((category) => [category.id, category.name]),
  );
  const workerMap = new Map(
    (workers ?? []).map((worker) => [worker.id, worker]),
  );

  return updates.map((update) => ({
    ...update,
    category_name: categoryNames.get(update.category_id) ?? null,
    extra_specialty_names: update.extra_specialty_ids
      .map((specialtyId) => categoryNames.get(specialtyId))
      .filter((name): name is string => Boolean(name)),
    worker: workerMap.has(update.worker_profile_id)
      ? (() => {
          const worker = workerMap.get(update.worker_profile_id)!;
          return {
            id: worker.id,
            full_name: worker.full_name,
            location: worker.location,
            verification_status: worker.verification_status,
          };
        })()
      : null,
  }));
}

export async function getAdminReactivationRequests(): Promise<
  AdminReactivationRequest[]
> {
  const { supabase } = await getAuthContext();
  const { data: requests, error } = await supabase
    .from("worker_reactivation_requests")
    .select(reactivationRequestSelect)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);
  normalizeError(error);
  if (!requests?.length) return [];

  const workerIds = [
    ...new Set(requests.map((request) => request.worker_profile_id)),
  ];
  const [
    { data: workerRows, error: workerError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase
      .from("worker_profiles")
      .select(workerProfileRowSelect)
      .in("id", workerIds),
    supabase.from("categories").select("id, name"),
  ]);
  normalizeError(workerError);
  normalizeError(categoriesError);
  const categoryNames = new Map(
    (categories ?? []).map((category) => [category.id, category.name]),
  );
  const workersById = new Map(
    (workerRows ?? []).map((worker) => [
      worker.id,
      {
        ...worker,
        category_name: worker.category_id
          ? (categoryNames.get(worker.category_id) ?? null)
          : null,
        extra_specialty_names: worker.extra_specialty_ids
          .map((specialtyId) => categoryNames.get(specialtyId))
          .filter((name): name is string => Boolean(name)),
      },
    ]),
  );
  return requests.map((request) => ({
    ...request,
    worker: workersById.get(request.worker_profile_id) ?? null,
  }));
}

export async function approveWorkerReactivation(requestId: string) {
  const parsedRequestId = uuidSchema.parse(requestId);
  const supabase = await createClient();
  const { error } = await supabase.rpc("bc_approve_worker_reactivation", {
    p_request_id: parsedRequestId,
  });
  normalizeError(error);
}

export async function declineWorkerReactivation(
  requestId: string,
  reason?: string | null,
) {
  const parsedRequestId = uuidSchema.parse(requestId);
  const parsedReason = workerReactivationRequestSchema
    .pick({ reason: true })
    .parse({ reason }).reason;
  const supabase = await createClient();
  const { error } = await supabase.rpc("bc_decline_worker_reactivation", {
    p_request_id: parsedRequestId,
    p_reason: parsedReason ?? null,
  });
  normalizeError(error);
}

export async function getAdminWorkerDetails(
  workerProfileId: string,
): Promise<AdminWorkerDetail | null> {
  const { supabase } = await getAuthContext();
  const [
    { data: workerRow, error: workerError },
    { data: categories, error: categoriesError },
    { data: profileUpdate, error: profileUpdateError },
  ] = await Promise.all([
    supabase
      .from("worker_profiles")
      .select(workerProfileRowSelect)
      .eq("id", workerProfileId)
      .maybeSingle(),
    supabase.from("categories").select("id, name"),
    supabase
      .from("worker_profile_updates")
      .select(workerProfileUpdateSelect)
      .eq("worker_profile_id", workerProfileId)
      .eq("status", "pending")
      .maybeSingle(),
  ]);
  normalizeError(workerError);
  normalizeError(categoriesError);
  normalizeError(profileUpdateError);
  if (!workerRow) return null;

  const categoryNames = new Map(
    (categories ?? []).map((category) => [category.id, category.name]),
  );
  const worker: AdminWorker = {
    ...workerRow,
    category_name: workerRow.category_id
      ? (categoryNames.get(workerRow.category_id) ?? null)
      : null,
    extra_specialty_names: workerRow.extra_specialty_ids
      .map((specialtyId) => categoryNames.get(specialtyId))
      .filter((name): name is string => Boolean(name)),
  };

  const { data: portfolio, error } = await supabase
    .from("worker_portfolio")
    .select("*")
    .eq("worker_profile_id", worker.id)
    .order("display_order");
  normalizeError(error);
  return {
    worker,
    portfolio: portfolio ?? [],
    profileUpdate: profileUpdate
      ? {
          ...profileUpdate,
          category_name: categoryNames.get(profileUpdate.category_id) ?? null,
          extra_specialty_names: profileUpdate.extra_specialty_ids
            .map((specialtyId) => categoryNames.get(specialtyId))
            .filter((name): name is string => Boolean(name)),
        }
      : null,
  };
}

export async function approveWorkerProfileUpdate(updateId: string) {
  const parsedUpdateId = uuidSchema.parse(updateId);
  const supabase = await createClient();
  const { error } = await supabase.rpc("bc_approve_worker_profile_update", {
    p_update_id: parsedUpdateId,
  });
  normalizeError(error);
}

export async function rejectWorkerProfileUpdate(
  updateId: string,
  reason?: string | null,
) {
  const parsedUpdateId = uuidSchema.parse(updateId);
  const parsedReason = workerReactivationRequestSchema
    .pick({ reason: true })
    .parse({ reason }).reason;
  const supabase = await createClient();
  const { error } = await supabase.rpc("bc_reject_worker_profile_update", {
    p_update_id: parsedUpdateId,
    p_reason: parsedReason ?? null,
  });
  normalizeError(error);
}

export async function getAdminEmailWhitelist() {
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase
    .from("admin_email_whitelist")
    .select(adminEmailSelect)
    .order("created_at", { ascending: false })
    .limit(100);
  normalizeError(error);
  return data ?? [];
}

export async function getCompanyContact(): Promise<CompanyContact> {
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase
    .from("company_settings")
    .select("phone, email")
    .eq("id", 1)
    .maybeSingle();
  normalizeError(error);
  return data ?? { phone: null, email: null };
}

export async function updateCompanyContact(input: CompanyContactInput) {
  const parsed = companyContactSchema.parse(input);
  const { supabase, profile } = await getAuthContext();
  if (profile?.role !== "admin") {
    throw new DomainError("Admin authorization is required.");
  }

  const { error } = await supabase.rpc("bc_update_company_settings", {
    p_phone: parsed.phone,
    p_email: parsed.email,
  });
  normalizeError(error);
}

async function verifyCurrentPassword(password: string) {
  if (typeof password !== "string" || password.length === 0) {
    throw new DomainError("Enter your password to continue.");
  }

  const { supabase } = await getAuthContext();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user?.email) {
    throw new AuthenticationRequiredError();
  }

  const { url, publishableKey } = getSupabaseConfig();
  const verifier = createSupabaseClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { error: passwordError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (passwordError) {
    throw new DomainError("The password you entered is incorrect.");
  }
}

export async function verifyAccountPassword(password: string) {
  await verifyCurrentPassword(password);
}

export async function requestAccountDeletion(password: string) {
  await verifyCurrentPassword(password);
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase.rpc("bc_request_account_deletion");
  normalizeError(error);
  return data;
}

export async function addAdminEmail(input: AdminEmailInput) {
  const parsed = adminEmailSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bc_add_admin_email_whitelist", {
    p_email: parsed.email,
  });
  normalizeError(error);
  return data;
}

export async function removeAdminEmail(email: string) {
  const parsed = adminEmailSchema.parse({ email });
  const supabase = await createClient();
  const { error } = await supabase.rpc("bc_remove_admin_email_whitelist", {
    p_email: parsed.email,
  });
  normalizeError(error);
}

export async function setFeaturedWorkers(input: FeaturedWorkerIdsInput) {
  const parsed = featuredWorkerIdsSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.rpc("bc_set_featured_workers", {
    p_worker_profile_ids: parsed,
  });
  normalizeError(error);
}

export async function getFeaturedWorkers(): Promise<WorkerMarketplaceItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_worker_profiles")
    .select(marketplaceSelect)
    .not("featured_rank", "is", null)
    .order("featured_rank", { ascending: true })
    .limit(8);
  normalizeError(error);
  return data ?? [];
}

export async function getAdminEmployers() {
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase
    .from("employer_profiles")
    .select(employerProfileSelect)
    .order("created_at", { ascending: false })
    .limit(100);
  normalizeError(error);
  return data ?? [];
}

export async function getAdminEmployer(employerProfileId: string) {
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase
    .from("employer_profiles")
    .select(employerProfileSelect)
    .eq("id", employerProfileId)
    .maybeSingle();
  normalizeError(error);
  return data;
}

export async function getAdminHandshakes() {
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase
    .from("handshakes")
    .select(handshakeRowSelect)
    .order("created_at", { ascending: false })
    .limit(100);
  normalizeError(error);
  return data ?? [];
}

export async function getAdminCategories() {
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase
    .from("categories")
    .select(categorySelect)
    .order("display_order")
    .order("name")
    .limit(200);
  normalizeError(error);
  return data ?? [];
}

export async function createCategory(input: CategoryInput) {
  const parsed = categorySchema.parse(input);
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: parsed.name,
      slug: parsed.slug,
      display_order: parsed.displayOrder,
      image_path: parsed.imagePath ?? null,
    })
    .select(categorySelect)
    .single();
  normalizeError(error);
  revalidateTag(CATEGORIES_CACHE_TAG, { expire: 0 });
  return data;
}

export async function updateCategoryImage(
  categoryId: string,
  imagePath: string | null,
) {
  const parsedCategoryId = uuidSchema.parse(categoryId);
  const parsedImagePath = categorySchema.shape.imagePath.parse(imagePath);
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase
    .from("categories")
    .update({ image_path: parsedImagePath ?? null })
    .eq("id", parsedCategoryId)
    .select(categorySelect)
    .single();
  normalizeError(error);
  revalidateTag(CATEGORIES_CACHE_TAG, { expire: 0 });
  return data;
}

export async function toggleCategory(categoryId: string, isActive: boolean) {
  const { supabase } = await getAuthContext();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId);
  normalizeError(error);
  revalidateTag(CATEGORIES_CACHE_TAG, { expire: 0 });
}

export async function saveWorkerDraft(input: WorkerApplicationInput) {
  const parsed = workerApplicationSchema.parse(input);
  const { supabase, userId } = await getAuthContext();
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      role: null,
      display_name: parsed.fullName,
      phone: parsed.phone ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  normalizeError(profileError);
  const { data, error } = await supabase
    .from("worker_profiles")
    .upsert(
      {
        profile_id: userId,
        full_name: parsed.fullName,
        phone: parsed.phone ?? null,
        location: parsed.location ?? null,
        county: parsed.county ?? null,
        town: parsed.town ?? null,
        category_id: parsed.categoryId ?? null,
        profile_photo_path: parsed.profilePhotoPath ?? null,
        years_experience: parsed.yearsExperience,
        experience_months: parsed.experienceMonths,
        short_bio: parsed.shortBio ?? null,
        work_experience: parsed.workExperience ?? null,
        skills: parsed.skills,
        extra_specialty_ids: parsed.extraSpecialtyIds,
        compensation_model: parsed.compensationModel,
        salary_expectation: parsed.salaryExpectation ?? null,
        commission_expectation: parsed.commissionExpectation ?? null,
        verification_status: "draft",
        availability_status: "available",
        is_suspended: false,
      },
      { onConflict: "profile_id" },
    )
    .select()
    .single();

  normalizeError(error);
  return data;
}

export async function updateWorkerAvailability(
  availability: "available" | "considering",
) {
  const supabase = await createClient();
  await requireUser(supabase);
  const { error } = await supabase.rpc("bc_update_worker_availability", {
    p_availability: availability,
  });
  normalizeError(error);
}

export async function getEmployerProfile(
  employerProfileId: string,
): Promise<PublicEmployerProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_employer_profiles")
    .select(publicEmployerProfileSelect)
    .eq("id", employerProfileId)
    .maybeSingle();

  normalizeError(error);
  if (!data) return null;

  let contactPerson: string | null = null;
  let phone: string | null = null;
  let businessEmail: string | null = null;
  let contactUnlocked = false;
  const auth = await getOptionalAuthContext();
  if (auth) {
    const { data: worker, error: workerError } = await auth.supabase
      .from("worker_profiles")
      .select("id")
      .eq("profile_id", auth.userId)
      .maybeSingle();
    normalizeError(workerError);

    if (worker) {
      const { data: handshake, error: handshakeError } = await auth.supabase
        .from("handshakes")
        .select("id")
        .eq("employer_profile_id", employerProfileId)
        .eq("worker_profile_id", worker.id)
        .in("status", ["matched", "completed"])
        .maybeSingle();
      normalizeError(handshakeError);

      if (handshake) {
        contactUnlocked = true;
        const { data: contact, error: contactError } = await auth.supabase
          .from("employer_profiles")
          .select("contact_person, phone, business_email")
          .eq("id", employerProfileId)
          .maybeSingle();
        normalizeError(contactError);
        contactPerson = contact?.contact_person ?? null;
        phone = contact?.phone ?? null;
        businessEmail = contact?.business_email ?? null;
      }
    }
  }

  return {
    ...data,
    contact_person: contactPerson,
    phone,
    business_email: businessEmail,
    contact_unlocked: contactUnlocked,
  };
}

export async function getEmployerGallery(employerProfileId: string) {
  const parsedId = uuidSchema.parse(employerProfileId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employer_gallery")
    .select(gallerySelect)
    .eq("employer_profile_id", parsedId)
    .order("display_order")
    .limit(50);

  normalizeError(error);
  return data ?? [];
}

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data, error } = await supabase
    .from("notifications")
    .select(notificationSelect)
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  normalizeError(error);
  return data ?? [];
}

export async function markNotificationRead(input: { notificationId: string }) {
  const parsed = notificationIdSchema.parse(input);
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.notificationId)
    .eq("profile_id", user.id)
    .select()
    .single();

  normalizeError(error);
  return data;
}
