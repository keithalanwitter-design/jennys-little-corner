import type { AppData } from "./types";
import { daysAgo, ymd } from "./store";
import { adherence } from "./meds";
import { allowed } from "./suggest";
export type Tweak = { id: string; title: string; why: string; apply: (d: AppData) => AppData };
export function weekSummary(d: AppData) {
  const days = Array.from({ length: 7 }, (_, i) => daysAgo(i + 0));
  const logs = days.map((k) => d.logs[k]).filter(Boolean);
  const a = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0);
  const wt = d.profile.waterTargetOz, pt = d.profile.proteinTargetG;
  return {
    avgWater: a(logs.map((l) => l.waterOz)), waterDays: wt ? logs.filter((l) => l.waterOz >= wt).length : 0,
    avgProtein: a(logs.map((l) => l.proteinG)), proteinDays: pt ? logs.filter((l) => l.proteinG >= pt).length : 0,
    moveMin: d.workouts.filter((w) => days.includes(w.date)).reduce((s, w) => s + w.minutes, 0), sessions: d.workouts.filter((w) => days.includes(w.date)).length,
    avgSleep: Math.round(10 * (logs.filter((l) => l.sleepHours).reduce((s, l) => s + (l.sleepHours ?? 0), 0) / Math.max(1, logs.filter((l) => l.sleepHours).length))) / 10,
    avgEnergy: Math.round(10 * (logs.filter((l) => l.energyAm ?? l.energyPm).reduce((s, l) => s + (l.energyAm ?? l.energyPm ?? 0), 0) / Math.max(1, logs.filter((l) => l.energyAm ?? l.energyPm).length))) / 10,
    wins: d.wins.filter((w) => days.includes(w.date)).length, journal: d.journal.filter((j) => days.includes(j.date)).length, meds: adherence(d),
    loggedDays: logs.length,
  };
}
export type Summary = ReturnType<typeof weekSummary>;
export function wentWellIdeas(s: Summary, d: AppData) {
  const out: string[] = [];
  if (s.sessions) out.push(`Moved ${s.sessions} time${s.sessions > 1 ? "s" : ""} (${s.moveMin} min)`);
  if (s.waterDays) out.push(`Hit my water goal ${s.waterDays} day${s.waterDays > 1 ? "s" : ""}`);
  if (s.proteinDays) out.push(`Hit protein ${s.proteinDays} day${s.proteinDays > 1 ? "s" : ""}`);
  if (s.avgSleep >= 7) out.push(`Slept ~${s.avgSleep} hrs on average`);
  if (s.journal) out.push("Made time to journal");
  if (s.wins) out.push(`${s.wins} little wins`);
  if (Object.keys(d.mealPlan).some((k) => k >= daysAgo(6))) out.push("Planned some meals");
  return [...out, "Took time for me", "Asked for help"];
}
export const hardIdeas = ["Busy schedule", "Low energy", "Sleep", "Remembering water", "Planning meals", "Motivation", "Body comfort", "Nothing much!"];
const nextWeek = () => { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return ymd(x); }); };
const enable = (d: AppData, id: string, time?: string): AppData => ({ ...d, reminders: d.reminders.map((r) => (r.id === id ? { ...r, enabled: true, time: time ?? r.time } : r)) });
export function tweaks(s: Summary, d: AppData, hard: string[]): Tweak[] {
  const t: Tweak[] = []; const p = d.profile;
  if (hard.includes("Busy schedule") || hard.includes("Planning meals")) { const mp = allowed(d).filter((r) => r.tags.includes("meal-prep")); const picks = [mp.find((r) => r.style === "Breakfast"), mp.filter((r) => r.style !== "Breakfast").sort((a, b) => b.protein - a.protein)[0]].filter(Boolean) as typeof mp;
    t.push({ id: "prep", title: "One Sunday prep session", why: `Busy weeks get easier with two prepped staples: ${picks.map((r) => r.title).join(" and ")}. I'll add them to Prep and turn on a Sunday reminder.`, apply: (x) => enable({ ...x, prep: { ...x.prep, recipeIds: [...new Set([...x.prep.recipeIds, ...picks.map((r) => r.id)])] } }, "prep") }); }
  if (p.waterTargetOz && s.avgWater < p.waterTargetOz * 0.75) { const nt = Math.max(40, Math.round((s.avgWater + 12) / 8) * 8); t.push({ id: "water-gentle", title: `Water goal: ${nt} oz for now`, why: `You averaged ${s.avgWater} oz. A closer goal feels more doable, and two water reminders help.`, apply: (x) => enable(enable({ ...x, profile: { ...x.profile, waterTargetOz: nt } }, "water-am"), "water-mid") }); }
  else if (!p.waterTargetOz || hard.includes("Remembering water")) t.push({ id: "water-rem", title: "Water reminders morning & midday", why: "Tie a glass to habits you already have. I'll nudge you at 8 AM and 1 PM.", apply: (x) => enable(enable(x, "water-am"), "water-mid") });
  const mt = p.moveTargetMin ?? 150;
  if (s.moveMin < mt * 0.5) { const nt = Math.max(45, Math.round((s.moveMin + 30) / 15) * 15); t.push({ id: "move", title: `Aim for ${nt} min of movement next week`, why: `You moved ${s.moveMin} min. ${hard.includes("Low energy") ? "On low days, the 5-minute Calm Circulation bounce counts." : "Three short sessions get you there."}`, apply: (x) => enable({ ...x, profile: { ...x.profile, moveTargetMin: nt } }, "move") }); }
  else if (s.moveMin >= mt) t.push({ id: "level", title: "Try the next level in one routine", why: `You moved ${s.moveMin} min, wonderful! Move up a level in your favorite routine, only if it feels good.`, apply: (x) => { const id = Object.entries(x.workouts.reduce<Record<string, number>>((a, w) => (w.routineId ? { ...a, [w.routineId]: (a[w.routineId] ?? 0) + 1 } : a), {})).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "heartglow"; return { ...x, routineLevels: { ...x.routineLevels, [id]: Math.min(2, (x.routineLevels[id] ?? 0) + 1) } }; } });
  if (p.proteinTargetG && s.avgProtein < p.proteinTargetG * 0.85) t.push({ id: "protein", title: "Protein-forward breakfasts next week", why: `You averaged ${s.avgProtein}g. Starting the day with 25g+ makes the rest easier. I'll plan next week's breakfasts.`, apply: (x) => { const bf = allowed(x).filter((r) => r.style === "Breakfast" && r.protein >= 24); const mp = { ...x.mealPlan }; nextWeek().forEach((k, i) => { mp[k] = { ...mp[k], breakfast: bf[i % bf.length].id }; }); return { ...x, mealPlan: mp }; } });
  if ((s.avgSleep && s.avgSleep < 6.5) || hard.includes("Sleep")) { const w = d.reminders.find((r) => r.id === "wind")?.time ?? "21:00"; const [h, m] = w.split(":").map(Number); const e = `${String(h - (m < 30 ? 1 : 0)).padStart(2, "0")}:${String((m + 30) % 60).padStart(2, "0")}`; t.push({ id: "sleep", title: `Wind down 30 min earlier (${e})`, why: `${s.avgSleep ? `You averaged ${s.avgSleep} hrs. ` : ""}A gentle cue to start your routine can help.`, apply: (x) => enable(x, "wind", e) }); }
  t.push({ id: "keep", title: "Keep everything as is", why: "Steady is a great place to be. No changes needed.", apply: (x) => x });
  return t;
}
