import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, MapPin, Phone, UserRound } from "lucide-react";
import {
  getCurrentWorkerRequestForEmployer,
  getEmployerGallery,
  getEmployerProfile,
} from "@/lib/domain/beauty-connect";
import { env } from "@/config/env";
import { publicImageUrl } from "@/lib/utils";
import { EmptyState, LinkButton, SetupState } from "@/components/shared/ui";
import { WorkerRequestActions } from "@/components/worker/worker-request-actions";

export default async function WorkerEmployerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const [employer, gallery, request] = await Promise.all([
      getEmployerProfile(id),
      getEmployerGallery(id),
      getCurrentWorkerRequestForEmployer(id),
    ]);
    if (!employer) {
      return (
        <EmptyState
          title="Salon profile not found"
          description="This salon may no longer be available or may not have requested you."
          action={<LinkButton href="/worker/status">Back to status</LinkButton>}
        />
      );
    }

    const image = publicImageUrl(
      env.supabase.url,
      "employer-images",
      employer.profile_image_path,
    );
    const services =
      typeof employer.salon_info === "object" &&
      employer.salon_info &&
      "services" in employer.salon_info
        ? String(employer.salon_info.services ?? "")
        : "";

    return (
      <div className="mx-auto max-w-4xl">
        <Link
          href="/worker/status"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to status
        </Link>
        <section className="mt-6 border border-border bg-background p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative grid size-28 shrink-0 place-items-center overflow-hidden bg-muted sm:size-36">
              {image ? (
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 144px, 112px"
                  className="object-cover"
                />
              ) : (
                <UserRound className="size-10 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Salon details
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {employer.business_name}
              </h1>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {[employer.location, employer.address_line]
                  .filter(Boolean)
                  .join(", ") || "Location not shared"}
              </p>
              {employer.contact_unlocked ? (
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <UserRound className="size-4" />
                    Operator: {employer.contact_person || "Not provided"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-4" />
                    {employer.phone || "Phone not provided"}
                  </p>
                  <p className="flex items-center gap-2 break-all">
                    <Mail className="size-4" />
                    {employer.business_email || "Email not provided"}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {request &&
          (request.status === "pending" || request.status === "considering") ? (
            <div className="mt-8 border-t border-border pt-8">
              <h2 className="text-lg font-semibold">Respond to this request</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Let the salon know whether you want to accept, consider, or
                decline this opportunity.
              </p>
              <div className="mt-4">
                <WorkerRequestActions requestId={request.id} />
              </div>
            </div>
          ) : null}

          <div className="mt-10 grid gap-8 border-t border-border pt-8">
            <div>
              <h2 className="text-lg font-semibold">About the salon</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {employer.description ||
                  "This salon has not added a description yet."}
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Services offered</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {services || "Services have not been listed yet."}
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Salon images</h2>
              {gallery.length ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {gallery.map((item) => {
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
                          alt="Salon"
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
                  No salon images have been added yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
