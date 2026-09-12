"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useRef } from "react";

export type SpecialityCarouselItem = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export function SpecialityCarousel({
  categories,
}: {
  categories: SpecialityCarouselItem[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (categories.length === 0) return null;

  function scroll(direction: number) {
    scrollerRef.current?.scrollBy({
      left: direction * Math.max(260, scrollerRef.current.clientWidth * 0.72),
      behavior: "smooth",
    });
  }

  return (
    <section
      className="mt-8 border-y border-[#eadfe7] py-7"
      aria-labelledby="speciality-heading"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a7478]">
            Most requested specialities
          </p>
          <h2
            id="speciality-heading"
            className="mt-1 text-lg font-semibold tracking-[-0.02em]"
          >
            Find the right professional
          </h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Show previous specialities"
            className="grid size-9 place-items-center rounded-full border border-[#ded4dc] bg-white text-[#514d50] transition hover:border-[#9dbb9d] hover:text-[#035715]"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Show more specialities"
            className="grid size-9 place-items-center rounded-full border border-[#ded4dc] bg-white text-[#514d50] transition hover:border-[#9dbb9d] hover:text-[#035715]"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        aria-label="Available specialities"
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/employer/workers?category=${encodeURIComponent(category.id)}`}
            className="group relative min-w-[220px] snap-start overflow-hidden rounded-2xl bg-[#1b1b1d] shadow-[0_8px_24px_rgba(31,17,29,0.08)] transition hover:-translate-y-0.5 sm:min-w-[245px]"
          >
            <div className="relative aspect-[1.45] overflow-hidden">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={`${category.name} speciality`}
                  fill
                  sizes="(min-width: 640px) 245px, 220px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="grid size-full place-items-center bg-gradient-to-br from-[#e8f5e9] via-[#d8ebdc] to-[#a8c8ad]">
                  <Sparkles className="size-9 text-[#035715]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="text-base font-semibold tracking-[-0.01em]">
                  {category.name}
                </h3>
                <p className="mt-1 text-xs text-white/80">
                  Browse available professionals
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
