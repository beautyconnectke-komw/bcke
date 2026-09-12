import { Suspense } from "react";
import Link from "next/link";
import {
  getCategories,
  getWorkerMarketplace,
  type Category,
  type WorkerMarketplacePage,
} from "@/lib/domain/beauty-connect";
import { EmptyState, SectionHeading, SetupState } from "@/components/shared/ui";
import { MarketplaceFilters as MarketplaceFiltersControl } from "@/components/employer/marketplace-filters";
import { WorkerCard } from "@/components/employer/worker-card";

export default async function EmployerWorkersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  try {
    const params = searchParams ? await searchParams : {};
    const search =
      typeof params.search === "string" ? params.search : undefined;
    const categoryId =
      typeof params.category === "string" ? params.category : undefined;
    const extraSpecialtyId =
      typeof params.extra === "string" ? params.extra : undefined;
    const county =
      typeof params.county === "string" ? params.county : undefined;
    const availability =
      params.availability === "available" ||
      params.availability === "considering"
        ? params.availability
        : undefined;
    const requestedExperience =
      typeof params.experience === "string" ? Number(params.experience) : NaN;
    const minimumYearsExperience =
      Number.isInteger(requestedExperience) && requestedExperience >= 0
        ? Math.min(requestedExperience, 80)
        : undefined;
    const compensationModel =
      params.compensation === "salary" ||
      params.compensation === "commission" ||
      params.compensation === "salary_plus_commission"
        ? params.compensation
        : undefined;
    const requestedPage =
      typeof params.page === "string" ? Number(params.page) : 1;
    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? Math.min(requestedPage, 1000)
        : 1;
    const workersPromise = getWorkerMarketplace(
      {
        search,
        categoryId,
        extraSpecialtyId,
        county,
        availability,
        minimumYearsExperience,
        compensationModel,
      },
      page,
    );
    const categoriesPromise = getCategories();

    return (
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Marketplace"
          title="Find a worker"
          description="Browse approved beauty professionals who are open to the right opportunity."
        />
        <Suspense fallback={<MarketplaceFiltersFallback />}>
          <MarketplaceFilters
            categoriesPromise={categoriesPromise}
            search={search}
            categoryId={categoryId}
            county={county}
            extraSpecialtyId={extraSpecialtyId}
            minimumYearsExperience={minimumYearsExperience}
            compensationModel={compensationModel}
          />
        </Suspense>
        <Suspense fallback={<MarketplaceResultsFallback />}>
          <MarketplaceResults
            workersPromise={workersPromise}
            search={search}
            categoryId={categoryId}
            county={county}
            extraSpecialtyId={extraSpecialtyId}
            minimumYearsExperience={minimumYearsExperience}
            compensationModel={compensationModel}
            availability={availability}
          />
        </Suspense>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}

async function MarketplaceFilters({
  categoriesPromise,
  search,
  categoryId,
  county,
  extraSpecialtyId,
  minimumYearsExperience,
  compensationModel,
}: {
  categoriesPromise: Promise<Category[]>;
  search?: string;
  categoryId?: string;
  county?: string;
  extraSpecialtyId?: string;
  minimumYearsExperience?: number;
  compensationModel?: "salary" | "commission" | "salary_plus_commission";
}) {
  try {
    const categories = await categoriesPromise;
    return (
      <MarketplaceFiltersControl
        categories={categories}
        search={search}
        categoryId={categoryId}
        county={county}
        extraSpecialtyId={extraSpecialtyId}
        minimumYearsExperience={minimumYearsExperience}
        compensationModel={compensationModel}
      />
    );
  } catch {
    return <MarketplaceFiltersFallback />;
  }
}

async function MarketplaceResults({
  workersPromise,
  search,
  categoryId,
  county,
  extraSpecialtyId,
  minimumYearsExperience,
  compensationModel,
  availability,
}: {
  workersPromise: Promise<WorkerMarketplacePage>;
  search?: string;
  categoryId?: string;
  county?: string;
  extraSpecialtyId?: string;
  minimumYearsExperience?: number;
  compensationModel?: "salary" | "commission" | "salary_plus_commission";
  availability?: "available" | "considering";
}) {
  try {
    const { workers, hasMore, page } = await workersPromise;
    const nextPageParams = new URLSearchParams();
    if (search) nextPageParams.set("search", search);
    if (categoryId) nextPageParams.set("category", categoryId);
    if (extraSpecialtyId) nextPageParams.set("extra", extraSpecialtyId);
    if (county) nextPageParams.set("county", county);
    if (minimumYearsExperience !== undefined)
      nextPageParams.set("experience", String(minimumYearsExperience));
    if (compensationModel)
      nextPageParams.set("compensation", compensationModel);
    if (availability) nextPageParams.set("availability", availability);
    nextPageParams.set("page", String(page + 1));
    return (
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {workers.map((worker) => (
          <WorkerCard key={worker.id} worker={worker} />
        ))}
        {workers.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              title="No approved workers match that search."
              description="Try a different name, county, category, or availability filter."
            />
          </div>
        ) : null}
        {hasMore ? (
          <div className="col-span-2 mt-3 flex justify-center lg:col-span-3">
            <Link
              href={`/employer/workers?${nextPageParams.toString()}`}
              className="rounded-md border border-border px-5 py-3 text-sm font-medium transition hover:border-foreground"
            >
              See More
            </Link>
          </div>
        ) : null}
      </div>
    );
  } catch {
    return <SetupState />;
  }
}

function MarketplaceFiltersFallback() {
  return (
    <div
      className="mt-6 border-b border-border pb-6"
      aria-label="Loading marketplace filters"
    >
      <div className="h-14 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

function MarketplaceResultsFallback() {
  return (
    <div
      className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
      aria-label="Loading workers"
    >
      {["one", "two", "three", "four", "five", "six"].map((item) => (
        <div
          key={item}
          className="h-64 animate-pulse rounded-2xl bg-muted/60"
        />
      ))}
    </div>
  );
}
