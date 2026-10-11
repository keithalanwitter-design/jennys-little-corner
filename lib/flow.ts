// Flow engine: daily rhythm and follow-ups. One source of truth for Today, Next Step, toasts, Coach and push copy.
import type { AppData, FlowEvent } from "./types";
import { getLog, today, ymd } from "./store";
import { recipes } from "./recipes";
import { nextSteps } from "./nextstep";

export type Phase = "morning" | "midday" | "evening" | "winddown";
export const phaseAt = (hm: string): Phase => (hm >= "05:00" && hm < "11:00" ? "morning" : hm >= "11:00" && hm < "16:00" ? "midday" : hm >= "16:00" && hm < "20:30" ? "evening" : "winddown");
export const phaseNow = () => phaseAt(new Date().toTimeString().slice(0, 5));
export const scenePhase = { morning: "morning", midday: "afternoon", evening: "evening", winddown: "night" } as const;
export const PHASES: Record<Phase, { label: string; greet: string; sub: string; icon: string }> = {
  morning: { label: "Morning", greet: "Good morning", sub: "Ease in. Water, meds and a real breakfast set the tone.", icon: "sun" },
  midday: { label: "Midday", greet: "Good afternoon", sub: "A sip, a protein-y lunch and a little movement keep you steady.", icon: "today" },
  evening: { label: "Evening", greet: "Good evening", sub: "Dinner, a gentle stretch and some time that's just yours.", icon: "nourish" },
  winddown: { label: "Wind-down", greet: "Hello, night owl", sub: "Lights low. Whatever's left can wait until tomorrow.", icon: "moon" },
};
export const SLOT_BY_PHASE: Record<Phase, "breakfast" | "lunch" | "dinner" | "snack"> = { morning: "breakfast", midday: "lunch", evening: "dinner", winddown: "snack" };

export type NextAction = { label: string; href?: string; act?: "water16" | "protein20" | "wind"; step?: string };
export type Toast = { id: string; title: string; body?: string; next?: NextAction; react: "cheer" | "calm" | "proud"; confetti?: boolean };

const recent = (d: AppData, type: FlowEvent["type"], mins: number) => d.events.some((e) => e.type === type && Date.now() - +new Date(e.at) < mins * 60e3);
export const nextMeal = (d: AppData) => {
  const order = ["breakfast", "lunch", "snack", "dinner"] as const; const plan = d.mealPlan[today()] ?? {};
  const startAt = order.indexOf(SLOT_BY_PHASE[phaseNow()] as (typeof order)[number]);
  for (const s of order.slice(Math.max(0, startAt))) { const r = recipes.find((x) => x.id === plan[s]); if (r && !(d.nextDone[today()] ?? []).includes(`meal-${s}`)) return { slot: s, r }; }
  return null;
};
const proteinLeft = (d: AppData) => Math.max(0, (d.profile.proteinTargetG ?? 100) - getLog(d).proteinG);
const stepNext = (d: AppData): NextAction | undefined => { const n = nextSteps(d)[0]; if (!n) return undefined; return n.kind === "water" ? { label: "Drink 16 oz", step: n.key } : n.kind === "checkin" ? { label: n.title, href: n.href } : { label: n.title, step: n.key }; };

