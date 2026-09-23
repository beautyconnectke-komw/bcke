import { NextResponse } from "next/server";
import { processDuePushCampaignDeliveries } from "@/lib/server/push-campaign-scheduler";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await processDuePushCampaignDeliveries();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Campaign scheduler failed.",
      },
      { status: 500 },
    );
  }
}
