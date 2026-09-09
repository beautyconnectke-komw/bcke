import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone, UserRound } from "lucide-react";
import {
  getEmployerGallery,
  getEmployerProfile,
} from "@/lib/domain/beauty-connect";
import { env } from "@/config/env";
import { publicImageUrl } from "@/lib/utils";
import { EmptyState, LinkButton, SetupState } from "@/components/shared/ui";

export default async function WorkerEmployerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const [employer, gallery] = await Promise.all([
      getEmployerProfile(id),
      getEmployerGallery(id),
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
            <div className="grid size-28 shrink-0 place-items-center overflow-hidden bg-muted sm:size-36">
              {image ? (
                <img src={image} alt="" className="size-full object-cover" />
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
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                {employer.phone ? (
                  <p className="flex items-center gap-2">
                    <Phone className="size-4" /> {employer.phone}
                  </p>
                ) : null}
                {employer.business_email ? (
                  <p className="flex items-center gap-2 break-all">
                    <Mail className="size-4" /> {employer.business_email}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

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
                  {gallery.map((item) => (
                    <img
                      key={item.id}
                      src={
                        publicImageUrl(
                          env.supabase.url,
                          item.storage_bucket,
                          item.storage_path,
                        ) ?? ""
                      }
                      alt="Salon"
                      className="aspect-square w-full object-cover"
                    />
                  ))}
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
