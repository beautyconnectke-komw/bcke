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
});
