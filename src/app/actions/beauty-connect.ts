"use server";

import {
  approveWorker,
  completeHandshake,
  createEmployerProfile,
  removeEmployerGalleryImage,
  createWorkerApplication,
  markNotificationRead,
  rejectWorker,
  restoreEmployer,
  restoreWorker,
  requestWorker,
  respondToWorkerRequest,
  saveWorkerDraft,
  submitWorkerReviewedProfile,
  suspendEmployer,
  suspendWorker,
  updateWorkerProfile,
  updateWorkerAvailability,
  createCategory,
  updateCategoryImage,
  toggleCategory,
  addAdminEmail,
  removeAdminEmail,
  setFeaturedWorkers,
  recordWorkerProfileView,
  requestWorkerReactivation,
  approveWorkerReactivation,
  declineWorkerReactivation,
  requestAccountDeletion,
  updateCompanyContact,
  verifyAccountPassword,
} from "@/lib/domain/beauty-connect";
import type {
  AdminEmployerDecisionInput,
  AdminWorkerDecisionInput,
  EmployerProfileInput,
  RequestWorkerInput,
  RespondToWorkerRequestInput,
  WorkerContactProfileInput,
  WorkerReviewedProfileInput,
  WorkerApplicationInput,
  WorkerApplicationSubmissionInput,
  WorkerReactivationRequestInput,
} from "@/lib/validations/beauty-connect";
import { createClient } from "@/lib/supabase/server";
import { DomainError } from "@/lib/domain/errors";
import type {
  AdminEmailInput,
  CategoryInput,
  CompanyContactInput,
  FeaturedWorkerIdsInput,
} from "@/lib/validations/admin";

export async function createWorkerApplicationAction(
  input: WorkerApplicationSubmissionInput,
  portfolioPaths: string[] = [],
) {
  return createWorkerApplication(input, portfolioPaths);
}

export async function saveWorkerDraftAction(input: WorkerApplicationInput) {
  return saveWorkerDraft(input);
}

export async function updateWorkerAvailabilityAction(
  availability: "available" | "considering",
) {
  return updateWorkerAvailability(availability);
}

export async function createCategoryAction(input: CategoryInput) {
  return createCategory(input);
}

export async function updateCategoryImageAction(
  categoryId: string,
  imagePath: string | null,
) {
  return updateCategoryImage(categoryId, imagePath);
}

export async function toggleCategoryAction(
  categoryId: string,
  isActive: boolean,
) {
  return toggleCategory(categoryId, isActive);
}

export async function addAdminEmailAction(input: AdminEmailInput) {
  return addAdminEmail(input);
}

export async function removeAdminEmailAction(email: string) {
  return removeAdminEmail(email);
}

export async function updateCompanyContactAction(input: CompanyContactInput) {
  return updateCompanyContact(input);
}

export async function verifyAccountPasswordAction(password: string) {
  return verifyAccountPassword(password);
}

export async function requestAccountDeletionAction(password: string) {
  return requestAccountDeletion(password);
}

export async function setFeaturedWorkersAction(
  workerProfileIds: FeaturedWorkerIdsInput,
) {
  return setFeaturedWorkers(workerProfileIds);
}

export async function recordWorkerProfileViewAction(workerProfileId: string) {
  return recordWorkerProfileView(workerProfileId);
}

export async function approveWorkerAction(input: AdminWorkerDecisionInput) {
  return approveWorker(input);
}

export async function rejectWorkerAction(input: AdminWorkerDecisionInput) {
  return rejectWorker(input);
}

export async function suspendWorkerAction(input: AdminWorkerDecisionInput) {
  return suspendWorker(input);
}

export async function restoreWorkerAction(workerProfileId: string) {
  return restoreWorker({ workerProfileId });
}

export async function suspendEmployerAction(input: AdminEmployerDecisionInput) {
  return suspendEmployer(input);
}

export async function restoreEmployerAction(employerProfileId: string) {
  return restoreEmployer({ employerProfileId });
}

export async function updateWorkerProfileAction(
  input: WorkerContactProfileInput,
) {
  return updateWorkerProfile(input);
}

export async function submitWorkerReviewedProfileAction(
  input: WorkerReviewedProfileInput,
) {
  return submitWorkerReviewedProfile(input);
}

export async function createEmployerProfileAction(input: EmployerProfileInput) {
  return createEmployerProfile(input);
}

export async function removeEmployerGalleryImageAction(imageId: string) {
  return removeEmployerGalleryImage(imageId);
}

export async function requestWorkerAction(input: RequestWorkerInput) {
  return requestWorker(input);
}

export async function respondToWorkerRequestAction(
  input: RespondToWorkerRequestInput,
) {
  return respondToWorkerRequest(input);
}

export async function completeHandshakeAction(requestId: string) {
  return completeHandshake(requestId);
}

export async function requestWorkerReactivationAction(
  input: WorkerReactivationRequestInput,
) {
  return requestWorkerReactivation(input);
}

export async function approveWorkerReactivationAction(requestId: string) {
  return approveWorkerReactivation(requestId);
}

export async function declineWorkerReactivationAction(
  requestId: string,
  reason?: string | null,
) {
  return declineWorkerReactivation(requestId, reason);
}

export async function markNotificationReadAction(notificationId: string) {
  return markNotificationRead({ notificationId });
}

export async function setRoleAction(role: "worker" | "employer") {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user)
    throw new DomainError("Please sign in before choosing a role.");

  const { data: existing, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new DomainError(profileError.message, profileError);
  if (existing?.role && existing.role !== role) {
    throw new DomainError("This account already has a different role.");
  }

  if (!existing) {
    const { error } = await supabase
      .from("profiles")
      .insert({ id: user.id, role: null });
    if (error) throw new DomainError(error.message, error);
  }

  return role;
}
