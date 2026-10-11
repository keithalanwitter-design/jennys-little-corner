"use client";
import { useEffect } from "react";
import { sb } from "@/lib/supabase";
import { pullMerge } from "@/lib/sync";
import { peek, replaceData, migrateData, useData } from "@/lib/store";
export default function SyncBoot() {
  const { data } = useData();
  const ready = !!data;
  useEffect(() => {
    const c = sb(); if (!c || !ready) return;
    const run = () => pullMerge(peek, replaceData, migrateData);
    run();
    const { data: sub } = c.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN") run(); });
    const vis = () => document.visibilityState === "visible" && run();
    document.addEventListener("visibilitychange", vis);
    navigator.serviceWorker?.addEventListener("message", (ev) => { if (ev.data?.type === "dose-logged") run(); });
    return () => { sub.subscription.unsubscribe(); document.removeEventListener("visibilitychange", vis); };
  }, [ready]);
  return null;
}
