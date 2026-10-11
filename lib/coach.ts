import type { AppData, ChatMsg } from "./types";
import { uid, getLog, today, weekMinutes, daysAgo } from "./store";
import { fridgeMatches, avoidList } from "./suggest";
import { suppInfo, routines } from "./content";
import { sb, supabaseConfigured } from "./supabase";
import { plan } from "./nextstep";
import { phaseNow, recap, tomorrowFirst, sundayPlan } from "./flow";
import { weekSummary } from "./weekly";
import { selfCare } from "./content";

export const DOCTOR_NOTE = "Please check with your doctor or pharmacist before starting or changing any supplement or medication.";
/** Compact, privacy-minded context. Only what the coach needs, no free-text journal. */
export function buildContext(d: AppData) {
  const l = getLog(d); const wk = Array.from({ length: 7 }, (_, i) => d.logs[daysAgo(i)]).filter(Boolean);
  return {
    name: d.profile.name || undefined, focus: d.profile.focus, goals: d.goals.filter((g) => g.status === "active").map((g) => g.title),
    targets: { waterOz: d.profile.waterTargetOz, proteinG: d.profile.proteinTargetG, moveMinPerWeek: d.profile.moveTargetMin },
    avoid: avoidList(d), likes: d.profile.likes, cookMinutes: d.profile.cookMinutes, householdSize: d.profile.family ? d.profile.householdSize : 1,
    safeguards: d.profile.safeguards, pantry: d.pantry, favorites: d.favorites,
    today: { waterOz: l.waterOz, proteinG: l.proteinG, mood: l.mood, energy: l.energyAm ?? l.energyPm, stress: l.stress },
    week: { avgWater: avg(wk.map((x) => x.waterOz)), avgProtein: avg(wk.map((x) => x.proteinG)), moveMin: weekMinutes(d), avgSleep: avg(wk.map((x) => x.sleepHours ?? 0).filter(Boolean)) },
    supplements: d.supplements.map((s) => ({ name: s.name, times: s.times })), meds: d.meds.filter((m) => m.active).map((m) => ({ name: m.name, times: m.times })),
    plannedToday: d.mealPlan[today()] ?? {},
    phase: phaseNow(), nextSteps: plan(d).main.slice(0, 4).map((i) => `${i.at} ${i.title}`), catchUp: plan(d).catchUp.map((i) => i.title),
    doneToday: d.nextDone[today()] ?? [], recap: recap(d).story, sundayTweak: sundayPlan(d)?.tweak,
  };
}
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
const msg = (text: string, actions?: ChatMsg["actions"]): ChatMsg => ({ id: uid(), role: "assistant", text, at: new Date().toISOString(), actions });

