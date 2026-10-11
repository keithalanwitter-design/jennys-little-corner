"use client";
import { useCallback, useEffect, useState } from "react";
import { db } from "./db";
import type { AppData, DailyLog } from "./types";
export const today = () => new Date().toLocaleDateString("en-CA");
export const uid = () => Math.random().toString(36).slice(2, 10);
export const defaults: AppData = {
  profile: { name: "", focus: [], likes: "", avoid: "", allergies: "", cookMinutes: 30, family: true, onboarded: false,
    safeguards: { kneeCare: false, balance: false, pregnant: false, fluidLimit: false } },
  goals: [], logs: {}, supplements: [], suppLogs: [], pantry: [], grocery: [], workouts: [],
  reminders: [
    { id: "water-am", label: "Morning water 💧", time: "08:00", enabled: false },
    { id: "water-mid", label: "Midday water 💧", time: "13:00", enabled: false },
    { id: "move", label: "A little bounce or stretch 🌀", time: "16:00", enabled: false },
    { id: "supps", label: "Supplements 🌿", time: "09:00", enabled: false },
    { id: "wind", label: "Evening wind-down 🌙", time: "21:00", enabled: false },
  ],
};
let cache: AppData | null = null;
const subs = new Set<(d: AppData) => void>();
export function useData() {
  const [data, setData] = useState<AppData | null>(cache);
  useEffect(() => {
    subs.add(setData);
    if (!cache) db.load().then((d) => { cache = { ...defaults, ...(d ?? {}) }; subs.forEach((f) => f(cache!)); });
    return () => { subs.delete(setData); };
  }, []);
  const update = useCallback((fn: (d: AppData) => AppData) => {
    if (!cache) return; cache = fn(cache); db.save(cache); subs.forEach((f) => f(cache!));
  }, []);
  return { data, update };
}
export const getLog = (d: AppData, date = today()): DailyLog => d.logs[date] ?? { date, waterOz: 0, proteinG: 0 };
export const setLog = (d: AppData, patch: Partial<DailyLog>, date = today()): AppData =>
  ({ ...d, logs: { ...d.logs, [date]: { ...getLog(d, date), ...patch } } });
export const resetCache = () => { cache = null; };
