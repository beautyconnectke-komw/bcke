import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushForNotifications } from "@/lib/server/notification-push";
import type { Database } from "@/types/database";

type ClaimedDelivery =
  Database["public"]["Functions"]["bc_claim_push_campaign_deliveries"]["Returns"][number];

export type PushCampaignSchedulerResult = {
  claimed: number;
  sent: number;
  failed: number;
};

export async function processDuePushCampaignDeliveries(
  limit = 50,
): Promise<PushCampaignSchedulerResult> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Push campaign scheduler is not configured.");

  const { data: claimed, error: claimError } = await admin.rpc(
    "bc_claim_push_campaign_deliveries",
    { p_limit: limit },
  );
  if (claimError) throw new Error(claimError.message);

  const result: PushCampaignSchedulerResult = {
    claimed: claimed?.length ?? 0,
    sent: 0,
    failed: 0,
  };

  for (const delivery of (claimed ?? []) as ClaimedDelivery[]) {
    try {
      const { data: notificationId, error: notificationError } =
        await admin.rpc("bc_create_push_campaign_notification", {
          p_delivery_id: delivery.delivery_id,
        });
      if (notificationError || !notificationId) {
        await finalizeFailed(
          admin,
          delivery.delivery_id,
          notificationError?.message ??
            "Campaign notification could not be created.",
        );
        result.failed += 1;
        continue;
      }

      const { data: notification, error: notificationReadError } = await admin
        .from("notifications")
        .select("id, profile_id, type, title, body, data")
        .eq("id", notificationId)
        .maybeSingle();
      if (notificationReadError || !notification) {
        await finalizeFailed(
          admin,
          delivery.delivery_id,
          notificationReadError?.message ??
            "Campaign notification could not be loaded.",
        );
        result.failed += 1;
        continue;
      }

      const summaries = await sendPushForNotifications([notification]);
      const summary = summaries.get(notification.id);
      if (summary?.sent) {
        await admin.rpc("bc_finalize_push_campaign_delivery", {
          p_delivery_id: delivery.delivery_id,
          p_status: "sent",
          p_last_error: null,
        });
        result.sent += 1;
      } else {
        await finalizeFailed(
          admin,
          delivery.delivery_id,
          summary?.attempted
            ? "All push delivery attempts failed."
            : "No usable push subscription was available for this recipient.",
        );
        result.failed += 1;
      }
    } catch (error) {
      await finalizeFailed(
        admin,
        delivery.delivery_id,
        error instanceof Error ? error.message : "Campaign delivery failed.",
      );
      result.failed += 1;
    }
  }

  return result;
}

async function finalizeFailed(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  deliveryId: string,
  message: string,
) {
  await admin.rpc("bc_finalize_push_campaign_delivery", {
    p_delivery_id: deliveryId,
    p_status: "failed",
    p_last_error: message.slice(0, 500),
  });
}
