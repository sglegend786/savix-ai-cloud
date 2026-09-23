// SchemeSathi Service Worker – handles browser push notifications

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};

  const title = data.title || "SchemeSathi – Nayi Yojana!";
  const options = {
    body: data.body || "Ek nayi sarkari yojana available hai.",
    icon: data.icon || "/favicon.svg",
    badge: data.badge || "/favicon.svg",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Dekhen" },
      { action: "close", title: "Band Karen" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
