import type { AppData } from "./types";
import { today, getLog } from "./store";
import { recipes } from "./recipes";
import { doseState } from "./meds";
export type NextItem = { key: string; at: string; kind: "water" | "med" | "supp" | "meal" | "move" | "wind" | "checkin"; title: string; sub: string; icon: string; tint: string };
const mealTimes = { breakfast: "08:00", lunch: "12:30", snack: "15:30", dinner: "18:00" } as const;
/** Build today's schedule-ordered actions; completed/skipped ones drop out. */
export function nextSteps(d: AppData, nowHM = new Date().toTimeString().slice(0, 5)): NextItem[] {
  const k = today(), done = new Set(d.nextDone[k] ?? []), skip = new Set(d.nextSkips[k] ?? []), log = getLog(d);
  const items: NextItem[] = [];
  const wt = d.profile.waterTargetOz ?? 64; const marks = ["07:30", "10:30", "13:30", "16:30", "19:30"];
  marks.forEach((t, i) => { const goal = Math.round((wt * (i + 1)) / marks.length); if (log.waterOz < goal) items.push({ key: `water-${t}`, at: t, kind: "water", title: "Drink a glass of water", sub: `${log.waterOz} of ${goal} oz by ${t}`, icon: "drop", tint: "linear-gradient(135deg,#8fb2c6,#5e93b0)" }); });
  for (const m of d.meds.filter((m) => m.active && !m.asNeeded)) for (const t of m.times) { const s = doseState(d, m, t); if (s === "taken" || s === "skipped") continue;
    items.push({ key: `med-${m.id}-${t}`, at: t, kind: "med", title: `Take ${m.name}`, sub: `${m.dose}${m.withFood ? " · with food" : ""}${s === "late" ? " · a little late, that's okay" : s === "missed" ? " · missed earlier. Follow your instructions" : ""}`, icon: "pill", tint: "linear-gradient(135deg,var(--plum),var(--blush))" }); }
  for (const s of d.supplements) for (const t of s.times) if (!d.suppLogs.some((l) => l.date === k && l.suppId === s.id && l.time === t))
    items.push({ key: `supp-${s.id}-${t}`, at: t, kind: "supp", title: `Take ${s.name}`, sub: `${s.dose}${s.withFood ? " · with food" : ""}`, icon: "leaf", tint: "linear-gradient(135deg,var(--sage),var(--moss))" });
  const plan = d.mealPlan[k] ?? {};
  (Object.keys(mealTimes) as (keyof typeof mealTimes)[]).forEach((slot) => { const r = recipes.find((x) => x.id === plan[slot]); if (r) items.push({ key: `meal-${slot}`, at: mealTimes[slot], kind: "meal", title: `${slot[0].toUpperCase() + slot.slice(1)}: ${r.title}`, sub: `~${r.protein}g protein · ${r.minutes} min`, icon: "nourish", tint: "linear-gradient(135deg,var(--clay),var(--terra))" }); });
  if (!d.workouts.some((w) => w.date === k)) items.push({ key: "move", at: d.reminders.find((r) => r.id === "move")?.time ?? "16:00", kind: "move", title: "Move a little", sub: "Even 5 minutes of gentle bouncing counts", icon: "move", tint: "linear-gradient(135deg,var(--honey),var(--clay))" });
  if (new Date().getDay() === 0 && !d.checkins.some((c) => c.weekOf === k)) items.push({ key: "checkin", at: "18:00", kind: "checkin", title: "Sunday check-in", sub: "2 minutes to look back and plan ahead", icon: "sparkle", tint: "linear-gradient(135deg,var(--plum),var(--clay))" });
  items.push({ key: "wind", at: d.reminders.find((r) => r.id === "wind")?.time ?? "21:00", kind: "wind", title: "Wind down", sub: "Screens low, a stretch, a few slow breaths", icon: "moon", tint: "linear-gradient(135deg,#2d3550,#55506b)" });
  return items.filter((i) => !done.has(i.key) && !skip.has(i.key))
    // overdue items first (by time), then upcoming; water checkpoints far in the future collapse to one
    .sort((a, b) => a.at.localeCompare(b.at))
    .filter((i, idx, arr) => i.kind !== "water" || arr.findIndex((x) => x.kind === "water") === idx || i.at <= nowHM);
}
