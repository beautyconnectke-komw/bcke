import type { Tables } from "@/types/database";

export type AdminApplicationWorker = Pick<
  Tables<"worker_profiles">,
  "id" | "full_name" | "location" | "years_experience" | "verification_status"
>;

export type AdminApplicationReactivationRequest = Pick<
  Tables<"worker_reactivation_requests">,
  "id" | "worker_profile_id" | "reason" | "created_at"
> & {
  worker: Pick<AdminApplicationWorker, "id" | "full_name"> | null;
};
