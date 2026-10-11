"use client";
import { useCallback, useEffect, useState } from "react";
import { db } from "./db";
import { queueSync } from "./sync";
import { detectEvents, emitFlow } from "./bus";
import type { AppData, DailyLog } from "./types";
export const ymd = (d: Date) => d.toLocaleDateString("en-CA");
export const today = () => ymd(new Date());
export const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
export const uid = () => Math.random().toString(36).slice(2, 10);
export const defaults: AppData = {
  profile: { name: "", focus: [], likes: "", avoid: "", allergies: "", cookMinutes: 30, family: true, householdSize: 4, onboarded: false,
    safeguards: { kneeCare: false, balance: false, pregnant: false, fluidLimit: false }, theme: "system", trackMeasurements: false, celebrate: true },
  goals: [], logs: {}, supplements: [], suppLogs: [], pantry: [], grocery: [], workouts: [],
  favorites: [], mealPlan: {}, journal: [], wins: [], measurements: [], prep: { recipeIds: [], servings: {}, day: "Sunday" },
  routineLevels: {}, selfCareFavs: [], customSelfCare: [],
  meds: [], doseLogs: [], checkins: [], chat: [], nextSkips: {}, nextDone: {}, nextSnooze: {}, events: [],
  reminders: [
    { id: "water-am", label: "Morning water", time: "08:00", enabled: false },
    { id: "water-mid", label: "Midday water", time: "13:00", enabled: false },
    { id: "move", label: "A little bounce or stretch", time: "16:00", enabled: false },
    { id: "supps-am", label: "Morning supplements", time: "09:00", enabled: false },
    { id: "supps-pm", label: "Evening supplements", time: "20:00", enabled: false },
    { id: "prep", label: "Sunday prep session", time: "15:00", enabled: false, days: [0] },
    { id: "checkin", label: "Sunday weekly check-in", time: "18:00", enabled: false, days: [0] },
    { id: "wind", label: "Evening wind-down", time: "21:00", enabled: false },
    { id: "journal", label: "Three good things", time: "21:30", enabled: false },
  ],
};
const migrate = (d: Partial<AppData> | null): AppData => {
  const m = { ...defaults, ...(d ?? {}) } as AppData;
  m.profile = { ...defaults.profile, ...(d?.profile ?? {}), safeguards: { ...defaults.profile.safeguards, ...(d?.profile?.safeguards ?? {}) } };
  m.prep = { ...defaults.prep, ...(d?.prep ?? {}) };
  const ids = new Set(m.reminders.map((r) => r.id));
  m.reminders = [...m.reminders, ...defaults.reminders.filter((r) => !ids.has(r.id))];
  return m;
};
let cache: AppData | null = null;
export const migrateData = (d: Partial<AppData> | null) => migrate(d);
export function replaceData(d: AppData) { cache = migrate(d); db.save(cache); subs.forEach((f) => f(cache!)); }
export const peek = () => cache;
const subs = new Set<(d: AppData) => void>();
export function useData() {
  const [data, setData] = useState<AppData | null>(cache);
  useEffect(() => {
    subs.add(setData);
    if (!cache) db.load().then((d) => { cache = migrate(d); subs.forEach((f) => f(cache!)); });
    else setData(cache);
    return () => { subs.delete(setData); };
  }, []);
  const update = useCallback((fn: (d: AppData) => AppData) => {
    if (!cache) return; const prev = cache; const nx = fn(cache); const evs = detectEvents(prev, nx);
    cache = { ...nx, events: evs.length ? [...nx.events, ...evs].slice(-300) : nx.events, updatedAt: new Date().toISOString() }; db.save(cache); queueSync(cache); subs.forEach((f) => f(cache!)); evs.forEach(emitFlow);
  }, []);
  return { data, update };
}
export const getLog = (d: AppData, date = today()): DailyLog => d.logs[date] ?? { date, waterOz: 0, proteinG: 0 };
export const setLog = (d: AppData, patch: Partial<DailyLog>, date = today()): AppData =>
  ({ ...d, logs: { ...d.logs, [date]: { ...getLog(d, date), ...patch } } });
export const addWin = (d: AppData, text: string, kind = "custom"): AppData =>
  d.wins.some((w) => w.date === today() && w.text === text) ? d : { ...d, wins: [{ id: uid(), date: today(), text, kind }, ...d.wins] };
export const resetCache = () => { cache = null; };
export const weekMinutes = (d: AppData) => d.workouts.filter((w) => w.date >= daysAgo(6)).reduce((a, w) => a + w.minutes, 0);
