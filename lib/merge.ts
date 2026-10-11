import type { AppData } from "./types";
type Obj = Record<string, unknown>;
const byKey = <T,>(a: T[] = [], b: T[] = [], key: (x: T) => string, preferB: boolean) => {
  const m = new Map<string, T>();
  for (const x of preferB ? a : b) m.set(key(x), x);
  for (const x of preferB ? b : a) m.set(key(x), x);
  return [...m.values()];
};
/** Merge two copies of the data. Additive data is unioned, so nothing logged on either device is lost. Settings-like data takes the newer copy. */
export function mergeData(local: AppData, remote: AppData): AppData {
  const remoteNewer = (remote.updatedAt ?? "") > (local.updatedAt ?? "");
  const newer = remoteNewer ? remote : local;
  const id = (x: { id: string }) => x.id;
  const logs: AppData["logs"] = { ...remote.logs };
  for (const [d, l] of Object.entries(local.logs ?? {})) {
    const r = logs[d]; if (!r) { logs[d] = l; continue; }
    const base = (remoteNewer ? { ...l, ...r } : { ...r, ...l }) as Obj;
    base.waterOz = Math.max(l.waterOz ?? 0, r.waterOz ?? 0); base.proteinG = Math.max(l.proteinG ?? 0, r.proteinG ?? 0);
    logs[d] = base as unknown as AppData["logs"][string];
  }
  const mealPlan = { ...(remoteNewer ? local.mealPlan : remote.mealPlan), ...(remoteNewer ? remote.mealPlan : local.mealPlan) };
  const uni = (a: string[] = [], b: string[] = []) => [...new Set([...a, ...b])];
  const dictUni = (a: Record<string, string[]> = {}, b: Record<string, string[]> = {}) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = uni(o[k], v); return o; };
  return {
    ...newer,
    logs, mealPlan,
    goals: byKey(local.goals, remote.goals, id, remoteNewer),
    supplements: byKey(local.supplements, remote.supplements, id, remoteNewer),
    meds: byKey(local.meds, remote.meds, id, remoteNewer),
    suppLogs: byKey(local.suppLogs, remote.suppLogs, (x) => `${x.date}|${x.suppId}|${x.time}`, remoteNewer),
    doseLogs: byKey(local.doseLogs, remote.doseLogs, (x) => `${x.date}|${x.medId}|${x.time}`, remoteNewer),
    workouts: byKey(local.workouts, remote.workouts, (x) => `${x.date}|${x.mode}|${x.minutes}|${x.routineId ?? ""}`, remoteNewer),
    journal: byKey(local.journal, remote.journal, id, remoteNewer).sort((a, b) => b.date.localeCompare(a.date)),
    wins: byKey(local.wins, remote.wins, id, remoteNewer).sort((a, b) => b.date.localeCompare(a.date)),
    measurements: byKey(local.measurements, remote.measurements, (x) => x.date, remoteNewer),
    grocery: byKey(local.grocery, remote.grocery, id, remoteNewer),
    checkins: byKey(local.checkins, remote.checkins, id, remoteNewer),
    chat: byKey(local.chat, remote.chat, id, remoteNewer).sort((a, b) => a.at.localeCompare(b.at)).slice(-60),
    reminders: byKey(local.reminders, remote.reminders, id, remoteNewer),
    favorites: uni(local.favorites, remote.favorites), pantry: uni(local.pantry, remote.pantry),
    selfCareFavs: uni(local.selfCareFavs, remote.selfCareFavs), customSelfCare: uni(local.customSelfCare, remote.customSelfCare),
    nextDone: dictUni(local.nextDone, remote.nextDone), nextSkips: dictUni(local.nextSkips, remote.nextSkips),
    nextSnooze: { ...(remoteNewer ? local.nextSnooze : remote.nextSnooze), ...(remoteNewer ? remote.nextSnooze : local.nextSnooze) },
    events: byKey(local.events, remote.events, id, remoteNewer).sort((a, b) => a.at.localeCompare(b.at)).slice(-300),
    tourDone: local.tourDone || remote.tourDone,
    updatedAt: new Date().toISOString(),
  };
}
