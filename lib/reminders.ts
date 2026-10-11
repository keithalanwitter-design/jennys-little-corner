// MVP: local scheduling while the app is open/installed. Web Push via Supabase Edge Function later (see README).
const KEY = "jlc-data-v1", FIRED = "jlc-fired";
export async function notify(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) reg.showNotification(title, { body, icon: "/icon-192.png" }); else new Notification(title, { body });
  return true;
}
export function startReminderLoop() {
  const tick = () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null"); if (!d) return;
      const now = new Date(), hm = now.toTimeString().slice(0, 5), day = now.toLocaleDateString("en-CA");
      const fired: Record<string, string> = JSON.parse(localStorage.getItem(FIRED) || "{}");
      for (const r of d.reminders ?? []) {
        if (r.enabled && r.time <= hm && fired[r.id] !== day && hm.slice(0, 2) === r.time.slice(0, 2)) {
          notify("Little Corner", r.label); fired[r.id] = day;
        }
      }
      localStorage.setItem(FIRED, JSON.stringify(fired));
    } catch {}
  };
  tick(); const i = setInterval(tick, 60_000); return () => clearInterval(i);
}
