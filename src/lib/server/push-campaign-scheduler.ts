import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushForNotifications } from "@/lib/server/notification-push";
import type { Database } from "@/types/database";

type ClaimedDelivery =
  Database["public"]["Functions"]["bc_claim_push_campaign_deliveries"]["Returns"][number];

export class PushCampaignSchedulerError extends Error {
  constructor(
    public readonly operation: string,
    message: string,
    public readonly deliveryId?: string,
  ) {
    super(message);
    this.name = "PushCampaignSchedulerError";
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Unknown scheduler error.";
}

function schedulerError(
  operation: string,
  error: unknown,
  deliveryId?: string,
) {
  return new PushCampaignSchedulerError(
    operation,
    getErrorMessage(error),
    deliveryId,
  );
}

function logDeliveryError(
  operation: string,
  deliveryId: string,
  error: unknown,
) {
  console.error("[push-campaigns] delivery operation failed", {
    operation,
    deliveryId,
    error: getErrorMessage(error),
  });
}

export type PushCampaignSchedulerResult = {
  claimed: number;
  sent: number;
  failed: number;
};

export async function processDuePushCampaignDeliveries(
  limit = 50,
): Promise<PushCampaignSchedulerResult> {
  let admin: NonNullable<ReturnType<typeof createAdminClient>>;
  try {
    const client = createAdminClient();
    if (!client) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
    }
    admin = client;
  } catch (error) {
    throw schedulerError("create_admin_client", error);
  }

  let claimed: ClaimedDelivery[] | null = null;
  try {
    const claimResult = await admin.rpc("bc_claim_push_campaign_deliveries", {
      p_limit: limit,
    });
    if (claimResult.error) throw claimResult.error;
    claimed = claimResult.data as ClaimedDelivery[] | null;
  } catch (error) {
    throw schedulerError("bc_claim_push_campaign_deliveries", error);
  }

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
        logDeliveryError(
          "bc_create_push_campaign_notification",
          delivery.delivery_id,
          notificationError ?? new Error("No notification ID was returned."),
        );
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
        logDeliveryError(
          "load_campaign_notification",
          delivery.delivery_id,
          notificationReadError ?? new Error("Notification row was not found."),
        );
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
        logDeliveryError(
          "send_push_for_notifications",
          delivery.delivery_id,
          new Error(
            summary?.attempted
              ? "All push delivery attempts failed."
              : "No usable push subscription was available for this recipient.",
          ),
        );
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
      logDeliveryError("campaign_delivery", delivery.delivery_id, error);
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
  const { error } = await admin.rpc("bc_finalize_push_campaign_delivery", {
    p_delivery_id: deliveryId,
    p_status: "failed",
    p_last_error: message.slice(0, 500),
  });
  if (error) {
    logDeliveryError("bc_finalize_push_campaign_delivery", deliveryId, error);
  }
}
