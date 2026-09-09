import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
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

export type WorkerMarketplaceItem =
  Database["public"]["Views"]["public_worker_profiles"]["Row"];
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

async function requireUser(supabase: Supabase) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationRequiredError();
  }

  return user;
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
  await requireUser(supabase);

  const { data, error } = await supabase.rpc("bc_request_worker", {
    p_worker_profile_id: parsed.workerProfileId,
    p_message: parsed.message ?? null,
  });

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
    .select("*")
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

  const { data, error } = await query;
  normalizeError(error);
  return data ?? [];
}

export async function getWorkerProfile(workerProfileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_worker_profiles")
    .select("*")
    .eq("id", workerProfileId)
    .maybeSingle();

  normalizeError(error);
  return data;
}

export async function getCurrentWorkerProfile(): Promise<WorkerProfile | null> {
  const { supabase, userId } = await getAuthContext();
  const { data, error } = await supabase
    .from("worker_profiles")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();

  normalizeError(error);
  return data;
}

export async function getCurrentWorkerPortfolio() {
  const { supabase, userId } = await getAuthContext();
  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();
  normalizeError(workerError);
  if (!worker) return [];

  const { data, error } = await supabase
    .from("worker_portfolio")
    .select("*")
    .eq("worker_profile_id", worker.id)
    .order("display_order");
  normalizeError(error);
  return data ?? [];
}

export async function getCurrentEmployerProfile(): Promise<EmployerProfile | null> {
  const { supabase, userId } = await getAuthContext();
  const { data, error } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();

  normalizeError(error);
  return data;
}

export async function getCurrentEmployerGallery(): Promise<
  Tables<"employer_gallery">[]
> {
  const { supabase, userId } = await getAuthContext();
  const { data: employer, error: employerError } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  normalizeError(employerError);
  if (!employer) return [];

  const { data, error } = await supabase
    .from("employer_gallery")
    .select("*")
    .eq("employer_profile_id", employer.id)
    .order("display_order");
  normalizeError(error);
  return data ?? [];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order")
    .order("name");

  normalizeError(error);
  return data ?? [];
}

export async function getWorkerPortfolio(workerProfileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_worker_portfolio")
    .select("*")
    .eq("worker_profile_id", workerProfileId)
    .order("display_order");

  normalizeError(error);
  return data ?? [];
}

export async function getWorkerRequests(): Promise<
  WorkerRequestWithEmployer[]
> {
  const { supabase, userId } = await getAuthContext();
  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  normalizeError(workerError);
  if (!worker) return [];

  const { data: requests, error } = await supabase
    .from("employer_requests")
    .select("*")
    .eq("worker_profile_id", worker.id)
    .order("created_at", { ascending: false });

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

export async function getWorkerStatus(): Promise<WorkerStatus> {
  const requests = await getWorkerRequests();
  const { supabase, userId } = await getAuthContext();
  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();
  normalizeError(workerError);
  if (!worker) return { pending: [], accepted: [] };

  const { data: handshakes, error: handshakeError } = await supabase
    .from("handshakes")
    .select("*")
    .eq("worker_profile_id", worker.id)
    .in("status", ["matched", "completed"])
    .order("created_at", { ascending: false });
  normalizeError(handshakeError);

  const handshakeByRequestId = new Map(
    (handshakes ?? [])
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
  const { data: employer, error: employerError } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  normalizeError(employerError);
  if (!employer) return [];

  const { data: requests, error } = await supabase
    .from("employer_requests")
    .select("*")
    .eq("employer_profile_id", employer.id)
    .order("created_at", { ascending: false });

  normalizeError(error);
  if (!requests?.length) return [];

  const workerIds = [
    ...new Set(requests.map((request) => request.worker_profile_id)),
  ];
  const { data: workers, error: workerError } = await supabase
    .from("public_worker_profiles")
    .select("*")
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

export async function getEmployerStatus(): Promise<EmployerStatus> {
  const requests = await getEmployerRequests();
  const { supabase, userId } = await getAuthContext();
  const { data: employer, error: employerError } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  normalizeError(employerError);
  if (!employer) return { pending: [], agreed: [] };

  const { data: handshakes, error: handshakeError } = await supabase
    .from("handshakes")
    .select("*")
    .eq("employer_profile_id", employer.id)
    .in("status", ["matched", "completed"])
    .order("created_at", { ascending: false });
  normalizeError(handshakeError);

  const handshakeByRequestId = new Map(
    (handshakes ?? [])
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
        .select("*")
        .order("created_at", { ascending: false }),
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
  const worker = (await getAdminWorkers()).find(
    (candidate) => candidate.id === workerProfileId,
  );
  if (!worker) return null;

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
    .select("*")
    .order("created_at", { ascending: false });
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
    .select("*")
    .not("featured_rank", "is", null)
    .order("featured_rank", { ascending: true });
  normalizeError(error);
  return data ?? [];
}

export async function getAdminEmployers() {
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase
    .from("employer_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  normalizeError(error);
  return data ?? [];
}

export async function getAdminHandshakes() {
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase
    .from("handshakes")
    .select("*")
    .order("created_at", { ascending: false });
  normalizeError(error);
  return data ?? [];
}

export async function getAdminCategories() {
  const { supabase } = await getAuthContext();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order")
    .order("name");
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
    .select()
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
    .select("*")
    .eq("employer_profile_id", parsedId)
    .order("display_order");

  normalizeError(error);
  return data ?? [];
}

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

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
