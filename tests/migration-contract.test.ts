import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260905193000_beauty_connect_core.sql",
  ),
  "utf8",
);
const onboardingMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260909160000_worker_onboarding_and_deferred_roles.sql",
  ),
  "utf8",
);
const adminControlsMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260909180000_admin_controls.sql"),
  "utf8",
);
const workerAreaMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260909200000_worker_area_fixes.sql",
  ),
  "utf8",
);
const analyticsMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260910100000_worker_profile_analytics.sql",
  ),
  "utf8",
);
const lifecycleMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260912100000_reactivation_and_connection_contacts.sql",
  ),
  "utf8",
);
const lifecycleSecurityMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260912103000_revoke_anon_reactivation_and_connection_helpers.sql",
  ),
  "utf8",
);

describe("Supabase migration contract", () => {
  it("models account role, worker verification, and availability separately", () => {
    expect(migration).toContain("create type public.profile_role");
    expect(migration).toContain(
      "create type public.worker_verification_status",
    );
    expect(migration).toContain(
      "create type public.worker_availability_status",
    );
    expect(migration).toContain(
      "verification_status public.worker_verification_status",
    );
    expect(migration).toContain(
      "availability_status public.worker_availability_status",
    );
  });

  it("prevents duplicate active requests and simultaneous active worker matches", () => {
    expect(migration).toContain(
      "create unique index employer_requests_one_active_pair",
    );
    expect(migration).toContain(
      "where status in ('pending', 'accepted', 'considering')",
    );
    expect(migration).toContain(
      "create unique index handshakes_one_active_worker_match",
    );
    expect(migration).toContain("where status = 'matched'");
  });

  it("uses row locks in request and response RPCs for concurrency-sensitive paths", () => {
    expect(migration).toMatch(/bc_request_worker[\s\S]+for update;/);
    expect(migration).toMatch(/bc_respond_to_worker_request[\s\S]+for update;/);
  });

  it("requires admin authorization for worker approval and rejection", () => {
    expect(migration).toMatch(
      /bc_approve_worker[\s\S]+Admin authorization is required/,
    );
    expect(migration).toMatch(
      /bc_reject_worker[\s\S]+Admin authorization is required/,
    );
    expect(migration).toMatch(
      /bc_suspend_worker[\s\S]+Admin authorization is required/,
    );
    expect(migration).toMatch(
      /bc_suspend_employer[\s\S]+Admin authorization is required/,
    );
    expect(migration).toContain("prevent_profile_role_escalation");
  });

  it("prevents users from rewriting moderation fields and notification content directly", () => {
    expect(migration).toContain("enforce_employer_profile_rules");
    expect(migration).toContain(
      "Employer moderation fields must be changed through authorized admin operations.",
    );
    expect(migration).toContain("enforce_notification_update_rules");
    expect(migration).toContain(
      "Users can only update notification read state.",
    );
  });

  it("enables RLS and defines participant-scoped access policies", () => {
    expect(migration).toContain(
      "alter table public.profiles enable row level security",
    );
    expect(migration).toContain(
      "alter table public.worker_profiles enable row level security",
    );
    expect(migration).toContain(
      "alter table public.employer_requests enable row level security",
    );
    expect(migration).toContain(
      "alter table public.handshakes enable row level security",
    );
    expect(migration).toContain("Users can view their own notifications");
    expect(migration).toContain("Participants and admins can view handshakes");
    expect(migration).toContain("worker_can_view_employer_profile");
    expect(migration).not.toContain(
      "where request.employer_profile_id = employer_profiles.id",
    );
    expect(migration).not.toContain(
      "grant select on public.public_employer_profiles",
    );
  });

  it("creates storage buckets without making private verification documents public", () => {
    expect(migration).toContain(
      "'worker-profile-images', 'worker-profile-images', true",
    );
    expect(migration).toContain(
      "'worker-portfolio-images', 'worker-portfolio-images', true",
    );
    expect(migration).toContain("'employer-images', 'employer-images', true");
    expect(migration).toContain(
      "'verification-documents', 'verification-documents', false",
    );
  });

  it("supports deferred role locking and the worker onboarding fields", () => {
    expect(migration).toContain("role public.profile_role,");
    expect(migration).toContain("county text");
    expect(migration).toContain("experience_months integer not null default 0");
    expect(migration).toContain(
      "extra_specialty_ids uuid[] not null default '{}'",
    );
    expect(migration).toContain("as extra_specialty_names");
    expect(migration).toContain(
      "create or replace function public.bc_finalize_profile_role",
    );
    expect(onboardingMigration).toContain("alter column role drop not null");
    expect(onboardingMigration).toContain("as extra_specialty_names");
    expect(onboardingMigration).toContain(
      "create or replace function public.prevent_profile_role_escalation",
    );
    expect(onboardingMigration).toContain(
      "grant execute on function public.bc_finalize_profile_role",
    );
  });

  it("protects admin whitelisting and limits featured workers to eight", () => {
    expect(adminControlsMigration).toContain(
      "create table if not exists public.admin_email_whitelist",
    );
    expect(adminControlsMigration).toContain(
      "That email must already exist in Supabase Auth users.",
    );
    expect(adminControlsMigration).toContain(
      "add column if not exists featured_rank integer",
    );
    expect(adminControlsMigration).toContain(
      "You can feature at most 8 workers.",
    );
    expect(adminControlsMigration).toContain("as extra_specialty_names");
  });

  it("anchors worker experience and routes reviewed profile changes through moderation", () => {
    expect(workerAreaMigration).toContain(
      "add column if not exists experience_started_at timestamptz",
    );
    expect(workerAreaMigration).toContain(
      "create or replace function public.bc_submit_worker_reviewed_profile",
    );
    expect(workerAreaMigration).toContain(
      "This profile change requires admin review.",
    );
    expect(workerAreaMigration).toContain(
      'create policy "Workers can view requested employer gallery"',
    );
  });

  it("records employer profile views atomically with a cooldown", () => {
    expect(analyticsMigration).toContain(
      "create table if not exists public.worker_profile_views",
    );
    expect(analyticsMigration).toContain(
      "create table if not exists public.worker_profile_view_cooldowns",
    );
    expect(analyticsMigration).toContain(
      "create or replace function public.bc_record_worker_profile_view",
    );
    expect(analyticsMigration).toContain("for update;");
    expect(analyticsMigration).toContain("interval '24 hours'");
    expect(analyticsMigration).toContain(
      "create or replace function public.bc_get_worker_profile_analytics",
    );
  });

  it("keeps reactivation behind admin review and unlocks contacts only after handshakes", () => {
    expect(lifecycleMigration).toContain(
      "create table public.worker_reactivation_requests",
    );
    expect(lifecycleMigration).toContain(
      "create unique index worker_reactivation_requests_one_pending",
    );
    expect(lifecycleMigration).toMatch(
      /bc_request_worker_reactivation[\s\S]+availability_status = 'matched'[\s\S]+for update;/,
    );
    expect(lifecycleMigration).toMatch(
      /bc_approve_worker_reactivation[\s\S]+status = 'expired'[\s\S]+status in \('pending', 'considering'\)/,
    );
    expect(lifecycleMigration).toContain(
      "create or replace function public.worker_can_view_employer_profile",
    );
    expect(lifecycleMigration).toContain(
      "handshake.status in ('matched', 'completed')",
    );
    expect(lifecycleMigration).toContain(
      "grant select on public.public_employer_profiles to anon, authenticated",
    );
    expect(lifecycleSecurityMigration).toContain(
      "revoke execute on function public.bc_request_worker_reactivation(text) from anon",
    );
    expect(lifecycleSecurityMigration).toContain(
      "revoke execute on function public.employer_can_view_worker_profile(uuid) from anon",
    );
  });
});
