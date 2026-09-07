import type { Enums } from "@/types/database";

export type WorkerVerificationStatus = Enums<"worker_verification_status">;
export type WorkerAvailabilityStatus = Enums<"worker_availability_status">;
export type EmployerRequestStatus = Enums<"employer_request_status">;
export type HandshakeStatus = Enums<"handshake_status">;

const workerVerificationTransitions: Record<
  WorkerVerificationStatus,
  readonly WorkerVerificationStatus[]
> = {
  draft: ["pending_review"],
  pending_review: ["approved", "rejected"],
  approved: [],
  rejected: ["pending_review"],
};

const workerAvailabilityTransitions: Record<
  WorkerAvailabilityStatus,
  readonly WorkerAvailabilityStatus[]
> = {
  available: ["considering", "matched"],
  considering: ["available", "matched"],
  matched: [],
};

const employerRequestTransitions: Record<
  EmployerRequestStatus,
  readonly EmployerRequestStatus[]
> = {
  pending: ["accepted", "considering", "declined", "cancelled", "expired"],
  considering: ["accepted", "declined", "cancelled", "expired"],
  accepted: [],
  declined: [],
  cancelled: [],
  expired: [],
};

const handshakeTransitions: Record<
  HandshakeStatus,
  readonly HandshakeStatus[]
> = {
  matched: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransitionWorkerVerification(
  from: WorkerVerificationStatus,
  to: WorkerVerificationStatus,
) {
  return workerVerificationTransitions[from].includes(to);
}

export function canTransitionWorkerAvailability(
  from: WorkerAvailabilityStatus,
  to: WorkerAvailabilityStatus,
) {
  return workerAvailabilityTransitions[from].includes(to);
}

export function canTransitionEmployerRequest(
  from: EmployerRequestStatus,
  to: EmployerRequestStatus,
) {
  return employerRequestTransitions[from].includes(to);
}

export function canTransitionHandshake(
  from: HandshakeStatus,
  to: HandshakeStatus,
) {
  return handshakeTransitions[from].includes(to);
}
