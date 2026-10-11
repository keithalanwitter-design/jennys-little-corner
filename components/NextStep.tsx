"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useData, today, getLog, setLog, addWin } from "@/lib/store";
import { plan, snoozeUntil, type NextItem } from "@/lib/nextstep";
import { PHASES } from "@/lib/flow";
import { logDose } from "@/lib/meds";
import { recipes } from "@/lib/recipes";
import { Icon } from "./Icons";
import type { AppData } from "@/lib/types";

const mark = (d: AppData, key: string, field: "nextDone" | "nextSkips"): AppData => ({ ...d, [field]: { ...d[field], [today()]: [...(d[field][today()] ?? []), key] } });
const snooze = (d: AppData, key: string): AppData => ({ ...d, nextSnooze: { ...d.nextSnooze, [today()]: { ...(d.nextSnooze[today()] ?? {}), [key]: snoozeUntil(90) } } });
export function completeStep(d: AppData, it: NextItem): AppData {
  let x = mark(d, it.key, "nextDone");
  if (it.kind === "water") x = setLog(x, { waterOz: getLog(x).waterOz + 16 });
  if (it.kind === "med") { const [, id, t] = it.key.split("-"); x = logDose(x, id, t, "taken"); }
  if (it.kind === "supp") { const [, id, t] = it.key.split("-"); x = { ...x, suppLogs: [...x.suppLogs, { date: today(), suppId: id, time: t }] }; }
  if (it.kind === "meal") { const slot = it.key.slice(5) as "breakfast"; const r = recipes.find((r) => r.id === x.mealPlan[today()]?.[slot]); if (r) x = addWin(setLog(x, { proteinG: getLog(x).proteinG + r.protein }), `Ate ${r.title}`, "meal"); }
  if (it.kind === "move") x = addWin({ ...x, workouts: [...x.workouts, { date: today(), minutes: 10, mode: "Quick bounce", feel: 3 }] }, "Moved a little", "move");
  if (it.kind === "wind") x = addWin(x, "Wound down for the night", "sleep");
  return x;
}
const fmt = (hm: string) => new Date(`2000-01-01T${hm}`).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const verb = (k: NextItem["kind"]) => (k === "water" ? "Drank 16 oz" : k === "med" || k === "supp" ? "Taken" : k === "meal" ? "Ate it" : k === "move" ? "I moved" : "Done");

export default function NextStep() {
  const { data, update } = useData();
  const [open, setOpen] = useState(false);
  if (!data) return null;
  const { main, catchUp, phase } = plan(data); const it = main[0];
  const now = new Date().toTimeString().slice(0, 5);
  const doneCount = (data.nextDone[today()] ?? []).length;
  return (
    <section className="card overflow-hidden !p-0">
      <div className="flex items-center justify-between px-5 pt-4"><div className="eyebrow flex items-center gap-1.5"><Icon name={PHASES[phase].icon} size={13} /> {PHASES[phase].label} · next step</div><div className="text-xs font-bold text-muted">{doneCount} done · {main.length} to go</div></div>
      <AnimatePresence mode="popLayout" initial={false}>
        {it ? (
          <motion.div key={it.key} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60, scale: 0.96 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="px-5 pb-4 pt-3">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg" style={{ background: it.tint }}><Icon name={it.icon} size={26} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-muted">{it.at <= now ? "Now" : fmt(it.at)}{it.tag && <span className="rounded-full bg-plum/15 px-2 py-0.5 text-[10px] text-plum">{it.tag}</span>}</div>
                <div className="font-display text-xl font-semibold leading-tight">{it.title}</div>
                <div className="truncate text-sm text-muted">{it.sub}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {it.kind === "checkin" ? <Link href="/checkin" className="btn flex-1">Start check-in</Link> :
                <motion.button whileTap={{ scale: 0.95 }} className="btn flex-1" onClick={() => update((d) => completeStep(d, it))}><Icon name="check" size={18} stroke={2.6} /> {verb(it.kind)}</motion.button>}
              {it.href && it.kind !== "checkin" && <Link href={it.href} className="btn-soft">{it.kind === "move" ? "Pick one" : "Open"}</Link>}
              <button className="btn-soft" onClick={() => update((d) => snooze(d, it.key))}>Later</button>
            </div>
            {main[1] && <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted"><Icon name="skip" size={12} /> Then: {main[1].title}</div>}
          </motion.div>
        ) : (
          <motion.div key="all" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-5 pb-5 pt-3 text-center">
            <div className="text-4xl">🌿</div><div className="font-display text-xl font-semibold">That&apos;s everything for today</div><p className="text-sm text-muted">Rest easy. You showed up for yourself.</p>
          </motion.div>)}
      </AnimatePresence>
      {catchUp.length > 0 && (
        <div className="border-t border-line px-5 py-3">
          <button className="flex w-full items-center justify-between text-sm font-bold" onClick={() => setOpen(!open)}><span>🫶 Catch up gently ({catchUp.length})</span><span className="text-xs text-muted">{open ? "Hide" : "No pressure"}</span></button>
          <AnimatePresence>{open && (
            <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <li className="pt-1 text-xs text-muted">These slipped by earlier. Do any that still fit, or let them go.</li>
              {catchUp.map((c) => (
                <li key={c.key} className="mt-2 flex items-center gap-2 text-sm"><span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <button className="chip !py-1 !text-xs" onClick={() => update((d) => completeStep(d, c))}>Done</button>
                  <button className="chip !py-1 !text-xs" onClick={() => update((d) => mark(d, c.key, "nextSkips"))}>Let it go</button></li>))}
            </motion.ul>)}</AnimatePresence>
        </div>)}
      <div className="flex h-1.5 bg-surface-2"><motion.div className="bg-gradient-to-r from-sage to-moss" animate={{ width: `${(doneCount / Math.max(1, doneCount + main.length)) * 100}%` }} /></div>
    </section>
  );
}
