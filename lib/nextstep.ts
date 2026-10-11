import type { AppData } from "./types";
import { today, getLog } from "./store";
import { recipes } from "./recipes";
import { doseState } from "./meds";
import { phaseAt, sundayPlan, type Phase } from "./flow";
export type NextItem = { key: string; at: string; kind: "water" | "med" | "supp" | "meal" | "move" | "wind" | "checkin"; title: string; sub: string; icon: string; tint: string; href?: string; tag?: string; back?: boolean; catchUp?: boolean };
const mealTimes = { breakfast: "08:00", lunch: "12:30", snack: "15:30", dinner: "18:00" } as const;
const hmAdd = (hm: string, mins: number) => { const [h, m] = hm.split(":").map(Number); const t = Math.min(23 * 60 + 59, h * 60 + m + mins); return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
export const snoozeUntil = (mins = 90) => hmAdd(new Date().toTimeString().slice(0, 5), mins);
const CATCHUP_AFTER = 150; // minutes past due before an item rolls into "catch up"
const minsOf = (hm: string) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };

function all(d: AppData): NextItem[] {
  const k = today(), log = getLog(d), items: NextItem[] = [];
  const plan = sundayPlan(d)?.applied ?? []; const tag = (ids: string[]) => (ids.some((x) => plan.includes(x)) ? "From your Sunday plan" : undefined);
  const wt = d.profile.waterTargetOz ?? 64; const marks = ["07:30", "10:30", "13:30", "16:30", "19:30"];
  marks.forEach((t, i) => { const goal = Math.round((wt * (i + 1)) / marks.length); if (log.waterOz < goal) items.push({ key: `water-${t}`, at: t, kind: "water", title: "Drink a glass of water", sub: `${log.waterOz} of ${goal} oz by ${t}`, icon: "drop", tint: "linear-gradient(135deg,#8fb2c6,#5e93b0)", tag: tag(["water-gentle", "water-rem"]) }); });
  for (const m of d.meds.filter((m) => m.active && !m.asNeeded)) for (const t of m.times) { const s = doseState(d, m, t); if (s === "taken" || s === "skipped") continue;
    items.push({ key: `med-${m.id}-${t}`, at: t, kind: "med", title: `Take ${m.name}`, sub: `${m.dose}${m.withFood ? " · with food" : ""}${s === "late" ? " · a little late, that's okay" : s === "missed" ? " · missed earlier. Follow your label" : ""}`, icon: "pill", tint: "linear-gradient(135deg,var(--plum),var(--blush))", href: "/meds" }); }
  for (const s of d.supplements) for (const t of s.times) if (!d.suppLogs.some((l) => l.date === k && l.suppId === s.id && l.time === t))
    items.push({ key: `supp-${s.id}-${t}`, at: t, kind: "supp", title: `Take ${s.name}`, sub: `${s.dose}${s.withFood ? " · with food" : ""}`, icon: "leaf", tint: "linear-gradient(135deg,var(--sage),var(--moss))", href: "/supplements" });
  const mp = d.mealPlan[k] ?? {};
  (Object.keys(mealTimes) as (keyof typeof mealTimes)[]).forEach((slot) => { const r = recipes.find((x) => x.id === mp[slot]); if (r) items.push({ key: `meal-${slot}`, at: mealTimes[slot], kind: "meal", title: `${slot[0].toUpperCase() + slot.slice(1)}: ${r.title}`, sub: `~${r.protein} g protein · ${r.minutes} min`, icon: "nourish", tint: "linear-gradient(135deg,var(--clay),var(--terra))", href: "/nourish#plan", tag: slot === "breakfast" ? tag(["protein"]) : undefined }); });
  if (!d.workouts.some((w) => w.date === k)) items.push({ key: "move", at: d.reminders.find((r) => r.id === "move")?.time ?? "16:00", kind: "move", title: "Move a little", sub: "Even 5 minutes of gentle bouncing counts", icon: "move", tint: "linear-gradient(135deg,var(--honey),var(--clay))", href: "/move", tag: tag(["move", "level"]) });
  if (new Date().getDay() === 0 && !d.checkins.some((c) => c.weekOf === k)) items.push({ key: "checkin", at: "18:00", kind: "checkin", title: "Sunday check-in", sub: "2 minutes to look back and plan ahead", icon: "sparkle", tint: "linear-gradient(135deg,var(--plum),var(--clay))", href: "/checkin" });
  items.push({ key: "wind", at: d.reminders.find((r) => r.id === "wind")?.time ?? "21:00", kind: "wind", title: "Wind down", sub: "Screens low, a stretch, a few slow breaths", icon: "moon", tint: "linear-gradient(135deg,#2d3550,#55506b)", href: "/unwind#sleep", tag: tag(["sleep"]) });
  return items;
}
/** Today's remaining actions, shaped by phase. Snoozed items come back kindly; long-overdue soft items move to "catch up". */
export function nextSteps(d: AppData, nowHM = new Date().toTimeString().slice(0, 5)): NextItem[] {
  return plan(d, nowHM).main;
}
export function plan(d: AppData, nowHM = new Date().toTimeString().slice(0, 5)) {
  const k = today(), done = new Set(d.nextDone[k] ?? []), skip = new Set(d.nextSkips[k] ?? []), snz = d.nextSnooze?.[k] ?? {};
  const ph: Phase = phaseAt(nowHM), now = minsOf(nowHM);
  const live = all(d).filter((i) => !done.has(i.key) && !skip.has(i.key) && !(snz[i.key] && snz[i.key] > nowHM)).map((i) => (snz[i.key] ? { ...i, back: true, sub: `Back again, no rush · ${i.sub}` } : i));
  // Water collapses to the latest due checkpoint (one glass at a time).
  const wSnz = Object.entries(snz).filter(([k, u]) => k.startsWith("water-") && u > nowHM).map(([k]) => k.slice(6)).sort().pop() ?? "";
  const waters = live.filter((i) => i.kind === "water" && i.at > wSnz); const dueWater = waters.filter((i) => i.at <= nowHM).pop() ?? waters[0];
  const items = live.filter((i) => i.kind !== "water" || i === dueWater);
  const catchUp = items.filter((i) => (i.kind === "meal" || i.kind === "supp") && now - minsOf(i.at) > CATCHUP_AFTER && !i.back).map((i) => ({ ...i, catchUp: true }));
  let main = items.filter((i) => !catchUp.some((c) => c.key === i.key)).sort((a, b) => a.at.localeCompare(b.at));
  // Wind-down keeps it quiet: only the wind-down itself and doses. Water and movement can wait for tomorrow.
  if (ph === "winddown") main = [...main.filter((i) => i.kind === "wind"), ...main.filter((i) => i.kind === "med" || i.kind === "supp")];
  return { main, catchUp, phase: ph };
}
