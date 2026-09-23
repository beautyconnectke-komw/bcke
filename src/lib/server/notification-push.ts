import "server-only";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type NotificationType = Database["public"]["Enums"]["notification_type"];

type NotificationRecord = Pick<
  Database["public"]["Tables"]["notifications"]["Row"],
  "id" | "profile_id" | "type" | "title" | "body" | "data"
>;

type PushSubscriptionRecord =
  Database["public"]["Tables"]["notification_push_subscriptions"]["Row"];

type PushPayload = {
  title: string;
  body?: string;
  url: string;
  notificationId: string;
  tag: string;
};

export type PushDeliverySummary = {
  attempted: number;
  sent: number;
  failed: number;
};

function getPushConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

function getNotificationUrl(data: Json): string {
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    typeof data.url === "string" &&
    data.url.startsWith("/") &&
    !data.url.startsWith("//")
  ) {
    return data.url;
  }

  return "/";
}

function getPushErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return typeof statusCode === "number" ? statusCode : null;
}

export async function sendPushForNotifications(
  notifications: NotificationRecord[],
): Promise<Map<string, PushDeliverySummary>> {
  const summaries = new Map<string, PushDeliverySummary>(
    notifications.map((notification) => [
      notification.id,
      { attempted: 0, sent: 0, failed: 0 },
    ]),
  );
  const config = getPushConfig();
  const admin = createAdminClient();
  if (!config || !admin || notifications.length === 0) return summaries;

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

  const profileIds = [...new Set(notifications.map((item) => item.profile_id))];
  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("notification_push_subscriptions")
    .select(
      "id, profile_id, endpoint, p256dh, auth, user_agent, last_seen_at, created_at, updated_at",
    )
    .in("profile_id", profileIds);

  if (subscriptionsError || !subscriptions?.length) return summaries;

  const subscriptionsByProfile = new Map<string, PushSubscriptionRecord[]>();
  for (const subscription of subscriptions) {
    const current = subscriptionsByProfile.get(subscription.profile_id) ?? [];
    current.push(subscription);
    subscriptionsByProfile.set(subscription.profile_id, current);
  }

  for (const notification of notifications) {
    const profileSubscriptions = subscriptionsByProfile.get(
      notification.profile_id,
    );
    if (!profileSubscriptions?.length) continue;

    const payload: PushPayload = {
      title: notification.title,
      body: notification.body ?? undefined,
      url: getNotificationUrl(notification.data),
      notificationId: notification.id,
      tag: `beauty-connect-${notification.id}`,
    };

    for (const subscription of profileSubscriptions) {
      const { data: deliveryId, error: claimError } = await admin.rpc(
        "bc_claim_notification_push_delivery",
        {
          p_notification_id: notification.id,
          p_subscription_id: subscription.id,
        },
      );

      if (claimError || !deliveryId) continue;

      const summary = summaries.get(notification.id);
      if (summary) summary.attempted += 1;

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 },
        );

        await admin
          .from("notification_deliveries")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", deliveryId);
        if (summary) summary.sent += 1;
      } catch (error) {
        const statusCode = getPushErrorStatus(error);

        if (statusCode === 404 || statusCode === 410) {
          await admin
            .from("notification_push_subscriptions")
            .delete()
            .eq("id", subscription.id);
          if (summary) summary.failed += 1;
          continue;
        }

        await admin
          .from("notification_deliveries")
          .update({
            status: "failed",
            last_error:
              error instanceof Error
                ? error.message.slice(0, 500)
                : "Push delivery failed.",
          })
          .eq("id", deliveryId);
        if (summary) summary.failed += 1;
      }
    }
  }

  return summaries;
}

async function getNotificationsByRequest(
  requestId: string,
  types: NotificationType[],
) {
  const admin = createAdminClient();
  if (!admin || types.length === 0) return;

  const { data, error } = await admin
    .from("notifications")
    .select("id, profile_id, type, title, body, data")
    .contains("data", { request_id: requestId })
    .in("type", types);

  if (error || !data?.length) return;
  await sendPushForNotifications(data);
}

export async function deliverPushForRequestEvent(
  requestId: string,
  types: NotificationType[],
) {
  try {
    await getNotificationsByRequest(requestId, types);
  } catch {
    // Push is a delivery channel. A provider outage must not fail the state
    // transition or hide the in-app notification that was already recorded.
  }
}

export async function deliverPushForProfileViewActivity(
  workerProfileId: string,
) {
  try {
    const admin = createAdminClient();
    if (!admin) return;

    const { data, error } = await admin
      .from("notifications")
      .select("id, profile_id, type, title, body, data")
      .eq("type", "profile_views_aggregated")
      .contains("data", { worker_profile_id: workerProfileId })
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data?.length) return;
    await sendPushForNotifications(data);
  } catch {
    // See deliverPushForRequestEvent: in-app delivery remains authoritative.
  }
}

export async function deliverPushForWorkerApplicationEvent(
  workerProfileId: string,
  types: NotificationType[],
) {
  try {
    const admin = createAdminClient();
    if (!admin || types.length === 0) return;

    const { data, error } = await admin
      .from("notifications")
      .select("id, profile_id, type, title, body, data")
      .contains("data", { worker_profile_id: workerProfileId })
      .in("type", types)
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data?.length) return;
    await sendPushForNotifications(data);
  } catch {
    // In-app delivery remains authoritative when an admin action's push fails.
  }
}

export async function deliverPushForWorkerProfileUpdateEvent(
  updateId: string,
  types: NotificationType[],
) {
  try {
    const admin = createAdminClient();
    if (!admin || types.length === 0) return;

    const { data, error } = await admin
      .from("notifications")
      .select("id, profile_id, type, title, body, data")
      .contains("data", { worker_profile_update_id: updateId })
      .in("type", types)
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data?.length) return;
    await sendPushForNotifications(data);
  } catch {
    // In-app delivery remains authoritative when an admin action's push fails.
  }
}
