const C = "jlc-v3", SCOPE = self.registration.scope;
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(C).then((c) => c.addAll([SCOPE]))); });
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
self.addEventListener("push", (e) => { const d = e.data ? e.data.json() : { title: "Little Corner", body: "A gentle nudge 💛" }; e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: SCOPE + "icon-192.png" })); });
self.addEventListener("notificationclick", (e) => { e.notification.close(); e.waitUntil(self.clients.openWindow(SCOPE)); });