/** The heart of "what's next": every completion suggests a natural follow-up. */
export function followUp(d: AppData, e: FlowEvent): Toast {
  const t = (x: Omit<Toast, "id">): Toast => ({ id: e.id, ...x });
  const wT = d.profile.waterTargetOz ?? 80, l = getLog(d);
  switch (e.type) {
    case "move": return t({ title: `${e.value} minutes of ${e.label ?? "movement"}. Yes!`, body: "Your heart says thank you. Rehydrate first.", next: { label: "Drink 16 oz", act: "water16" }, react: "cheer", confetti: true });
    case "water": {
      if (l.waterOz >= wT && l.waterOz - (e.value ?? 0) < wT) return t({ title: "Water goal reached 💧", body: `${l.waterOz} oz today. That's a full glass of self-care.`, next: stepNext(d), react: "cheer", confetti: true });
      if (recent(d, "move", 45) && !recent(d, "cooldown", 45)) return t({ title: "Hydrated. Nice.", body: "Give those calves a 3-minute cooldown.", next: { label: "Cooldown stretch", href: "/move#mobility" }, react: "proud" });
      return t({ title: `+${e.value} oz`, body: `${Math.max(0, wT - l.waterOz)} oz to go today.`, next: stepNext(d), react: "proud" });
    }
    case "cooldown": return t({ title: "Stretched and loose 🌿", body: recent(d, "move", 90) ? "Cap it off with a protein snack." : "Your body will thank you tomorrow.", next: recent(d, "move", 90) ? { label: "Log a 20 g protein snack", act: "protein20" } : stepNext(d), react: "calm", confetti: true });
    case "protein": case "meal": {
      const left = proteinLeft(d), nm = nextMeal(d);
      const body = left === 0 ? "Protein goal met for today. Wonderful." : `${left} g protein to go${nm ? `. Next up: ${nm.r.title} (${nm.r.protein} g)` : ""}.`;
      return t({ title: e.type === "meal" ? `Enjoyed ${e.label ?? "your meal"} 🍽️` : `+${e.value} g protein`, body, next: nm ? { label: `See ${nm.slot}`, href: "/nourish#plan" } : left > 0 ? { label: "Find a protein snack", href: "/coach?q=" + encodeURIComponent("Quick high-protein snack ideas") } : stepNext(d), react: left === 0 ? "cheer" : "proud", confetti: left === 0 && e.type === "meal" });
    }
    case "dose": case "supp": {
      const morning = phaseNow() === "morning", nm = nextMeal(d);
      if (morning && nm?.slot === "breakfast") return t({ title: `${e.label ?? "Dose"} logged ✓`, body: `Breakfast next: ${nm.r.title}, ${nm.r.protein} g protein.`, next: { label: "Breakfast", href: "/nourish#plan" }, react: "proud" });
      if (morning) return t({ title: `${e.label ?? "Dose"} logged ✓`, body: "Breakfast next. Something with protein will keep you full.", next: { label: "Breakfast ideas", href: "/coach?q=" + encodeURIComponent("High-protein breakfast ideas") }, react: "proud" });
      return t({ title: `${e.label ?? "Dose"} logged ✓`, body: "One less thing to remember.", next: stepNext(d), react: "proud" });
    }
    case "mood": {
      const low = e.label === "drained" || e.label === "busy" || e.label === "stressed";
      return low ? t({ title: "Thanks for being honest 💛", body: "Let's keep today soft. Two minutes of slow breathing can help.", next: { label: "2-min breathing", href: "/unwind#breathe" }, react: "calm" })
        : t({ title: "Love that energy", body: e.label === "spark" ? "Ride it. A fun bounce might feel amazing." : "A small win will feel good today.", next: e.label === "spark" ? { label: "Kitchen Dance Party", href: "/move#bounce" } : stepNext(d), react: "cheer" });
    }
    case "sleep": return t({ title: "Sleep logged 🌙", body: (e.value ?? 0) < 6.5 ? "A shorter night. Go gentle today, and wind down a little earlier tonight." : "Rested is a superpower.", next: stepNext(d), react: "calm" });
    case "journal": return t({ title: "Beautifully put ✍️", body: "Writing it down helps it stick.", next: phaseNow() === "winddown" || phaseNow() === "evening" ? { label: "Wind down", href: "/unwind#sleep" } : stepNext(d), react: "calm" });
    case "checkin": return t({ title: "Week planned 🌱", body: e.label ? `Your tweak: ${e.label}. You'll see it in your days.` : "You'll see your plan in your days.", next: { label: "Back to today", href: "/" }, react: "cheer", confetti: true });
    case "wind": return t({ title: "Goodnight, you did enough 🌙", body: "Tomorrow's first step is waiting on Today.", next: { label: "Three good things", href: "/journal" }, react: "calm" });
    default: return t({ title: e.label ?? "Little win!", next: stepNext(d), react: "cheer" });
  }
}

/** End-of-day recap narrative. */
export function recap(d: AppData) {
  const l = getLog(d), k = today();
  const doses = d.doseLogs.filter((x) => x.date === k && x.status === "taken").length + d.suppLogs.filter((x) => x.date === k).length;
  const moved = d.workouts.filter((w) => w.date === k).reduce((a, w) => a + w.minutes, 0);
  const wins = d.wins.filter((w) => w.date === k).length;
  const bits = [l.waterOz && `${l.waterOz} oz of water`, l.proteinG && `${l.proteinG} g protein`, moved && `${moved} min of movement`, doses && `${doses} dose${doses > 1 ? "s" : ""} taken`].filter(Boolean) as string[];
  const story = bits.length === 0 ? "A quiet day. Rest counts, and tomorrow is a fresh page." : bits.length >= 3 ? `You showed up big today: ${bits.join(", ")}.` : `Today you managed ${bits.join(" and ")}. That's real.`;
  return { water: l.waterOz, protein: l.proteinG, moved, doses, wins, story };
}
/** Preview of tomorrow's first step. */
export function tomorrowFirst(d: AppData) {
  const t = new Date(); t.setDate(t.getDate() + 1); const k = ymd(t);
  const c: { at: string; title: string }[] = [{ at: "07:30", title: "A glass of water to wake up" }];
  d.meds.filter((m) => m.active && !m.asNeeded).forEach((m) => m.times.forEach((x) => c.push({ at: x, title: `Take ${m.name}` })));
  d.supplements.forEach((s) => s.times.forEach((x) => c.push({ at: x, title: `${s.name}` })));
  const b = recipes.find((r) => r.id === d.mealPlan[k]?.breakfast); if (b) c.push({ at: "08:00", title: `Breakfast: ${b.title}` });
  c.sort((a, b) => a.at.localeCompare(b.at));
  const first = c[0]; const then = c.slice(1, 3).map((x) => x.title);
  return { ...first, then, day: t.toLocaleDateString(undefined, { weekday: "long" }) };
}
/** Sunday plan applied this week (for "from your Sunday plan" tags). */
export const sundayPlan = (d: AppData) => { const last = [...d.checkins].sort((a, b) => b.weekOf.localeCompare(a.weekOf))[0]; if (!last) return null; const days = (Date.now() - +new Date(last.weekOf + "T12:00")) / 864e5; return days < 7.5 ? last : null; };
