import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleHelp,
  FileText,
  Image as ImageIcon,
  KeyRound,
  MapPin,
  Pencil,
  ShieldCheck,
  Sparkles,
  Settings2,
} from "lucide-react";
import type { EmployerProfile } from "@/lib/domain/beauty-connect";
import type { Tables } from "@/types/database";
import { env } from "@/config/env";
import { publicImageUrl } from "@/lib/utils";
import { LinkButton } from "@/components/shared/ui";

export function EmployerProfileView({
  profile,
  galleryPromise,
}: {
  profile: EmployerProfile;
  galleryPromise: Promise<Tables<"employer_gallery">[]>;
}) {
  const image = publicImageUrl(
    env.supabase.url,
    "employer-images",
    profile.profile_image_path,
  );
  const services = getServices(profile.salon_info);
  const location = [profile.location, profile.address_line]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-5xl pb-10">
      <section className="overflow-hidden rounded-3xl border border-[#dfe5dc] bg-white shadow-[0_18px_50px_rgba(26,54,32,0.06)]">
        <div className="h-28 bg-[linear-gradient(135deg,#e8def8_0%,#f6f3f5_52%,#e8f5e9_100%)] sm:h-36" />
        <div className="-mt-14 px-5 pb-6 sm:-mt-16 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="relative grid size-28 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-[#f0edef] text-2xl font-semibold text-[#035715] shadow-sm sm:size-32">
                {image ? (
                  <Image
                    src={image}
                    alt={profile.business_name}
                    fill
                    sizes="(min-width: 640px) 128px, 112px"
                    className="object-cover"
                  />
                ) : (
                  profile.business_name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#625b71]">
                  Employer profile
                </p>
                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-[#1b1b1d] sm:text-3xl">
                  {profile.business_name}
                </h1>
                {location ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-[#707a6d]">
                    <MapPin className="size-4" />
                    {location}
                  </p>
                ) : null}
              </div>
            </div>
            <LinkButton
              href="/employer/profile/edit"
              variant="primary"
              className="w-full rounded-xl bg-[#035715] hover:bg-[#024210] sm:w-auto"
            >
              <Pencil className="size-4" /> Edit profile
            </LinkButton>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="grid gap-5">
          <ProfileCard
            title="About the salon"
            icon={<BriefcaseBusiness className="size-5" />}
          >
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#40493e]">
              {profile.description ||
                "Add a short description to help beauty professionals understand your salon."}
            </p>
          </ProfileCard>
          <ProfileCard
            title="What you offer"
            icon={<Sparkles className="size-5" />}
          >
            {services.length ? (
              <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full bg-[#e8def8] px-3 py-1.5 text-xs font-semibold text-[#1b1b1d]"
                  >
                    {service}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#707a6d]">
                Add your services from Edit profile.
              </p>
            )}
          </ProfileCard>
          <ProfileCard
            title="Salon gallery"
            icon={<ImageIcon className="size-5" />}
          >
            <Suspense fallback={<GalleryFallback />}>
              <GalleryContent galleryPromise={galleryPromise} />
            </Suspense>
          </ProfileCard>
        </div>
        <aside className="grid content-start gap-5">
          <ProfileCard title="Contact" icon={<MapPin className="size-5" />}>
            <dl className="grid gap-4">
              <Summary
                label="Contact person"
                value={profile.contact_person || "Not added"}
              />
              <Summary label="Phone" value={profile.phone || "Not added"} />
              <Summary
                label="Email"
                value={profile.business_email || "Not added"}
              />
              <Summary
                label="Address"
                value={profile.address_line || profile.location || "Not added"}
              />
            </dl>
          </ProfileCard>
          <ProfileCard
            title="Account"
            icon={<ShieldCheck className="size-5" />}
          >
            <div className="grid gap-1">
              <AccountLink
                href="/employer/profile/settings"
                icon={<Settings2 className="size-4" />}
                label="Account settings"
              />
              <AccountLink
                href="/employer/profile/password"
                icon={<KeyRound className="size-4" />}
                label="Change password"
              />
              <AccountLink
                href="/employer/terms"
                icon={<FileText className="size-4" />}
                label="Terms & conditions"
              />
              <AccountLink
                href="/employer/privacy"
                icon={<ShieldCheck className="size-4" />}
                label="Privacy"
              />
              <AccountLink
                href="/employer/help"
                icon={<CircleHelp className="size-4" />}
                label="Help centre"
              />
            </div>
          </ProfileCard>
        </aside>
      </div>
      <div className="mt-6 flex justify-end">
        <Link
          href="/employer/profile/edit"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#035715] hover:underline"
        >
          Manage your profile <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

async function GalleryContent({
  galleryPromise,
}: {
  galleryPromise: Promise<Tables<"employer_gallery">[]>;
}) {
  try {
    const gallery = await galleryPromise;
    return gallery.length ? (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {gallery.map((item) => {
          const src = publicImageUrl(
            env.supabase.url,
            item.storage_bucket,
            item.storage_path,
          );
          return src ? (
            <div
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-2xl"
            >
              <Image
                src={src}
                alt="Salon"
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
        Showcase your salon, team, and work with a few images.
      </p>
    );
  } catch {
    return (
      <p className="text-sm leading-6 text-[#707a6d]">
        Gallery images are temporarily unavailable.
      </p>
    );
  }
}

function GalleryFallback() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-label="Loading gallery"
    >
      {["one", "two", "three", "four"].map((item) => (
        <div
          key={item}
          className="aspect-square animate-pulse rounded-2xl bg-[#f0edef]"
        />
      ))}
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
      <dd className="max-w-[60%] text-right text-sm font-semibold text-[#1b1b1d]">
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
function getServices(value: EmployerProfile["salon_info"]) {
  if (!value || typeof value !== "object" || !("services" in value)) return [];
  return String(value.services ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
