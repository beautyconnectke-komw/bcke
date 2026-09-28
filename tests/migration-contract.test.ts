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
const profileUpdatesMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260914100000_worker_profile_updates.sql",
  ),
  "utf8",
);
const normalNotificationsMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260922100000_normal_notifications_and_push.sql",
  ),
  "utf8",
);
const profileViewNotificationTypeMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260922090000_profile_view_notification_type.sql",
  ),
  "utf8",
);
const notificationIntegrityFixesMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260922110000_notification_integrity_fixes.sql",
  ),
  "utf8",
);
const employerTargetingMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260923100000_employer_targeting_foundation.sql",
  ),
  "utf8",
);
const pushCampaignMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260923110000_push_campaigns.sql"),
  "utf8",
);
const pushCampaignClaimFixMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260928100000_fix_push_campaign_claim_ambiguity.sql",
  ),
  "utf8",
);
const serviceWorker = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");

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

  it("stores reviewed profile changes separately until an admin approves them", () => {
    expect(profileUpdatesMigration).toContain(
      "create table if not exists public.worker_profile_updates",
    );
    expect(profileUpdatesMigration).toContain(
      "create unique index if not exists worker_profile_updates_one_pending",
    );
    expect(profileUpdatesMigration).toContain(
      "set category_id = update_record.category_id",
    );
    expect(profileUpdatesMigration).toContain(
      "create or replace function public.bc_approve_worker_profile_update",
    );
    expect(profileUpdatesMigration).toContain(
      "create or replace function public.bc_reject_worker_profile_update",
    );
  });

  it("keeps normal notifications canonical and push delivery scoped", () => {
    expect(profileViewNotificationTypeMigration).toContain(
      "add value if not exists 'profile_views_aggregated'",
    );
    expect(normalNotificationsMigration).toContain(
      "add column if not exists dedupe_key text",
    );
    expect(normalNotificationsMigration).toContain(
      "create unique index if not exists notifications_profile_dedupe_idx",
    );
    expect(normalNotificationsMigration).toContain(
      "create table public.notification_push_subscriptions",
    );
    expect(normalNotificationsMigration).toContain(
      'create policy "Users can view their own push subscriptions"',
    );
    expect(normalNotificationsMigration).toContain(
      "create or replace function public.bc_claim_notification_push_delivery",
    );
    expect(normalNotificationsMigration).toContain(
      "create or replace function public.bc_record_worker_profile_view",
    );
    expect(normalNotificationsMigration).toContain(
      "recent_unique_employers >= 3",
    );
    expect(normalNotificationsMigration).toContain("interval '7 days'");
  });

  it("keeps notification recipients and application events idempotent", () => {
    expect(normalNotificationsMigration).toContain("    profile_id,");
    expect(normalNotificationsMigration).not.toContain(
      "    recipient_profile_id,\n    type,",
    );
    expect(notificationIntegrityFixesMigration).toContain(
      "insert into public.notifications (\n    profile_id,",
    );
    expect(notificationIntegrityFixesMigration).toContain(
      "application_submitted:profile_update:",
    );
    expect(notificationIntegrityFixesMigration).toContain(
      "application_approved:profile_update:",
    );
    expect(notificationIntegrityFixesMigration).toContain(
      "application_rejected:profile_update:",
    );
    expect(notificationIntegrityFixesMigration).toContain(
      "application_submitted:worker:",
    );
    expect(notificationIntegrityFixesMigration).toContain(
      "application_approved:worker:",
    );
    expect(notificationIntegrityFixesMigration).toContain(
      "application_rejected:worker:",
    );
    expect(notificationIntegrityFixesMigration).toContain(
      "create or replace function public.bc_approve_worker",
    );
    expect(notificationIntegrityFixesMigration).toContain(
      "create or replace function public.bc_reject_worker",
    );
  });

  it("prepares employers for structured audience targeting without dropping legacy values", () => {
    expect(employerTargetingMigration).toContain(
      "add column if not exists county text",
    );
    expect(employerTargetingMigration).toContain(
      "add column if not exists town text",
    );
    expect(employerTargetingMigration).toContain(
      "add column if not exists category_id uuid references public.categories(id)",
    );
    expect(employerTargetingMigration).toContain(
      "add column if not exists extra_specialty_ids uuid[] not null default '{}'",
    );
    expect(employerTargetingMigration).toContain(
      "employer_profiles_county_supported",
    );
    expect(employerTargetingMigration).toContain(
      "employer_profiles_extra_specialties_unique",
    );
    expect(employerTargetingMigration).toContain(
      "enforce_employer_specialty_catalogue",
    );
    expect(employerTargetingMigration).toContain(
      "employer_specialty_migration_issues",
    );
    expect(employerTargetingMigration).toContain(
      "employer_location_migration_issues",
    );
    expect(employerTargetingMigration).toContain(
      "The original JSON value is deliberately not changed.",
    );
    expect(employerTargetingMigration).toContain(
      "grant execute on function public.bc_create_employer_profile(",
    );
    expect(employerTargetingMigration).toContain(
      "Admins can inspect employer specialty migration issues",
    );
    expect(employerTargetingMigration).toContain(
      "Admins can inspect employer location migration issues",
    );
  });

  it("keeps push campaigns separate, snapshot-based, and protected", () => {
    expect(pushCampaignMigration).toContain(
      "create table if not exists public.push_campaigns",
    );
    expect(pushCampaignMigration).toContain(
      "create table if not exists public.push_campaign_recipients",
    );
    expect(pushCampaignMigration).toContain(
      "create table if not exists public.push_campaign_deliveries",
    );
    expect(pushCampaignMigration).toContain(
      "create table if not exists public.push_campaign_profile_visits",
    );
    expect(pushCampaignMigration).toContain(
      "create type public.push_campaign_status",
    );
    expect(pushCampaignMigration).toContain("sends_per_recipient");
    expect(pushCampaignMigration).toContain("push_campaign_specialty_scope");
    expect(pushCampaignMigration).toContain("delivery_window_start");
    expect(pushCampaignMigration).toContain(
      "bc_push_campaign_eligible_profiles",
    );
    expect(pushCampaignMigration).toContain(
      "bc_claim_push_campaign_deliveries",
    );
    expect(pushCampaignMigration).toContain(
      "for update of delivery skip locked",
    );
    expect(pushCampaignMigration).toContain("'push_campaign'");
    expect(pushCampaignMigration).toContain(
      "alter table public.push_campaigns enable row level security",
    );
    expect(pushCampaignMigration).toContain("public.is_admin(auth.uid())");
    expect(pushCampaignMigration).toContain("public.is_service_role()");
    expect(pushCampaignMigration).toContain(
      "bc_record_push_campaign_profile_visit",
    );
    expect(pushCampaignMigration).not.toContain("min(category.id)");
  });

  it("qualifies the campaign claim function's campaign_id source column", () => {
    expect(pushCampaignClaimFixMigration).toContain(
      "select stale.id, stale.campaign_id",
    );
    expect(pushCampaignClaimFixMigration).toContain(
      "from public.push_campaign_deliveries as stale",
    );
    expect(pushCampaignClaimFixMigration).toContain(
      "grant execute on function public.bc_claim_push_campaign_deliveries(integer)",
    );
  });

  it("keeps push clicks authenticated and same-origin", () => {
    expect(serviceWorker).toContain(
      "/api/notifications/${encodeURIComponent(notificationId)}/read",
    );
    expect(serviceWorker).toContain('credentials: "include"');
    expect(serviceWorker).toContain('!value.startsWith("//")');
  });
});
