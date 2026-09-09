import {
  getCategories,
  getWorkerMarketplace,
} from "@/lib/domain/beauty-connect";
import { EmptyState, SectionHeading, SetupState } from "@/components/shared/ui";
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
    const availability =
      params.availability === "available" ||
      params.availability === "considering"
        ? params.availability
        : undefined;
    const [workers, categories] = await Promise.all([
      getWorkerMarketplace({ search, categoryId, availability }),
      getCategories(),
    ]);
    return (
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Marketplace"
          title="Find a worker"
          description="Browse approved beauty professionals who are open to the right opportunity."
        />
        <form className="mt-6 grid gap-3 border-b border-border pb-6 sm:grid-cols-[1fr_0.6fr_0.6fr_auto]">
          <input
            name="search"
            defaultValue={search}
            className="field"
            placeholder="Search name or profession"
          />
          <select
            name="category"
            defaultValue={categoryId ?? ""}
            className="field"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            name="availability"
            defaultValue={availability ?? ""}
            className="field"
          >
            <option value="">Any availability</option>
            <option value="available">Available</option>
            <option value="considering">Considering</option>
          </select>
          <button className="min-h-11 rounded-md bg-foreground px-5 text-sm font-medium text-background">
            Search
          </button>
        </form>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {workers.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
          {workers.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                title="No approved workers match that search."
                description="Try a different name, category, or availability filter."
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
