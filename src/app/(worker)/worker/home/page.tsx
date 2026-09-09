import Link from "next/link";
import {
  getCurrentWorkerProfile,
  getWorkerRequests,
} from "@/lib/domain/beauty-connect";
import { AvailabilityControl } from "@/components/worker/availability-control";
import {
  EmptyState,
  LinkButton,
  SectionHeading,
  SetupState,
  StatusPill,
} from "@/components/shared/ui";
import { WorkerRequestCard } from "@/components/worker/request-card";

export default async function WorkerHomePage() {
  try {
    const [profile, requests] = await Promise.all([
      getCurrentWorkerProfile(),
      getWorkerRequests(),
    ]);
    if (!profile)
      return (
        <EmptyState
          title="Your worker home is waiting"
          description="Complete your profile to begin your application."
          action={
            <LinkButton href="/worker/onboarding">Start application</LinkButton>
          }
        />
      );
    return (
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Worker home"
          title={`Good to see you, ${profile.full_name.split(" ")[0]}.`}
          description="Keep your profile current and let the right opportunity find you."
          action={
            <LinkButton href="/worker/profile" variant="secondary">
              View profile
            </LinkButton>
          }
        />
        <div className="mt-8 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <section className="border border-border bg-foreground p-6 text-background">
            <p className="text-xs uppercase tracking-[0.16em] text-background/60">
              Availability
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              {profile.availability_status === "matched"
                ? "Matched"
                : profile.availability_status === "considering"
                  ? "Considering opportunities"
                  : "Open to opportunities"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-background/70">
              Your verification status is{" "}
              <strong className="text-background">
                {profile.verification_status.replace("_", " ")}
              </strong>
              .
            </p>
            <div className="mt-6">
              <AvailabilityControl value={profile.availability_status} />
            </div>
          </section>
          <section className="border border-border bg-background p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Quick view
            </p>
            <div className="mt-5 grid gap-4">
              <div>
                <p className="text-2xl font-semibold">
                  {
                    requests.filter((request) => request.status === "pending")
                      .length
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Pending requests
                </p>
              </div>
              <Link
                href="/worker/status"
                className="text-sm font-medium underline underline-offset-4"
              >
                Open status →
              </Link>
            </div>
          </section>
        </div>
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Latest requests</h2>
            <StatusPill>{profile.availability_status}</StatusPill>
          </div>
          <div className="mt-5 grid gap-4">
            {requests.slice(0, 3).map((request) => (
              <WorkerRequestCard key={request.id} request={request} />
            ))}
            {requests.length === 0 ? (
              <EmptyState
                title="You haven’t received any requests yet."
                description="Keep your profile current. Approved profiles are visible to employers looking for their next great teammate."
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
