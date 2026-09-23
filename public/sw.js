function getInternalUrl(value) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : "/";
}

async function markNotificationRead(notificationId) {
  if (typeof notificationId !== "string" || !notificationId) return;

  try {
    await fetch(
      `/api/notifications/${encodeURIComponent(notificationId)}/read`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch {
    // Navigation must still work if the read request is offline.
  }
}

async function focusOrOpen(targetUrl) {
  const clientList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of clientList) {
    if ("navigate" in client && "focus" in client) {
      return client.navigate(targetUrl).then(() => client.focus());
    }
  }

  return self.clients.openWindow(targetUrl);
}

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "Beauty Connect";
  const options = {
    body: payload.body || "You have a new Beauty Connect update.",
    icon: "/logo/logo.png",
    badge: "/logo/logo.png",
    tag: payload.tag || "beauty-connect-notification",
    data: {
      url: getInternalUrl(payload.url),
      notificationId: payload.notificationId,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = getInternalUrl(event.notification.data?.url);
  const notificationId = event.notification.data?.notificationId;

  event.waitUntil(
    Promise.all([
      markNotificationRead(notificationId),
      focusOrOpen(targetUrl),
    ]),
  );
});
