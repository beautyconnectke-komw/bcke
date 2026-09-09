import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function publicImageUrl(
  url: string | undefined,
  bucket: string,
  path: string | null | undefined,
) {
  if (!url || !path) return null;
  return `${url.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export function calculateExperience(
  startedAt: string | null | undefined,
  baseYears = 0,
  baseMonths = 0,
  now = new Date(),
) {
  const started = startedAt ? new Date(startedAt) : null;
  if (!started || Number.isNaN(started.getTime())) {
    return { years: baseYears, months: baseMonths };
  }

  let elapsedMonths =
    (now.getUTCFullYear() - started.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - started.getUTCMonth());
  if (now.getUTCDate() < started.getUTCDate()) elapsedMonths -= 1;

  const totalMonths = baseYears * 12 + baseMonths + Math.max(0, elapsedMonths);
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
}
