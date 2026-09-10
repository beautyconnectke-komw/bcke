import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, UserRound } from "lucide-react";
import {
  getWorkerPortfolio,
  getWorkerProfile,
  getCurrentEmployerRequestForWorker,
} from "@/lib/domain/beauty-connect";
import { env } from "@/config/env";
import { publicImageUrl } from "@/lib/utils";
import {
  EmptyState,
  LinkButton,
  SetupState,
  StatusPill,
} from "@/components/shared/ui";
import { RequestButton } from "@/components/employer/request-button";
import { WorkerProfileViewTracker } from "@/components/employer/worker-profile-view-tracker";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const [worker, portfolio, currentRequest] = await Promise.all([
      getWorkerProfile(id),
      getWorkerPortfolio(id),
      getCurrentEmployerRequestForWorker(id),
    ]);
    if (!worker)
      return (
        <EmptyState
          title="Worker profile not found"
          description="This profile may no longer be public."
          action={
            <LinkButton href="/employer/workers">Back to workers</LinkButton>
          }
        />
      );
    const photo = publicImageUrl(
      env.supabase.url,
      "worker-profile-images",
      worker.profile_photo_path,
    );
    return (
      <div className="mx-auto max-w-5xl">
        <WorkerProfileViewTracker workerProfileId={worker.id} />
        <Link
          href="/employer/workers"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to workers
        </Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <section>
            <div className="flex flex-wrap items-start gap-5">
              <div className="relative grid size-28 place-items-center overflow-hidden bg-muted sm:size-36">
                {photo ? (
                  <Image
                    src={photo}
                    alt={`${worker.full_name} profile`}
                    fill
                    priority
                    sizes="(min-width: 640px) 144px, 112px"
                    className="object-cover"
                  />
                ) : (
                  <UserRound className="size-9 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {worker.category_name || "Beauty professional"}
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                  {worker.full_name}
                </h1>
                <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {[worker.town, worker.county].filter(Boolean).join(", ") ||
                    worker.location ||
                    "Location not shared"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill
                    tone={
                      worker.availability_status === "available"
                        ? "success"
                        : "warning"
                    }
                  >
                    {worker.availability_status}
                  </StatusPill>
                  <StatusPill>
                    {worker.years_experience} years
                    {worker.experience_months
                      ? ` ${worker.experience_months} months`
                      : ""}{" "}
                    experience
                  </StatusPill>
                </div>
              </div>
            </div>
            <div className="mt-10 grid gap-8">
              <div>
                <h2 className="text-lg font-semibold">About the work</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {worker.short_bio ||
                    "This professional has not added a short bio yet."}
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Specialities</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Main speciality: {worker.category_name || "Not listed"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {worker.extra_specialty_names.length ? (
                    worker.extra_specialty_names.map((specialty) => (
                      <StatusPill key={specialty}>{specialty}</StatusPill>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No extra specialities listed.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Payments</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Preference: {worker.compensation_model.replaceAll("_", " ")}
                  {worker.salary_expectation !== null
                    ? ` · Amount: ${worker.salary_expectation}`
                    : ""}
                  {worker.commission_expectation !== null
                    ? ` · Commission: ${worker.commission_expectation}%`
                    : ""}
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Portfolio</h2>
                {portfolio.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {portfolio.map((item) => (
                      <PortfolioImage key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No portfolio images yet.
                  </p>
                )}
              </div>
            </div>
          </section>
          <aside className="h-fit border border-border bg-background p-6 lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Make a connection
            </p>
            <h2 className="mt-3 text-xl font-semibold">
              Interested in this worker?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Send a clear note about the opportunity. They can accept,
              consider, or decline.
            </p>
            {currentRequest &&
            ["pending", "considering", "accepted"].includes(
              currentRequest.status,
            ) ? (
              <p className="mt-6 text-sm text-muted-foreground">
                You already have a {currentRequest.status} request for this
                worker.
              </p>
            ) : (
              <div className="mt-6">
                <RequestButton
                  workerId={worker.id}
                  disabled={worker.availability_status === "matched"}
                />
              </div>
            )}
            {worker.availability_status === "matched" ? (
              <p className="mt-3 text-sm text-muted-foreground">
                This worker is already matched and cannot receive new requests.
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}

function PortfolioImage({
  item,
}: {
  item: Awaited<ReturnType<typeof getWorkerPortfolio>>[number];
}) {
  const image = publicImageUrl(
    env.supabase.url,
    item.storage_bucket,
    item.storage_path,
  );
  if (!image) return null;

  return (
    <div className="relative aspect-square overflow-hidden">
      <Image
        src={image}
        alt={item.alt_text || "Portfolio example"}
        fill
        sizes="(min-width: 1024px) 320px, (min-width: 640px) 40vw, 50vw"
        className="object-cover"
      />
    </div>
  );
}