const link = (label: string, href: string) => ({ label, kind: "link" as const, payload: [href] });
export function localReply(d: AppData, q: string, history: ChatMsg[]): ChatMsg {
  const s = q.toLowerCase();
  if (/missed a dose|forgot (my|a) (dose|pill|med)/.test(s)) return msg(`It happens to everyone. 💛 Check your label or ask your pharmacist whether to take it now or skip it. Please don't double up unless you've been told to. Then just pick up with your next dose.`, [link("Open meds", "/meds")]);
  if (/cooldown|cool down|stretch/.test(s)) return msg(`A 3-minute cooldown: slow march on the rebounder, calf stretch against the wall, then a forward fold with soft knees. Breathe out longer than you breathe in. 🌿`, [link("Mobility flows", "/move#mobility")]);
  if (/next step|what('s| is) next|what now/.test(s)) { const { main, catchUp } = plan(d); const n = main[0];
    return msg(n ? `Next up: **${n.title}** (${n.sub}).${main[1] ? `\nThen: ${main[1].title}.` : ""}${catchUp.length ? `\n\n${catchUp.length} earlier item${catchUp.length > 1 ? "s" : ""} in Catch up, only if it still fits.` : ""}${n.tag ? "\n\n🌱 That's from your Sunday plan." : ""}` : `You're all done for today. 🌿 Tomorrow starts with: **${tomorrowFirst(d).title}**.`, [link("Go to Today", "/"), ...(n?.href ? [link("Open it", n.href)] : [])]); }
  if (/how('s| is) my day|today so far|recap/.test(s)) { const r = recap(d); return msg(`${r.story}${r.wins ? ` Plus ${r.wins} little win${r.wins > 1 ? "s" : ""}. 🎉` : ""}\n\nNext: **${plan(d).main[0]?.title ?? "rest"}**.`, [link("See Today", "/")]); }
  if (/how('s| is) my week|week going|small tweak/.test(s)) { const w = weekSummary(d); return msg(`This week: avg **${w.avgWater} oz** water, **${w.avgProtein} g** protein, **${w.moveMin} min** moved, ~${w.avgSleep || "?"} hrs sleep, ${w.wins} wins.${sundayPlan(d)?.tweak ? `\n\nYour Sunday tweak: **${sundayPlan(d)!.tweak}**.` : "\n\nSunday's check-in will suggest one small tweak."}`, [link("See progress", "/progress"), link("Weekly check-in", "/checkin")]); }
  if (/wind down|can't sleep|bedtime|relax/.test(s)) return msg(`Let's slow things down: dim the lights, do a 2-minute **4-7-8 breath**, then a gentle stretch. Whatever's undone can wait for tomorrow. 🌙`, [link("Breathe", "/unwind#breathe"), link("Wind-down routine", "/unwind#sleep")]);
  if (/me.?time|self.?care|for me/.test(s)) { const it = selfCare[0].items; const i = it[new Date().getMinutes() % it.length]; return msg(`Try this: **${i}**. Five minutes, just for you.`, [link("More ideas", "/unwind#jenny")]); }
  if (/journal prompt|prompt/.test(s)) return msg(`Try: **"What made me smile today, even a little?"** Or simply list three good things.`, [link("Open journal", "/journal")]);
  if (/(pain|hurt|symptom|diagnos|prescri|side effect|dosage|how much .* take|blood pressure|pregnan|interact)/.test(s))
    return msg(`That's a really good question for your doctor or pharmacist. I can't give medical advice, and they know your full picture. 💛 I'm happy to help you write the question down so you remember to ask.`);
  const sup = suppInfo.find((x) => s.includes(x.name.toLowerCase().split(" ")[0].replace(/[()]/g, ""))) ?? (/(supplement|vitamin)/.test(s) ? null : undefined);
  if (sup) return msg(`**${sup.name}** (usually ${sup.when.toLowerCase()}): ${sup.note}\n\n${DOCTOR_NOTE}`, [link("My supplements", "/supplements")]);
  if (sup === null) return msg(`Here's a plain-language rundown of common ones:\n${suppInfo.slice(0, 5).map((x) => `• **${x.name}**: ${x.note}`).join("\n")}\n\n${DOCTOR_NOTE}`);
  if (/(grocery|shopping|list|buy)/.test(s)) {
    const last = [...history].reverse().find((m) => m.actions?.some((a) => a.kind === "grocery"));
    const items = last?.actions?.find((a) => a.kind === "grocery")?.payload ?? fridgeMatches(d, 3).flatMap((m) => m.need);
    return items.length ? msg(`Here's what you'd need to pick up:\n${[...new Set(items)].map((i) => `• ${i}`).join("\n")}`, [{ label: "Add to grocery list", kind: "grocery", payload: [...new Set(items)] }]) : msg("Looks like you already have everything. Nice!");
  }
  if (/(water|hydrat|drink)/.test(s)) { const l = getLog(d); const t = d.profile.waterTargetOz; return msg(`You've had ${l.waterOz} oz today${t ? ` of your ${t} oz goal` : ""}. An easy trick: pair a glass with things you already do, like coffee, school pickup and dinner prep. 💧`, [link("Go to Today", "/")]); }
  if (/(move|bounce|workout|exercise|tired|energy|cardio)/.test(s)) { const tired = /(tired|exhaust|low)/.test(s); const r = routines.find((x) => x.id === (tired ? "lymph" : "heartglow"))!; return msg(tired ? `Low-energy day? Try **${r.name}**, 5 minutes of slow bouncing with deep breaths. Rest counts too.` : `How about **${r.name}**? ${r.vibe} Start at Seedling and level up when it feels easy.`, [link("Open Move", "/move#bounce")]); }
  const style = /breakfast/.test(s) ? "Breakfast" : /lunch/.test(s) ? "Lunch" : /snack/.test(s) ? "Snack" : /dinner|supper/.test(s) ? undefined : undefined;
  if (/(meal|eat|cook|fridge|recipe|hungry|breakfast|lunch|dinner|snack|protein|make)/.test(s) || d.pantry.length) {
    const m = fridgeMatches(d, 3, style);
    if (!d.pantry.length) return msg(`Tell me what's in your fridge (try "I have eggs, spinach and chicken"), or add items in **Nourish → Fridge**, and I'll match meals to it. Meanwhile, a crowd-pleaser: **${m[0].r.title}** (${m[0].r.protein}g protein, ${m[0].r.minutes} min).`);
    const need = [...new Set(m.flatMap((x) => x.need))];
    return msg(`Based on your fridge${d.profile.avoid ? " (skipping what you avoid)" : ""}:\n${m.map((x, i) => `${i + 1}. **${x.r.title}**: ${x.r.protein}g protein, ${x.r.minutes} min. ${x.need.length ? `Need: ${x.need.join(", ")}` : "You have everything!"}`).join("\n")}`,
      [...(need.length ? [{ label: "Add missing to grocery", kind: "grocery" as const, payload: need }] : []), { label: `Plan "${m[0].r.title}" for today`, kind: "plan" as const, payload: [m[0].r.id] }]);
  }
  return msg(`I can help you:\n• find meals from what's in your fridge\n• turn ideas into a grocery list\n• explain supplements in plain language\n• pick a movement routine for your energy\n\nWhat sounds good?`);
}
/** Parse "I have eggs, spinach and chicken" into pantry items. */
export function pantryFrom(q: string) { const m = q.toLowerCase().match(/(?:i have|i've got|got|in my fridge(?: is| are)?)\s+(.+)/); return m ? m[1].replace(/[.!?]/g, "").split(/,|\band\b/).map((x) => x.trim()).filter((x) => x && x.length < 30) : []; }

export async function coachAvailable() { const c = sb(); if (!c) return false; const { data } = await c.auth.getSession(); return !!data.session; }
export async function remoteReply(d: AppData, history: ChatMsg[], mode: "chat" | "weekly" = "chat", extra?: unknown): Promise<ChatMsg | null> {
  const c = sb(); if (!c || !supabaseConfigured) return null;
  const { data, error } = await c.functions.invoke("coach", { body: { mode, context: buildContext(d), extra, messages: history.slice(-12).map((m) => ({ role: m.role, content: m.text })) } });
  if (error || !data?.reply) return null;
  return msg(data.reply, data.actions);
}
