import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import {
  getCurrentEmployerProfile,
  getFeaturedWorkers,
  getSpecialityCarouselCategories,
  type WorkerMarketplaceItem,
} from "@/lib/domain/beauty-connect";
import { env } from "@/config/env";
import { publicImageUrl } from "@/lib/utils";
import { EmptyState, LinkButton, SetupState } from "@/components/shared/ui";
import {
  SpecialityCarousel,
  type SpecialityCarouselItem,
} from "@/components/employer/speciality-carousel";

export default async function EmployerHomePage() {
  try {
    // Start the independent marketplace request before waiting for the
    // profile. The profile header can stream as soon as auth/profile data is
    // ready while featured cards continue loading in the background.
    const workersPromise = getFeaturedWorkers();
    const categoriesPromise = getSpecialityCarouselCategories();
    const profile = await getCurrentEmployerProfile();

    if (!profile) {
      return (
        <EmptyState
          title="Complete your salon profile first"
          description="Workers need a clear picture of your business before they can decide whether to connect."
          action={
            <LinkButton href="/employer/onboarding">
              Complete profile
            </LinkButton>
          }
        />
      );
    }

    return (
      <div className="-mx-5 -mt-8 min-h-[calc(100svh-4rem)] bg-[#fff8fc] px-5 pb-14 pt-8 text-[#1b1b1d] sm:-mx-8 sm:px-8 sm:pt-10">
        <div className="mx-auto max-w-5xl">
          <section className="flex flex-col gap-6 border-b border-[#eadfe7] pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7478]">
                Welcome back
              </p>
              <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.75rem)] font-semibold tracking-[-0.03em]">
                Welcome, {profile.business_name}.
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#7a7478]">
                Find your next favorite professional.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <span className="text-sm font-medium text-[#514d50]">
                Search for workers fast today
              </span>
              <LinkButton
                href="/employer/workers"
                className="w-fit rounded-xl bg-[#035715] px-4 text-white shadow-sm hover:bg-[#024210]"
              >
                <Search className="size-4" />
                Find a worker
              </LinkButton>
            </div>
          </section>

          <Suspense fallback={<SpecialityCarouselFallback />}>
            <SpecialityCarouselSection categoriesPromise={categoriesPromise} />
          </Suspense>

          <Suspense fallback={<FeaturedWorkersFallback />}>
            <FeaturedWorkersSection workersPromise={workersPromise} />
          </Suspense>

          <section className="mt-10 border-t border-[#eadfe7] pt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a7478]">
                  Simple and direct
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">
                  How it works
                </h2>
              </div>
              <CheckCircle2 className="size-5 text-[#035715]" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["01", "Browse workers"],
                ["02", "Open a profile"],
                ["03", "Send a request"],
                ["04", "Connect when interest is mutual"],
              ].map(([number, label]) => (
                <div
                  key={number}
                  className="flex items-center gap-3 border-b border-[#eadfe7] pb-3 text-sm sm:border-0 sm:pb-0"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e8f5e9] text-xs font-semibold text-[#035715]">
                    {number}
                  </span>
                  <span className="text-[#514d50]">{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}

async function SpecialityCarouselSection({
  categoriesPromise,
}: {
  categoriesPromise: Promise<
    Awaited<ReturnType<typeof getSpecialityCarouselCategories>>
  >;
}) {
  try {
    const categories = await categoriesPromise;
    const items: SpecialityCarouselItem[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
      imageUrl: publicImageUrl(
        env.supabase.url,
        "speciality-images",
        category.image_path,
      ),
    }));
    return <SpecialityCarousel categories={items} />;
  } catch {
    return null;
  }
}

function SpecialityCarouselFallback() {
  return (
    <section
      className="mt-8 border-y border-[#eadfe7] py-7"
      aria-label="Loading specialities"
    >
      <div className="h-3 w-32 animate-pulse rounded bg-[#eadfe7]" />
      <div className="mt-2 h-6 w-56 animate-pulse rounded bg-[#eadfe7]" />
      <div className="mt-4 flex gap-3 overflow-hidden">
        {["one", "two", "three"].map((item) => (
          <div
            key={item}
            className="min-w-[220px] aspect-[1.45] animate-pulse rounded-2xl bg-[#f3eef1]"
          />
        ))}
      </div>
    </section>
  );
}

async function FeaturedWorkersSection({
  workersPromise,
}: {
  workersPromise: Promise<WorkerMarketplaceItem[]>;
}) {
  let workers: WorkerMarketplaceItem[];
  try {
    workers = await workersPromise;
  } catch {
    return null;
  }

  return (
    <section className="pt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a7478]">
            Curated for you
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">
            Featured workers
          </h2>
        </div>
        <Link
          href="/employer/workers"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#035715] underline-offset-4 hover:underline"
        >
          See all
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {workers.slice(0, 8).map((worker) => (
          <FeaturedWorkerCard key={worker.id} worker={worker} />
        ))}
        {workers.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-dashed border-[#ded4dc] bg-white px-6 py-10 text-center sm:col-span-3 lg:col-span-4">
            <h3 className="text-base font-semibold">No featured workers yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7a7478]">
              The Beauty Connect team will highlight approved workers here.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FeaturedWorkersFallback() {
  return (
    <section className="pt-8" aria-label="Loading featured workers">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="h-3 w-28 animate-pulse rounded bg-[#eadfe7]" />
          <div className="mt-2 h-6 w-40 animate-pulse rounded bg-[#eadfe7]" />
        </div>
        <div className="h-4 w-14 animate-pulse rounded bg-[#eadfe7]" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="aspect-[0.86] animate-pulse rounded-xl bg-[#f3eef1]"
          />
        ))}
      </div>
    </section>
  );
}

function FeaturedWorkerCard({ worker }: { worker: WorkerMarketplaceItem }) {
  const image = publicImageUrl(
    env.supabase.url,
    "worker-profile-images",
    worker.profile_photo_path,
  );
  const location =
    [worker.town, worker.county].filter(Boolean).join(", ") ||
    worker.location ||
    "Location not shared";

  return (
    <Link
      href={`/employer/workers/${worker.id}`}
      className="group min-w-0 rounded-2xl border border-[#eee5eb] bg-white p-2.5 shadow-[0_4px_18px_rgba(31,17,29,0.03)] transition hover:-translate-y-0.5 hover:border-[#b9ceb9] sm:p-3"
    >
      <div className="relative aspect-[0.86] overflow-hidden rounded-xl bg-[#f3eef1]">
        {image ? (
          <Image
            src={image}
            alt={`${worker.full_name} profile`}
            fill
            sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <UserRound className="size-7 text-[#a19aa0]" />
          </div>
        )}
      </div>
      <div className="min-w-0 px-0.5 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold tracking-[-0.01em] group-hover:text-[#035715]">
            {worker.full_name}
          </h3>
          <span
            className="mt-1 size-1.5 shrink-0 rounded-full bg-[#035715]"
            title="Available"
          />
        </div>
        <p className="mt-1 truncate text-xs text-[#7a7478]">
          {worker.category_name || "Beauty professional"}
        </p>
        <p className="mt-2 flex items-start gap-1 text-[10px] leading-4 text-[#7a7478]">
          <MapPin className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-2">{location}</span>
        </p>
        <p className="mt-2 text-[10px] font-medium text-[#514d50]">
          {worker.years_experience} years experience
        </p>
      </div>
    </Link>
  );
}
