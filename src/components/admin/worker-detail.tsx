import { MapPin, UserRound } from "lucide-react";
import Image from "next/image";
import type { AdminWorkerDetail } from "@/lib/domain/beauty-connect";
import { env } from "@/config/env";
import { publicImageUrl } from "@/lib/utils";
import { StatusPill } from "@/components/shared/ui";
import {
  ProfileUpdateReviewActions,
  WorkerReviewActions,
} from "@/components/admin/admin-actions";

export function AdminWorkerDetailView({
  detail,
}: {
  detail: AdminWorkerDetail;
}) {
  const { worker, portfolio } = detail;
  const photo = publicImageUrl(
    env.supabase.url,
    "worker-profile-images",
    worker.profile_photo_path,
  );
  const location =
    [worker.town, worker.county].filter(Boolean).join(", ") || worker.location;
  const payment = [
    worker.compensation_model.replaceAll("_", " "),
    worker.salary_expectation !== null
      ? `Amount: ${worker.salary_expectation}`
      : null,
    worker.commission_expectation !== null
      ? `Commission: ${worker.commission_expectation}%`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mt-8 grid gap-6">
      <section className="border border-border bg-background p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="relative grid size-28 shrink-0 place-items-center overflow-hidden bg-muted sm:size-36">
            {photo ? (
              <Image
                src={photo}
                alt=""
                fill
                sizes="(min-width: 640px) 144px, 112px"
                className="object-cover"
              />
            ) : (
              <UserRound className="size-9 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {worker.category_name || "Speciality not selected"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold">{worker.full_name}</h2>
            <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {location || "Location not provided"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill>
                {worker.verification_status.replace("_", " ")}
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
        <div className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
          <Detail label="Phone" value={worker.phone} />
          <Detail label="County" value={worker.county} />
          <Detail label="Town" value={worker.town} />
          <Detail label="Main speciality" value={worker.category_name} />
          <Detail
            label="Extra specialities"
            value={worker.extra_specialty_names.join(", ")}
          />
          <Detail label="Payments" value={payment} />
          <Detail label="Short bio" value={worker.short_bio} />
          <Detail label="Work experience" value={worker.work_experience} />
          <Detail
            label="Skills from application"
            value={worker.skills.join(", ")}
          />
        </div>
      </section>

      <section className="border border-border bg-background p-6">
        <h2 className="text-lg font-semibold">Portfolio</h2>
        {portfolio.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {portfolio.map((item) => {
              const image = publicImageUrl(
                env.supabase.url,
                item.storage_bucket,
                item.storage_path,
              );
              return image ? (
                <div
                  key={item.id}
                  className="relative aspect-square overflow-hidden"
                >
                  <Image
                    src={image}
                    alt={item.alt_text || "Portfolio example"}
                    fill
                    sizes="(min-width: 1024px) 220px, (min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : null;
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No portfolio images were submitted.
          </p>
        )}
      </section>

      {detail.profileUpdate ? <ProfileUpdateSection detail={detail} /> : null}

      {!detail.profileUpdate ? (
        <section className="border-t border-border pt-5">
          <WorkerReviewActions
            workerId={worker.id}
            status={
              worker.is_suspended ? "suspended" : worker.verification_status
            }
          />
        </section>
      ) : null}
    </div>
  );
}

function ProfileUpdateSection({ detail }: { detail: AdminWorkerDetail }) {
  const { worker, portfolio, profileUpdate } = detail;
  if (!profileUpdate) return null;

  const currentPhoto = publicImageUrl(
    env.supabase.url,
    "worker-profile-images",
    worker.profile_photo_path,
  );
  const requestedPhoto = publicImageUrl(
    env.supabase.url,
    "worker-profile-images",
    profileUpdate.profile_photo_path,
  );
  const currentExtras = worker.extra_specialty_names.join(", ") || "None";
  const requestedExtras =
    profileUpdate.extra_specialty_names.join(", ") || "None";
  const portfolioChanged = profileUpdate.portfolio_paths !== null;

  return (
    <section className="border border-amber-200 bg-amber-50/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
            Profile updates
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Review the worker&apos;s requested changes
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The approved profile remains live until you approve this update.
          </p>
        </div>
        <StatusPill tone="warning">Pending update</StatusPill>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <ChangeDetail
          label="Main speciality"
          current={worker.category_name || "Not provided"}
          requested={profileUpdate.category_name || "Not provided"}
        />
        <ChangeDetail
          label="Extra specialities"
          current={currentExtras}
          requested={requestedExtras}
        />
      </div>

      <div className="mt-6 grid gap-4 border-t border-amber-200 pt-6 sm:grid-cols-2">
        <ImageChange
          label="Profile image currently live"
          src={currentPhoto}
          emptyLabel="No current image"
        />
        <ImageChange
          label="Profile image requested"
          src={requestedPhoto}
          emptyLabel="No requested image"
        />
      </div>

      <div className="mt-6 border-t border-amber-200 pt-6">
        <h3 className="text-sm font-semibold">Portfolio</h3>
        {portfolioChanged ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <PortfolioPreview
              label="Current portfolio"
              paths={portfolio.map((item) => item.storage_path)}
            />
            <PortfolioPreview
              label="Requested portfolio"
              paths={profileUpdate.portfolio_paths ?? []}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No portfolio changes were requested.
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-amber-200 pt-5">
        <ProfileUpdateReviewActions updateId={profileUpdate.id} />
      </div>
    </section>
  );
}

function ChangeDetail({
  label,
  current,
  requested,
}: {
  label: string;
  current: string;
  requested: string;
}) {
  const changed = current !== requested;
  return (
    <div className="grid gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="grid gap-1 text-sm">
        <p>
          <span className="font-medium text-muted-foreground">Current:</span>{" "}
          {current}
        </p>
        <p className={changed ? "font-semibold text-amber-900" : ""}>
          <span className="font-medium text-muted-foreground">Requested:</span>{" "}
          {requested}
          {!changed ? " (unchanged)" : ""}
        </p>
      </div>
    </div>
  );
}

function ImageChange({
  label,
  src,
  emptyLabel,
}: {
  label: string;
  src: string | null;
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="relative mt-3 aspect-square max-w-48 overflow-hidden bg-muted">
        {src ? (
          <Image src={src} alt="" fill sizes="192px" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center p-4 text-center text-xs text-muted-foreground">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function PortfolioPreview({
  label,
  paths,
}: {
  label: string;
  paths: string[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      {paths.length ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {paths.map((path) => {
            const image = publicImageUrl(
              env.supabase.url,
              "worker-portfolio-images",
              path,
            );
            return image ? (
              <div
                key={path}
                className="relative aspect-square overflow-hidden"
              >
                <Image
                  src={image}
                  alt="Portfolio example"
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            ) : null;
          })}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No images.</p>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
        {value || "Not provided"}
      </p>
    </div>
  );
}
