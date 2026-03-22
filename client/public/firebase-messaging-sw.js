self.addEventListener("push", (event) => {
  const payload = event?.data?.json?.() || {};
  const notification = payload.notification || {};
  const title = notification.title || "Nova notificação";
  const options = {
    body: notification.body || "",
    data: payload.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const serviceId = event.notification?.data?.serviceId;
  const path = serviceId ? `/agenda?serviceId=${encodeURIComponent(serviceId)}` : "/agenda";
  event.waitUntil(self.clients.openWindow(path));
});
