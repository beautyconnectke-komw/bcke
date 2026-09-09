"use client";

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
  const [items, setItems] = useState(notifications);
  async function mark(id: string) {
    await markNotificationReadAction(id);
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
      ),
    );
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
            <div>
              <p className="text-xs text-muted-foreground">
                {formatDate(notification.created_at)}
              </p>
              <h2 className="mt-2 font-semibold">{notification.title}</h2>
            </div>
            {notification.read_at ? null : (
              <span className="size-2 rounded-full bg-foreground" />
            )}
          </div>
          {notification.body ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {notification.body}
            </p>
          ) : null}
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
