const C = "jlc-v4", SCOPE = self.registration.scope;
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(C).then((c) => c.addAll([SCOPE]))); });
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
// Server payload: { title, body, tag, data: { kind, doseKey?, actionUrl?, token?, url? } }
self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : { title: "Little Corner", body: "A gentle nudge 💛" };
  const isDose = d.data && (d.data.kind === "med" || d.data.kind === "supp");
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, tag: d.tag, icon: SCOPE + "icon-192.png", badge: SCOPE + "icon-192.png", data: d.data || {},
    actions: isDose ? [{ action: "taken", title: "Taken ✓" }, { action: "snooze", title: "Snooze 15 min" }] : [{ action: "snooze", title: "Snooze 15 min" }],
  }));
});
self.addEventListener("notificationclick", (e) => {
  const n = e.notification, data = n.data || {}; n.close();
  if ((e.action === "taken" || e.action === "snooze") && data.actionUrl) {
    e.waitUntil(fetch(data.actionUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: e.action, token: data.token }) })
      .then(() => self.clients.matchAll({ includeUncontrolled: true })).then((cs) => cs.forEach((c) => c.postMessage({ type: "dose-logged" }))).catch(() => {}));
    return;
  }
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => { const url = SCOPE + (data.url || ""); const c = cs.find((x) => x.url.startsWith(SCOPE)); return c ? c.focus().then((w) => w.navigate(url)) : self.clients.openWindow(url); }));
});
