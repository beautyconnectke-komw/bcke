import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/domain/auth";
import {
  adminEmployerDecisionSchema,
  adminWorkerDecisionSchema,
  employerProfileSchema,
  marketplaceFiltersSchema,
  notificationIdSchema,
  requestWorkerSchema,
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
  type AdminEmailInput,
  type CategoryInput,
  type FeaturedWorkerIdsInput,
} from "@/lib/validations/admin";
import type { Database, Json, Tables } from "@/types/database";
import { AuthenticationRequiredError, DomainError } from "./errors";

type Supabase = SupabaseClient<Database, "public">;

const marketplaceSelect =
  "id, full_name, location, profile_photo_path, category_id, category_name, category_slug, years_experience, availability_status, created_at, updated_at, county, town, experience_months";
const workerProfileSelect =
  "id, full_name, location, profile_photo_path, category_id, category_name, category_slug, years_experience, short_bio, work_experience, skills, compensation_model, salary_expectation, commission_expectation, availability_status, created_at, updated_at, county, town, experience_months, extra_specialty_ids, extra_specialty_names, featured_rank";
const employerRequestSelect =
  "id, employer_profile_id, worker_profile_id, status, message, responded_at, expires_at, created_at, updated_at";
const handshakeSelect =
  "id, employer_profile_id, worker_profile_id, request_id, status, matched_at, completed_at, cancelled_at, created_at, updated_at";
const notificationSelect =
  "id, profile_id, type, title, body, data, read_at, created_at";
const workerProfileRowSelect =
  "id, profile_id, category_id, full_name, phone, location, county, town, profile_photo_path, years_experience, experience_months, experience_started_at, short_bio, work_experience, skills, extra_specialty_ids, featured_rank, compensation_model, salary_expectation, commission_expectation, verification_status, availability_status, is_suspended, public_visible, created_at, updated_at";
const employerProfileSelect =
  "id, profile_id, business_name, contact_person, phone, business_email, description, location, address_line, latitude, longitude, profile_image_path, salon_info, is_suspended, created_at, updated_at";
const portfolioSelect =
  "id, worker_profile_id, storage_bucket, storage_path, display_order, alt_text, created_at, updated_at";
const publicPortfolioSelect = portfolioSelect;
const gallerySelect =
  "id, employer_profile_id, storage_bucket, storage_path, display_order, created_at, updated_at";
const handshakeRowSelect =
  "id, employer_profile_id, worker_profile_id, request_id, status, matched_at, completed_at, cancelled_at, created_at, updated_at";
const categorySelect =
  "id, name, slug, is_active, display_order, created_at, updated_at";
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
  | "years_experience"
  | "availability_status"
  | "created_at"
  | "updated_at"
  | "county"
  | "town"
  | "experience_months"
>;
export type PublicEmployerProfile =
  Database["public"]["Views"]["public_employer_profiles"]["Row"];
export type Notification = Tables<"notifications">;
export type WorkerProfile = Tables<"worker_profiles">;
export type AdminWorker = WorkerProfile & {
  category_name: string | null;
  extra_specialty_names: string[];
};
export type AdminWorkerDetail = {
  worker: AdminWorker;
  portfolio: Tables<"worker_portfolio">[];
};
export type EmployerProfile = Tables<"employer_profiles">;
export type EmployerRequest = Tables<"employer_requests">;
export type Handshake = Tables<"handshakes">;
export type Category = Tables<"categories">;

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
};
export type WorkerStatusItem = WorkerRequestWithEmployer & {
  handshake: Handshake | null;
};
export type WorkerStatus = {
  pending: WorkerStatusItem[];
  accepted: WorkerStatusItem[];
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

export async function completeHandshake(requestId: string) {
  return respondToWorkerRequest({
    requestId,
    response: "accepted",
  });
}

export async function getWorkerMarketplace(
  filters: MarketplaceFiltersInput = {},
): Promise<WorkerMarketplaceItem[]> {
  const parsed = marketplaceFiltersSchema.parse(filters);
  const supabase = await createClient();

  let query = supabase
    .from("public_worker_profiles")
    .select(marketplaceSelect)
    .order("created_at", { ascending: false });

  if (parsed.categoryId) {
    query = query.eq("category_id", parsed.categoryId);
  }

  if (parsed.search) {
    const term = parsed.search.replace(/[,()]/g, " ");
    query = query.or(`full_name.ilike.%${term}%,category_name.ilike.%${term}%`);
  }

  if (parsed.availability) {
    query = query.eq("availability_status", parsed.availability);
  }

  if (parsed.minimumYearsExperience !== undefined) {
    query = query.gte("years_experience", parsed.minimumYearsExperience);
  }

  const { data, error } = await query.limit(48);
  normalizeError(error);
  return data ?? [];
}

export async function getWorkerProfile(workerProfileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_worker_profiles")
    .select(workerProfileSelect)
    .eq("id", workerProfileId)
    .maybeSingle();

  normalizeError(error);
  return data;
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

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(categorySelect)
    .eq("is_active", true)
    .order("display_order")
    .order("name")
    .limit(200);

  normalizeError(error);
  return data ?? [];
});

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
    .from("employer_profiles")
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
    .from("employer_profiles")
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
  if (!employer) return { pending: [], agreed: [] };

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

export async function getAdminWorkerDetails(
  workerProfileId: string,
): Promise<AdminWorkerDetail | null> {
  const { supabase } = await getAuthContext();
  const [
    { data: workerRow, error: workerError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase
      .from("worker_profiles")
      .select(workerProfileRowSelect)
      .eq("id", workerProfileId)
      .maybeSingle(),
    supabase.from("categories").select("id, name"),
  ]);
  normalizeError(workerError);
  normalizeError(categoriesError);
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
  return { worker, portfolio: portfolio ?? [] };
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
    })
    .select(categorySelect)
    .single();
  normalizeError(error);
  return data;
}

export async function toggleCategory(categoryId: string, isActive: boolean) {
  const { supabase } = await getAuthContext();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId);
  normalizeError(error);
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
    .from("employer_profiles")
    .select(
      "id, business_name, phone, business_email, description, location, address_line, profile_image_path, salon_info, created_at, updated_at",
    )
    .eq("id", employerProfileId)
    .maybeSingle();

  normalizeError(error);
  return data;
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
