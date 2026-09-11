import Link from "next/link";
import Image from "next/image";
import { MapPin, UserRound } from "lucide-react";
import type { WorkerMarketplaceItem } from "@/lib/domain/beauty-connect";
import { env } from "@/config/env";
import { publicImageUrl } from "@/lib/utils";

export function WorkerCard({ worker }: { worker: WorkerMarketplaceItem }) {
  const image = publicImageUrl(
    env.supabase.url,
    "worker-profile-images",
    worker.profile_photo_path,
  );
  return (
    <Link
      href={`/employer/workers/${worker.id}`}
      className="group min-w-0 border border-border bg-background p-3 transition hover:-translate-y-1 hover:border-foreground sm:p-4"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <UserRound className="size-7 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="mt-3 min-w-0">
        <h3 className="truncate text-sm font-semibold group-hover:underline sm:text-base">
          {worker.full_name}
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">
          {worker.category_name || "Beauty professional"}
        </p>
        <p className="mt-2 flex items-start gap-1 text-xs leading-4 text-muted-foreground">
          <MapPin className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-2">
            {[worker.town, worker.county].filter(Boolean).join(", ") ||
              worker.location ||
              "Location not shared"}
          </span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {worker.years_experience} years
          {worker.experience_months
            ? ` ${worker.experience_months} months`
            : ""}{" "}
          experience
        </p>
      </div>
    </Link>
  );
}
