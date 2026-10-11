"use client";
import type { AppData } from "./types";
import { sb } from "./supabase";
import { mergeData } from "./merge";

type Status = { state: "local" | "syncing" | "synced" | "error"; email?: string; at?: string; error?: string };
let status: Status = { state: "local" };
const listeners = new Set<(s: Status) => void>();
const set = (s: Partial<Status>) => { status = { ...status, ...s }; listeners.forEach((f) => f(status)); };
export const onSyncStatus = (f: (s: Status) => void) => { listeners.add(f); f(status); return () => { listeners.delete(f); }; };

let timer: ReturnType<typeof setTimeout> | undefined; let latest: AppData | null = null;
export function queueSync(d: AppData) {
  latest = d; if (!sb()) return;
  clearTimeout(timer); timer = setTimeout(() => latest && push(latest), 1500);
}
async function push(d: AppData) {
  const c = sb(); if (!c) return;
  const { data: { session } } = await c.auth.getSession(); if (!session) return;
  set({ state: "syncing" });
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { error } = await c.from("app_state").upsert({ user_id: session.user.id, data: d, tz, updated_at: new Date().toISOString() });
  set(error ? { state: "error", error: error.message } : { state: "synced", at: new Date().toISOString(), error: undefined });
}
/** Pull the remote copy, merge it with the local copy, and push the result. Called on sign-in and when the app regains focus. */
export async function pullMerge(getLocal: () => AppData | null, replace: (d: AppData) => void, migrate: (d: Partial<AppData> | null) => AppData) {
  const c = sb(); if (!c) return;
  const { data: { session } } = await c.auth.getSession(); if (!session) { set({ state: "local", email: undefined }); return; }
  set({ state: "syncing", email: session.user.email ?? undefined });
  const { data, error } = await c.from("app_state").select("data").eq("user_id", session.user.id).maybeSingle();
  if (error) { set({ state: "error", error: error.message }); return; }
  const local = getLocal(); if (!local) return;
  const merged = data?.data ? mergeData(local, migrate(data.data as AppData)) : local;
  replace(merged); await push(merged);
}
export async function signInWithEmail(email: string) {
  const c = sb(); if (!c) throw new Error("Sync isn't set up yet");
  const redirect = window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/settings/";
  const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
  if (error) throw error;
}
export async function signOut() { await sb()?.auth.signOut(); set({ state: "local", email: undefined }); }
