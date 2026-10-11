"use client";
import { useEffect } from "react";
import { BASE } from "@/lib/base";
import { startReminderLoop } from "@/lib/reminders";
export default function SW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).catch(() => {});
    return startReminderLoop();
  }, []);
  return null;
}
