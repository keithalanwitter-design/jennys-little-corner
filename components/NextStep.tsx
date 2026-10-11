"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useData, today, getLog, setLog, addWin } from "@/lib/store";
import { nextSteps, type NextItem } from "@/lib/nextstep";
import { logDose } from "@/lib/meds";
import { recipes } from "@/lib/recipes";
import { Icon } from "./Icons";
import type { AppData } from "@/lib/types";

const mark = (d: AppData, key: string, field: "nextDone" | "nextSkips"): AppData => ({ ...d, [field]: { ...d[field], [today()]: [...(d[field][today()] ?? []), key] } });
function complete(d: AppData, it: NextItem): AppData {
  let x = mark(d, it.key, "nextDone");
  if (it.kind === "water") x = setLog(x, { waterOz: getLog(x).waterOz + 16 });
  if (it.kind === "med") { const [, id, t] = it.key.split("-"); x = logDose(x, id, t, "taken"); }
  if (it.kind === "supp") { const [, id, t] = it.key.split("-"); x = { ...x, suppLogs: [...x.suppLogs, { date: today(), suppId: id, time: t }] }; }
  if (it.kind === "meal") { const slot = it.key.slice(5) as "breakfast"; const r = recipes.find((r) => r.id === x.mealPlan[today()]?.[slot]); if (r) x = addWin(setLog(x, { proteinG: getLog(x).proteinG + r.protein }), `Ate ${r.title}`, "meal"); }
  if (it.kind === "move") x = addWin(x, "Moved a little", "move");
  if (it.kind === "wind") x = addWin(x, "Wound down for the night", "sleep");
  return x;
}
const fmt = (hm: string) => new Date(`2000-01-01T${hm}`).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export default function NextStep() {
  const { data, update } = useData();
  if (!data) return null;
  const items = nextSteps(data); const it = items[0];
  const now = new Date().toTimeString().slice(0, 5);
  const doneCount = (data.nextDone[today()] ?? []).length;
  return (
    <section className="card overflow-hidden !p-0">
      <div className="flex items-center justify-between px-5 pt-4"><div className="eyebrow">Your next step</div><div className="text-xs font-bold text-muted">{doneCount} done · {items.length} to go</div></div>
      <AnimatePresence mode="popLayout" initial={false}>
        {it ? (
          <motion.div key={it.key} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60, scale: 0.96 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="px-5 pb-4 pt-3">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg" style={{ background: it.tint }}><Icon name={it.icon} size={26} /></div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-muted">{it.at <= now ? "Now" : fmt(it.at)}</div>
                <div className="font-display text-xl font-semibold leading-tight">{it.title}</div>
                <div className="truncate text-sm text-muted">{it.sub}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {it.kind === "checkin" ? <Link href="/checkin" className="btn flex-1">Start check-in</Link> :
                <motion.button whileTap={{ scale: 0.95 }} className="btn flex-1" onClick={() => update((d) => complete(d, it))}><Icon name="check" size={18} stroke={2.6} /> {it.kind === "water" ? "Drank 16 oz" : it.kind === "med" || it.kind === "supp" ? "Taken" : "Done"}</motion.button>}
              {it.kind === "move" && <Link href="/move" className="btn-soft">Start</Link>}
              <button className="btn-soft" onClick={() => update((d) => mark(d, it.key, "nextSkips"))}>Later</button>
            </div>
            {items[1] && <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted"><Icon name="skip" size={12} /> Then: {items[1].title}</div>}
          </motion.div>
        ) : (
          <motion.div key="all" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-5 pb-5 pt-3 text-center">
            <div className="text-4xl">🌿</div><div className="font-display text-xl font-semibold">That&apos;s everything for today</div><p className="text-sm text-muted">Rest easy. You showed up for yourself.</p>
          </motion.div>)}
      </AnimatePresence>
      <div className="flex h-1.5 bg-surface-2"><motion.div className="bg-gradient-to-r from-sage to-moss" animate={{ width: `${(doneCount / Math.max(1, doneCount + items.length)) * 100}%` }} /></div>
    </section>
  );
}
