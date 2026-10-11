"use client";
import { sb, VAPID_PUBLIC } from "./supabase";
const b64 = (s: string) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && !!VAPID_PUBLIC;
export async function enablePush() {
  const c = sb(); if (!c || !pushSupported()) throw new Error("Push isn't available here");
  const { data: { session } } = await c.auth.getSession(); if (!session) throw new Error("Sign in first so reminders can reach you");
  if ((await Notification.requestPermission()) !== "granted") throw new Error("Notifications were not allowed");
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID_PUBLIC) }));
  const j = sub.toJSON();
  const { error } = await c.from("push_subscriptions").upsert({ user_id: session.user.id, endpoint: j.endpoint, keys: j.keys, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, user_agent: navigator.userAgent.slice(0, 200) }, { onConflict: "endpoint" });
  if (error) throw error;
  return true;
}
export async function pushStatus() { if (!pushSupported()) return false; const reg = await navigator.serviceWorker.getRegistration(); return !!(await reg?.pushManager.getSubscription()); }
export async function disablePush() { const reg = await navigator.serviceWorker.getRegistration(); const sub = await reg?.pushManager.getSubscription(); if (sub) { await sb()?.from("push_subscriptions").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe(); } }
