import Link from "next/link";
import { Suspense } from "react";
import { ArrowDown, CheckCircle2, UserRound } from "lucide-react";
import Image from "next/image";
import {
  getCurrentWorkerProfile,
  getWorkerProfileAnalytics,
  getWorkerRequests,
} from "@/lib/domain/beauty-connect";
import { env } from "@/config/env";
import { publicImageUrl } from "@/lib/utils";
import {
  EmptyState,
  LinkButton,
  SetupState,
  StatusPill,
} from "@/components/shared/ui";
import { WorkerRequestCard } from "@/components/worker/request-card";

export const dynamic = "force-dynamic";

export default async function WorkerHomePage() {
  try {
    const profilePromise = getCurrentWorkerProfile();
    const requestsPromise = getWorkerRequests();
    const analyticsPromise = getWorkerProfileAnalytics();
    const [profile, requests] = await Promise.all([
      profilePromise,
      requestsPromise,
    ]);

    if (!profile) {
      return (
        <EmptyState
          title="Your worker home is waiting"
          description="Complete your profile to begin your application."
          action={
            <LinkButton href="/worker/onboarding">Start application</LinkButton>
          }
        />
      );
    }

    const firstName = profile.full_name.trim().split(" ")[0] || "there";
    const availabilityLabel =
      profile.availability_status === "matched"
        ? "Matched"
        : profile.availability_status === "considering"
          ? "Considering opportunities"
          : "Available to employers";
    const verificationLabel =
      profile.verification_status === "approved" ? "Verified" : "Under review";
    const profileImage = publicImageUrl(
      env.supabase.url,
      "worker-profile-images",
      profile.profile_photo_path,
    );
    const pendingRequests = requests.filter(
      (request) => request.status === "pending",
    ).length;

    return (
      <div className="-mx-5 -mt-8 min-h-[calc(100svh-4rem)] bg-[#fff8fc] px-5 pb-14 pt-8 text-[#1b1b1d] sm:-mx-8 sm:px-8 sm:pt-10">
        <div className="mx-auto max-w-5xl">
          <section className="border-b border-[#eadfe7] pb-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7478]">
                Hello
              </p>
              <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.75rem)] font-semibold tracking-[-0.03em]">
                Good to see you, {firstName}.
              </h1>
              <p className="mt-2 text-sm text-[#7a7478]">
                Let the right opportunity find you.
              </p>
            </div>
            <div className="mt-5 flex max-w-xl items-center gap-3 rounded-2xl border border-[#eee5eb] bg-white p-3 shadow-[0_4px_18px_rgba(31,17,29,0.03)]">
              <Link
                href="/worker/profile"
                aria-label="View your profile"
                className="relative grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f3eef1]"
              >
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt=""
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                ) : (
                  <UserRound className="size-7 text-[#a19aa0]" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f5e9] px-3 py-1 text-[11px] font-semibold text-[#035715]">
                    <span className="size-1.5 rounded-full bg-[#035715]" />
                    {availabilityLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#035715]">
                    <CheckCircle2 className="size-3.5" />
                    {verificationLabel}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#7a7478]">
                  <span className="rounded-full bg-[#e8def8] px-2.5 py-1 font-medium text-[#514d50]">
                    {pendingRequests} Pending
                  </span>
                  <span>Direct salon requests</span>
                </div>
                <Suspense
                  fallback={
                    <span className="mt-2 inline-flex text-[11px] text-[#7a7478]">
                      Profile reach loading…
                    </span>
                  }
                >
                  <WorkerAnalyticsLink analyticsPromise={analyticsPromise} />
                </Suspense>
              </div>
            </div>
          </section>

          <Suspense fallback={<WorkerAnalyticsFallback />}>
            <WorkerAnalyticsSection analyticsPromise={analyticsPromise} />
          </Suspense>

          <section className="pt-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">
                  Latest requests
                </h2>
                <StatusPill tone="warning">{requests.length}</StatusPill>
              </div>
              <Link
                href="/worker/status"
                className="text-xs font-medium text-[#035715] underline-offset-4 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {requests.slice(0, 3).map((request) => (
                <WorkerRequestCard key={request.id} request={request} />
              ))}
              {requests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#ded4dc] bg-white px-6 py-10 text-center">
                  <h3 className="text-base font-semibold">No requests yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7a7478]">
                    Keep your profile current. Approved profiles are visible to
                    employers looking for their next great teammate.
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}

type WorkerAnalyticsPromise = ReturnType<typeof getWorkerProfileAnalytics>;

async function WorkerAnalyticsLink({
  analyticsPromise,
}: {
  analyticsPromise: WorkerAnalyticsPromise;
}) {
  try {
    const analytics = await analyticsPromise;
    return (
      <Link
        href="/worker/profile"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#035715] underline-offset-4 hover:underline"
      >
        {analytics.uniqueEmployerViews} salons have seen your profile
        <ArrowDown className="size-3.5" />
      </Link>
    );
  } catch {
    return null;
  }
}

async function WorkerAnalyticsSection({
  analyticsPromise,
}: {
  analyticsPromise: WorkerAnalyticsPromise;
}) {
  try {
    const analytics = await analyticsPromise;
    return (
      <section className="pt-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              Your reach
            </h2>
            <p className="mt-1 text-xs text-[#7a7478]">Past 30 days</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <Metric label="Profile views" value={analytics.totalProfileViews} />
          <Metric label="Unique salons" value={analytics.uniqueEmployerViews} />
          <Metric
            label="This week"
            value={`+${analytics.weeklyProfileViews}`}
          />
        </div>
      </section>
    );
  } catch {
    return null;
  }
}

function WorkerAnalyticsFallback() {
  return (
    <section className="pt-7" aria-label="Loading profile reach">
      <div className="h-6 w-32 animate-pulse rounded bg-[#eee5eb]" />
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {["one", "two", "three"].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-2xl border border-[#eee5eb] bg-white"
          />
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#eee5eb] bg-white px-3 py-4 shadow-[0_4px_18px_rgba(31,17,29,0.03)] sm:px-5">
      <span className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7a7478]">
        {label}
      </span>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-[-0.03em] sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
