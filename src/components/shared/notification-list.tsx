"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { markNotificationReadAction } from "@/app/actions/beauty-connect";
import type { Notification } from "@/lib/domain/beauty-connect";
import { formatDate } from "@/lib/utils";
import { Button, EmptyState } from "@/components/shared/ui";

export function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);
  async function mark(id: string) {
    await markNotificationReadAction(id);
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
      ),
    );
    window.dispatchEvent(new Event("beauty-connect:notifications-changed"));
  }

  async function open(notification: Notification) {
    if (!notification.read_at) await mark(notification.id);
    const url = getNotificationUrl(notification.data);
    if (url) router.push(url);
  }
  if (!items.length)
    return (
      <EmptyState
        title="You are all caught up."
        description="New application, request, and connection updates will appear here."
      />
    );
  return (
    <div className="grid gap-3">
      {items.map((notification) => (
        <article
          key={notification.id}
          className={
            notification.read_at
              ? "border border-border bg-background p-5"
              : "border border-foreground bg-background p-5"
          }
        >
          <div className="flex items-start justify-between gap-4">
            <button
              type="button"
              onClick={() => void open(notification)}
              className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2"
            >
              <p className="text-xs text-muted-foreground">
                {formatDate(notification.created_at)}
              </p>
              <h2 className="mt-2 font-semibold">{notification.title}</h2>
              {notification.body ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {notification.body}
                </p>
              ) : null}
              {getNotificationUrl(notification.data) ? (
                <span className="mt-3 inline-block text-xs font-semibold text-foreground underline underline-offset-4">
                  Open related activity
                </span>
              ) : null}
            </button>
            {notification.read_at ? null : (
              <span className="size-2 rounded-full bg-foreground" />
            )}
          </div>
          {notification.read_at ? null : (
            <Button
              type="button"
              variant="ghost"
              className="mt-3 px-0"
              onClick={() => mark(notification.id)}
            >
              Mark as read
            </Button>
          )}
        </article>
      ))}
    </div>
  );
}

function getNotificationUrl(data: Notification["data"]): string | null {
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

  return null;
}
