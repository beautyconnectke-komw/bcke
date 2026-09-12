import { NextResponse } from "next/server";
import {
  getAdminReactivationRequests,
  getAdminWorkers,
} from "@/lib/domain/beauty-connect";
import { getAuthContext } from "@/lib/domain/auth";
import { AuthenticationRequiredError, DomainError } from "@/lib/domain/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { profile } = await getAuthContext();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { message: "Administrator access is required." },
        { status: 403 },
      );
    }

    const tab = new URL(request.url).searchParams.get("tab");
    if (tab === "workers") {
      const workers = await getAdminWorkers();
      return NextResponse.json(
        workers
          .filter((worker) => worker.verification_status === "pending_review")
          .map(
            ({
              id,
              full_name,
              location,
              years_experience,
              verification_status,
            }) => ({
              id,
              full_name,
              location,
              years_experience,
              verification_status,
            }),
          ),
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (tab === "reactivations") {
      const requests = await getAdminReactivationRequests();
      return NextResponse.json(
        requests.map(
          ({ id, worker_profile_id, reason, created_at, worker }) => ({
            id,
            worker_profile_id,
            reason,
            created_at,
            worker: worker
              ? { id: worker.id, full_name: worker.full_name }
              : null,
          }),
        ),
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.json(
      { message: "A valid application tab is required." },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json(
        { message: "Authentication is required." },
        { status: 401 },
      );
    }
    if (error instanceof DomainError) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "Unable to load admin applications." },
      { status: 500 },
    );
  }
}
