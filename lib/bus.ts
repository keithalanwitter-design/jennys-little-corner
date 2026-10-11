// Flow event bus: the store diffs every update into semantic events. Toasts, Next Step, Coach and wins all react to the same stream.
import type { AppData, FlowEvent } from "./types";
import { routines } from "./content";
type L = (e: FlowEvent) => void;
const ls = new Set<L>();
export const onFlow = (f: L) => { ls.add(f); return () => { ls.delete(f); }; };
export const emitFlow = (e: FlowEvent) => ls.forEach((f) => f(e));
const day = () => new Date().toLocaleDateString("en-CA");
const id = () => Math.random().toString(36).slice(2, 10);
const COOL = /stretch|mobility|melt|hip|flow|cool|toes/i;
export function detectEvents(a: AppData, b: AppData): FlowEvent[] {
  const k = day(), at = new Date().toISOString(), out: FlowEvent[] = [];
  const ev = (type: FlowEvent["type"], extra: Partial<FlowEvent> = {}) => out.push({ id: id(), date: k, at, type, ...extra });
  const la = a.logs[k], lb = b.logs[k];
  if ((lb?.waterOz ?? 0) > (la?.waterOz ?? 0)) ev("water", { value: lb!.waterOz - (la?.waterOz ?? 0) });
  const mealAdded = b.wins.length > a.wins.length && b.wins[0]?.kind === "meal";
  if ((lb?.proteinG ?? 0) > (la?.proteinG ?? 0)) ev(mealAdded ? "meal" : "protein", { value: lb!.proteinG - (la?.proteinG ?? 0), label: mealAdded ? b.wins[0].text.replace(/^Ate /, "") : undefined });
  if (lb?.mood && lb.mood !== la?.mood) ev("mood", { label: lb.mood });
  if ((lb?.stress ?? 0) >= 4 && (la?.stress ?? 0) < 4) ev("mood", { label: "stressed" });
  if (lb?.sleepHours && lb.sleepHours !== la?.sleepHours) ev("sleep", { value: lb.sleepHours });
  if (b.workouts.length > a.workouts.length) { const w = b.workouts[b.workouts.length - 1]; const bounce = routines.some((r) => r.id === w.routineId) || /bounce/i.test(w.mode); ev(!bounce && COOL.test(w.mode) ? "cooldown" : "move", { value: w.minutes, label: w.mode }); }
  const newDoses = b.doseLogs.filter((x) => x.status === "taken" && !a.doseLogs.some((y) => y.date === x.date && y.medId === x.medId && y.time === x.time && y.status === "taken"));
  if (newDoses.length) ev("dose", { label: b.meds.find((m) => m.id === newDoses[0].medId)?.name, ref: newDoses[0].time });
  if (b.suppLogs.length > a.suppLogs.length) ev("supp", { label: b.supplements.find((s) => s.id === b.suppLogs[b.suppLogs.length - 1].suppId)?.name });
  if (b.journal.length > a.journal.length) ev("journal");
  if (b.checkins.length > a.checkins.length) ev("checkin", { label: b.checkins[b.checkins.length - 1].tweak });
  if ((b.nextDone[k] ?? []).includes("wind") && !(a.nextDone[k] ?? []).includes("wind")) ev("wind");
  const newWins = b.wins.filter((w) => w.date === k && !a.wins.some((x) => x.id === w.id));
  if (newWins.length && !out.length) ev("win", { label: newWins[0].text });
  return out;
}
