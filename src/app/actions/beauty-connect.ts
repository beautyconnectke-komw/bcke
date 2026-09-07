"use server";

import {
  approveWorker,
  completeHandshake,
  createEmployerProfile,
  createWorkerApplication,
  markNotificationRead,
  rejectWorker,
  restoreEmployer,
  restoreWorker,
  requestWorker,
  respondToWorkerRequest,
  suspendEmployer,
  suspendWorker,
  updateWorkerProfile,
} from "@/lib/domain/beauty-connect";
import type {
  AdminEmployerDecisionInput,
  AdminWorkerDecisionInput,
  EmployerProfileInput,
  RequestWorkerInput,
  RespondToWorkerRequestInput,
  UpdateWorkerProfileInput,
  WorkerApplicationInput,
} from "@/lib/validations/beauty-connect";

export async function createWorkerApplicationAction(
  input: WorkerApplicationInput,
) {
  return createWorkerApplication(input);
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
  input: UpdateWorkerProfileInput,
) {
  return updateWorkerProfile(input);
}

export async function createEmployerProfileAction(input: EmployerProfileInput) {
  return createEmployerProfile(input);
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

export async function markNotificationReadAction(notificationId: string) {
  return markNotificationRead({ notificationId });
}
