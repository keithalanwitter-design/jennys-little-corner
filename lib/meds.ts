import type { AppData, Med } from "./types";
import { today, uid } from "./store";
export type DoseState = "upcoming" | "due" | "late" | "missed" | "taken" | "skipped";
const mins = (hm: string) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
export const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
/** Gentle windows: due within ±60 min, late up to 3 h, then "missed" (never a red alarm). */
export function doseState(d: AppData, med: Med, time: string, date = today(), now = nowMin()): DoseState {
  const log = d.doseLogs.find((l) => l.date === date && l.medId === med.id && l.time === time);
  if (log) return log.status;
  if (date < today()) return "missed";
  const diff = now - mins(time);
  return diff < -60 ? "upcoming" : diff <= 60 ? "due" : diff <= 180 ? "late" : "missed";
}
export function logDose(d: AppData, medId: string, time: string, status: "taken" | "skipped", date = today()): AppData {
  const rest = d.doseLogs.filter((l) => !(l.date === date && l.medId === medId && l.time === time));
  const prev = d.doseLogs.find((l) => l.date === date && l.medId === medId && l.time === time);
  const meds = d.meds.map((m) => {
    if (m.id !== medId || m.stock == null) return m;
    const per = m.perDose ?? 1; let s = m.stock;
    if (prev?.status === "taken") s += per; if (status === "taken") s -= per;
    return { ...m, stock: Math.max(0, s) };
  });
  return { ...d, meds, doseLogs: [...rest, { id: uid(), date, medId, time, status, at: new Date().toISOString(), source: "app" }] };
}
export function undoDose(d: AppData, medId: string, time: string, date = today()): AppData {
  const prev = d.doseLogs.find((l) => l.date === date && l.medId === medId && l.time === time);
  return { ...d, doseLogs: d.doseLogs.filter((l) => l !== prev), meds: d.meds.map((m) => m.id === medId && m.stock != null && prev?.status === "taken" ? { ...m, stock: m.stock + (m.perDose ?? 1) } : m) };
}
export const daysLeft = (m: { stock?: number; perDose?: number; times: string[] }) => m.stock == null ? null : Math.floor(m.stock / Math.max(1, (m.perDose ?? 1) * Math.max(1, m.times.length)));
export const adherence = (d: AppData, days = 7) => {
  let due = 0, taken = 0;
  for (let i = 1; i <= days; i++) { const x = new Date(); x.setDate(x.getDate() - i); const k = x.toLocaleDateString("en-CA");
    for (const m of d.meds.filter((m) => m.active && !m.asNeeded)) for (const t of m.times) { due++; if (d.doseLogs.some((l) => l.date === k && l.medId === m.id && l.time === t && l.status === "taken")) taken++; } }
  return due ? taken / due : null;
};
