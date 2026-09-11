import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CircleHelp,
  FileText,
  KeyRound,
  MapPin,
  Pencil,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Category, WorkerProfile } from "@/lib/domain/beauty-connect";
import type { Tables } from "@/types/database";
import { env } from "@/config/env";
import { calculateExperience, publicImageUrl } from "@/lib/utils";
import { LinkButton, StatusPill } from "@/components/shared/ui";

export function WorkerProfileView({
  profile,
  categories,
  portfolio,
}: {
  profile: WorkerProfile;
  categories: Category[];
  portfolio: Tables<"worker_portfolio">[];
}) {
  const photo = publicImageUrl(
    env.supabase.url,
    "worker-profile-images",
    profile.profile_photo_path,
  );
  const category = categories.find((item) => item.id === profile.category_id);
  const extraSpecialties = profile.extra_specialty_ids
    .map((id) => categories.find((item) => item.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const experience = calculateExperience(
    profile.created_at,
    profile.years_experience,
    profile.experience_months,
  );
  const location = [profile.town, profile.county].filter(Boolean).join(", ");
  const verificationTone =
    profile.verification_status === "approved"
      ? "success"
      : profile.verification_status === "rejected"
        ? "danger"
        : "warning";

  return (
    <div className="mx-auto max-w-5xl pb-10">
      <section className="overflow-hidden rounded-3xl border border-[#dfe5dc] bg-white shadow-[0_18px_50px_rgba(26,54,32,0.06)]">
        <div className="h-28 bg-[linear-gradient(135deg,#e8def8_0%,#f6f3f5_52%,#e8f5e9_100%)] sm:h-36" />
        <div className="-mt-14 px-5 pb-6 sm:-mt-16 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="relative grid size-28 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-[#f0edef] text-2xl font-semibold text-[#035715] shadow-sm sm:size-32">
                {photo ? (
                  <Image
                    src={photo}
                    alt="Worker profile"
                    fill
                    sizes="(min-width: 640px) 128px, 112px"
                    className="object-cover"
                  />
                ) : (
                  profile.full_name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-bold tracking-tight text-[#1b1b1d] sm:text-3xl">
                    {profile.full_name}
                  </h1>
                  {profile.verification_status === "approved" ? (
                    <BadgeCheck
                      className="size-5 shrink-0 text-[#035715]"
                      aria-label="Verified worker"
                    />
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-medium text-[#625b71]">
                  {category?.name ?? "Beauty professional"}
                </p>
                {location ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-[#707a6d]">
                    <MapPin className="size-4" /> {location}
                  </p>
                ) : null}
              </div>
            </div>
            <LinkButton
              href="/worker/profile/edit"
              variant="primary"
              className="w-full rounded-xl bg-[#035715] hover:bg-[#024210] sm:w-auto"
            >
              <Pencil className="size-4" /> Edit profile
            </LinkButton>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <StatusPill tone={verificationTone}>
              {formatStatus(profile.verification_status)}
            </StatusPill>
            <StatusPill
              tone={
                profile.availability_status === "available"
                  ? "success"
                  : "neutral"
              }
            >
              {formatStatus(profile.availability_status)}
            </StatusPill>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="grid gap-5">
          <ProfileCard
            title="About your work"
            icon={<Sparkles className="size-5" />}
          >
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#40493e]">
              {profile.short_bio ||
                "Add a short introduction so employers know what you do best."}
            </p>
          </ProfileCard>

          <ProfileCard
            title="Specialties"
            icon={<BriefcaseBusiness className="size-5" />}
          >
            <div className="flex flex-wrap gap-2">
              {[category?.name, ...extraSpecialties]
                .filter(Boolean)
                .map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[#e8def8] px-3 py-1.5 text-xs font-semibold text-[#1b1b1d]"
                  >
                    {item}
                  </span>
                ))}
              {!category && !extraSpecialties.length ? (
                <p className="text-sm text-[#707a6d]">
                  No specialties added yet.
                </p>
              ) : null}
            </div>
          </ProfileCard>

          <ProfileCard title="Portfolio" icon={<Sparkles className="size-5" />}>
            {portfolio.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {portfolio.map((item) => {
                  const image = publicImageUrl(
                    env.supabase.url,
                    item.storage_bucket,
                    item.storage_path,
                  );
                  return image ? (
                    <div
                      key={item.id}
                      className="relative aspect-square overflow-hidden rounded-2xl"
                    >
                      <Image
                        src={image}
                        alt={item.alt_text || "Portfolio example"}
                        fill
                        sizes="(min-width: 1024px) 280px, (min-width: 640px) 40vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[#707a6d]">
                Your approved portfolio images will appear here.
              </p>
            )}
          </ProfileCard>
        </div>

        <aside className="grid content-start gap-5">
          <ProfileCard
            title="At a glance"
            icon={<BadgeCheck className="size-5" />}
          >
            <dl className="grid gap-4">
              <Summary
                label="Experience"
                value={`${experience.years} yrs${experience.months ? ` ${experience.months} mos` : ""}`}
              />
              <Summary
                label="Compensation"
                value={formatCompensation(profile.compensation_model)}
              />
              <Summary
                label="Salary expectation"
                value={
                  profile.salary_expectation
                    ? `KES ${Number(profile.salary_expectation).toLocaleString("en-KE")}`
                    : "Negotiable"
                }
              />
            </dl>
          </ProfileCard>

          <ProfileCard
            title="Account"
            icon={<ShieldCheck className="size-5" />}
          >
            <div className="grid gap-1">
              <AccountLink
                href="/worker/profile/password"
                icon={<KeyRound className="size-4" />}
                label="Change password"
              />
              <AccountLink
                href="/worker/terms"
                icon={<FileText className="size-4" />}
                label="Terms & conditions"
              />
              <AccountLink
                href="/worker/privacy"
                icon={<ShieldCheck className="size-4" />}
                label="Privacy"
              />
              <AccountLink
                href="/worker/help"
                icon={<CircleHelp className="size-4" />}
                label="Help centre"
              />
            </div>
          </ProfileCard>
        </aside>
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          href="/worker/profile/edit"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#035715] hover:underline"
        >
          Manage your profile <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function ProfileCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#dfe5dc] bg-white p-5 shadow-[0_12px_40px_rgba(26,54,32,0.04)] sm:p-6">
      <div className="mb-4 flex items-center gap-2 text-[#035715]">
        {icon}
        <h2 className="text-base font-bold text-[#1b1b1d]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f0edef] pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-[#707a6d]">{label}</dt>
      <dd className="text-right text-sm font-semibold text-[#1b1b1d]">
        {value}
      </dd>
    </div>
  );
}

function AccountLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-between rounded-xl px-2 text-sm font-medium text-[#40493e] transition hover:bg-[#f6f3f5] hover:text-[#035715]"
    >
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>
      <ArrowRight className="size-4 text-[#707a6d]" />
    </Link>
  );
}

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCompensation(value: WorkerProfile["compensation_model"]) {
  return value === "salary_plus_commission"
    ? "Salary + commission"
    : formatStatus(value);
}

