import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  adminEmployerDecisionSchema,
  adminWorkerDecisionSchema,
  employerProfileSchema,
  marketplaceFiltersSchema,
  notificationIdSchema,
  requestWorkerSchema,
  respondToWorkerRequestSchema,
  updateWorkerProfileSchema,
  workerApplicationSchema,
  type AdminWorkerDecisionInput,
  type AdminEmployerDecisionInput,
  type EmployerProfileInput,
  type MarketplaceFiltersInput,
  type RequestWorkerInput,
  type RespondToWorkerRequestInput,
  type UpdateWorkerProfileInput,
  type WorkerApplicationInput,
} from "@/lib/validations/beauty-connect";
import type { Database, Json, Tables } from "@/types/database";
import { AuthenticationRequiredError, DomainError } from "./errors";

type Supabase = SupabaseClient<Database, "public">;

export type WorkerMarketplaceItem =
  Database["public"]["Views"]["public_worker_profiles"]["Row"];
export type PublicEmployerProfile =
  Database["public"]["Views"]["public_employer_profiles"]["Row"];
export type Notification = Tables<"notifications">;

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

export async function createWorkerApplication(input: WorkerApplicationInput) {
  const parsed = workerApplicationSchema.parse(input);
  const supabase = await createClient();
  await requireUser(supabase);

  const { data, error } = await supabase.rpc("bc_create_worker_application", {
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
  });

  normalizeError(error);
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

export async function updateWorkerProfile(input: UpdateWorkerProfileInput) {
  const parsed = updateWorkerProfileSchema.parse(input);
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const updatePayload = {
    category_id: parsed.categoryId,
    full_name: parsed.fullName,
    phone: parsed.phone,
    location: parsed.location,
    profile_photo_path: parsed.profilePhotoPath,
    years_experience: parsed.yearsExperience,
    short_bio: parsed.shortBio,
    work_experience: parsed.workExperience,
    skills: parsed.skills,
    compensation_model: parsed.compensationModel,
    salary_expectation: parsed.salaryExpectation,
    commission_expectation: parsed.commissionExpectation,
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
  return data;
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

export async function getEmployerProfile(
  employerProfileId: string,
): Promise<PublicEmployerProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employer_profiles")
    .select(
      "id, business_name, description, location, profile_image_path, created_at, updated_at",
    )
    .eq("id", employerProfileId)
    .maybeSingle();

  normalizeError(error);
  return data;
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
