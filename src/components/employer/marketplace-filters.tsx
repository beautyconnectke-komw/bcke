"use client";

import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { FormEvent, useEffect, useState, useTransition } from "react";
import type { Category } from "@/lib/domain/beauty-connect";
import { cn } from "@/lib/utils";

type CompensationFilter = "salary" | "commission" | "salary_plus_commission";

const emptyFilters = {
  county: "",
  categoryId: "",
  extraSpecialtyId: "",
  minimumYearsExperience: "",
  compensationModel: "" as CompensationFilter | "",
};

export function MarketplaceFilters({
  categories,
  search,
  categoryId,
  county,
  extraSpecialtyId,
  minimumYearsExperience,
  compensationModel,
}: {
  categories: Category[];
  search?: string;
  categoryId?: string;
  county?: string;
  extraSpecialtyId?: string;
  minimumYearsExperience?: number;
  compensationModel?: CompensationFilter;
}) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search ?? "");
  const [draftFilters, setDraftFilters] = useState({
    county: county ?? "",
    categoryId: categoryId ?? "",
    extraSpecialtyId: extraSpecialtyId ?? "",
    minimumYearsExperience:
      minimumYearsExperience === undefined
        ? ""
        : String(minimumYearsExperience),
    compensationModel: compensationModel ?? "",
  });
  useEffect(() => {
    if (!filterOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filterOpen]);
  const activeFilterCount = [
    draftFilters.county,
    draftFilters.categoryId,
    draftFilters.extraSpecialtyId,
    draftFilters.minimumYearsExperience,
    draftFilters.compensationModel,
  ].filter(Boolean).length;

  function navigate(
    nextFilters: typeof draftFilters,
    nextSearch = searchValue,
  ) {
    const params = new URLSearchParams();
    const trimmedSearch = nextSearch.trim();
    if (trimmedSearch) params.set("search", trimmedSearch);
    if (nextFilters.county.trim())
      params.set("county", nextFilters.county.trim());
    if (nextFilters.categoryId) params.set("category", nextFilters.categoryId);
    if (nextFilters.extraSpecialtyId)
      params.set("extra", nextFilters.extraSpecialtyId);
    if (nextFilters.minimumYearsExperience)
      params.set("experience", nextFilters.minimumYearsExperience);
    if (nextFilters.compensationModel)
      params.set("compensation", nextFilters.compensationModel);
    startTransition(() => {
      router.push(
        params.toString()
          ? `/employer/workers?${params.toString()}`
          : "/employer/workers",
      );
    });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(draftFilters);
  }

  function applyFilters() {
    navigate(draftFilters);
    setFilterOpen(false);
  }

  function clearFilters() {
    setDraftFilters(emptyFilters);
    navigate(emptyFilters);
    setFilterOpen(false);
  }

  return (
    <>
      <form onSubmit={submitSearch} className="mt-6">
        <div className="flex items-center gap-2 rounded-2xl border border-[#eee5eb] bg-white p-2 shadow-[0_4px_18px_rgba(31,17,29,0.03)]">
          <label htmlFor="marketplace-search" className="sr-only">
            Search workers
          </label>
          <Search className="ml-2 size-4 shrink-0 text-[#a19aa0]" />
          <input
            id="marketplace-search"
            name="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-[#a19aa0]"
            placeholder="Search name, speciality, or location"
          />
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            aria-label="Open worker filters"
            className={cn(
              "relative grid size-10 shrink-0 place-items-center rounded-xl text-[#514d50] transition hover:bg-[#f7f1f5]",
              activeFilterCount > 0 &&
                "bg-[#1b1b1d] text-white hover:bg-[#1b1b1d]",
            )}
          >
            <SlidersHorizontal className="size-4" />
            {activeFilterCount > 0 ? (
              <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[#d89bc2] text-[9px] font-bold text-[#1b1b1d]">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
        {isPending ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Updating results…
          </p>
        ) : null}
      </form>

      {filterOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-end bg-[#1b1b1d]/35 p-0 sm:items-center sm:justify-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFilterOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketplace-filter-title"
            className="w-full max-w-lg overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"
          >
            <div className="flex items-center justify-between border-b border-[#eee5eb] px-5 py-4">
              <h2
                id="marketplace-filter-title"
                className="text-sm font-semibold"
              >
                Filter workers
              </h2>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                aria-label="Close worker filters"
                className="grid size-9 place-items-center rounded-full text-[#7a7478] hover:bg-[#f7f1f5] hover:text-[#1b1b1d]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid max-h-[min(70svh,36rem)] gap-5 overflow-y-auto p-5">
              <label className="grid gap-2 text-sm font-medium">
                Location
                <input
                  value={draftFilters.county}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      county: event.target.value,
                    }))
                  }
                  className="field"
                  placeholder="County, town, or area"
                />
              </label>

              <SelectFilter
                label="Main speciality"
                value={draftFilters.categoryId}
                onChange={(value) =>
                  setDraftFilters((current) => ({
                    ...current,
                    categoryId: value,
                  }))
                }
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
              />

              <SelectFilter
                label="Extra speciality"
                value={draftFilters.extraSpecialtyId}
                onChange={(value) =>
                  setDraftFilters((current) => ({
                    ...current,
                    extraSpecialtyId: value,
                  }))
                }
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
              />

              <SelectFilter
                label="Years of experience"
                value={draftFilters.minimumYearsExperience}
                onChange={(value) =>
                  setDraftFilters((current) => ({
                    ...current,
                    minimumYearsExperience: value,
                  }))
                }
                options={[
                  { value: "1", label: "1+ years" },
                  { value: "3", label: "3+ years" },
                  { value: "5", label: "5+ years" },
                  { value: "10", label: "10+ years" },
                ]}
              />

              <div>
                <p className="text-sm font-medium">Compensation</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      ["salary", "Salary"],
                      ["commission", "Commission"],
                      ["salary_plus_commission", "Salary + commission"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setDraftFilters((current) => ({
                          ...current,
                          compensationModel:
                            current.compensationModel === value ? "" : value,
                        }))
                      }
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-xs font-medium transition",
                        draftFilters.compensationModel === value
                          ? "border-[#1b1b1d] bg-[#1b1b1d] text-white"
                          : "border-[#eee5eb] bg-white text-[#514d50] hover:border-[#1b1b1d]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-[#eee5eb] bg-[#fffafb] p-4 sm:p-5">
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-11 flex-1 rounded-xl border border-[#d8d0d5] px-4 text-sm font-medium text-[#514d50] transition hover:border-[#1b1b1d]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="min-h-11 flex-1 rounded-xl bg-[#1b1b1d] px-4 text-sm font-medium text-white transition hover:bg-[#363337]"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      >
        <option value="">Any {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
