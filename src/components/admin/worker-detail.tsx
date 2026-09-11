import { MapPin, UserRound } from "lucide-react";
import Image from "next/image";
import type { AdminWorkerDetail } from "@/lib/domain/beauty-connect";
import { env } from "@/config/env";
import { publicImageUrl } from "@/lib/utils";
import { StatusPill } from "@/components/shared/ui";
import { WorkerReviewActions } from "@/components/admin/admin-actions";

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

      <section className="border-t border-border pt-5">
        <WorkerReviewActions
          workerId={worker.id}
          status={
            worker.is_suspended ? "suspended" : worker.verification_status
          }
        />
      </section>
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
