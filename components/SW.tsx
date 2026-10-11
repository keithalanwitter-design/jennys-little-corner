"use client";
import { useEffect } from "react";
import { startReminderLoop } from "@/lib/reminders";
export default function SW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return startReminderLoop();
  }, []);
  return null;
}
