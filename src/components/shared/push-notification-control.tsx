"use client";

import { useEffect, useState } from "react";
import {
  registerPushSubscriptionAction,
  removePushSubscriptionAction,
} from "@/app/actions/beauty-connect";
import { env } from "@/config/env";
import { Button } from "@/components/shared/ui";

function decodeVapidKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

function getSubscriptionInput(subscription: PushSubscription) {
  const json = subscription.toJSON();

  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error("The browser returned an incomplete push subscription.");
  }

  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  };
}

export function PushNotificationControl() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function detectSubscription() {
      const canUsePush =
        typeof window !== "undefined" &&
        window.isSecureContext &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!canUsePush) {
        if (active) setSupported(false);
        return;
      }

      const currentPermission = Notification.permission;
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();

      if (currentPermission === "denied") {
        if (subscription) {
          await subscription.unsubscribe().catch(() => false);
          await removePushSubscriptionAction(subscription.endpoint).catch(
            () => undefined,
          );
        }

        if (active) {
          setSupported(true);
          setPermission(currentPermission);
          setEnabled(false);
          setMessage(
            "Browser notifications are blocked. Allow them in browser settings to re-enable push.",
          );
        }
        return;
      }

      if (subscription && currentPermission === "granted") {
        await registerPushSubscriptionAction(
          getSubscriptionInput(subscription),
        );
      }

      if (active) {
        setSupported(true);
        setPermission(currentPermission);
        setEnabled(Boolean(subscription) && currentPermission === "granted");
        setMessage(null);
      }
    }

    void detectSubscription().catch(() => {
      if (active) {
        setSupported(true);
        setMessage(
          "Push status could not be refreshed. Try enabling push again.",
        );
      }
    });

    const refreshOnReturn = () => {
      if (!document.hidden) void detectSubscription().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", refreshOnReturn);
    window.addEventListener("focus", refreshOnReturn);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", refreshOnReturn);
      window.removeEventListener("focus", refreshOnReturn);
    };
  }, []);

  async function enablePush() {
    setBusy(true);
    setMessage(null);

    try {
      if (!env.push.publicKey) {
        throw new Error(
          "Push notifications are not configured for this app yet.",
        );
      }

      if (Notification.permission === "denied") {
        throw new Error(
          "Browser notification permission is blocked. Allow it in browser settings first.",
        );
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Browser notification permission was not granted.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(env.push.publicKey),
        }));

      await registerPushSubscriptionAction(getSubscriptionInput(subscription));
      setEnabled(true);
      setSupported(true);
      setPermission("granted");
      setMessage("Push notifications are enabled on this device.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Push notifications could not be enabled.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    setMessage(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await removePushSubscriptionAction(endpoint);
      }
      setEnabled(false);
      setPermission(Notification.permission);
      setMessage("Push notifications are disabled on this device.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Push notifications could not be disabled.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (supported === false) {
    return (
      <p className="text-xs text-muted-foreground">
        Browser push notifications are not available in this browser or context.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant={enabled ? "secondary" : "primary"}
        disabled={busy || supported === null || permission === "denied"}
        onClick={() => void (enabled ? disablePush() : enablePush())}
        className="min-h-10 text-xs"
      >
        {busy ? "Updating…" : enabled ? "Disable push" : "Enable push"}
      </Button>
      {message ? (
        <p className="w-full text-right text-xs text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
