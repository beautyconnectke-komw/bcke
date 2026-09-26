import { NextResponse } from "next/server";
import {
  processDuePushCampaignDeliveries,
  PushCampaignSchedulerError,
} from "@/lib/server/push-campaign-scheduler";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret");
  if (!cronSecret || providedSecret !== cronSecret) {
    console.warn("[push-campaigns] Unauthorized cron request", {
      secretConfigured: Boolean(cronSecret),
      headerProvided: Boolean(providedSecret),
    });
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await processDuePushCampaignDeliveries();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[push-campaigns] Cron execution failed", {
      operation:
        error instanceof PushCampaignSchedulerError
          ? error.operation
          : "unknown",
      deliveryId:
        error instanceof PushCampaignSchedulerError
          ? error.deliveryId
          : undefined,
      error: error instanceof Error ? error.message : "Unknown error.",
    });
    return NextResponse.json(
      { message: "Campaign scheduler failed." },
      { status: 500 },
    );
  }
}
