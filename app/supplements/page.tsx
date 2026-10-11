"use client";
import Link from "next/link";
import CoachChips from "@/components/CoachChips";
import { useState } from "react";
import { motion } from "framer-motion";
import { useData, uid, today, addWin } from "@/lib/store";
import { PageHeader, Loading, Sheet , Empty } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { suppInfo, sources } from "@/lib/content";
import type { Supplement } from "@/lib/types";

const Caveat = () => <p className="mt-2 flex gap-1.5 rounded-xl bg-clay/10 p-2 text-xs font-semibold text-terra"><span>⚕️</span>Check with your doctor or pharmacist before starting, especially if you take medications or are pregnant or breastfeeding.</p>;
const groups = [["Morning", "sun", (t: string) => t < "11:00"], ["Midday", "today", (t: string) => t >= "11:00" && t < "17:00"], ["Evening", "moon", (t: string) => t >= "17:00"]] as const;
const blank = { name: "", dose: "", times: ["08:00"], withFood: true, notes: "", stock: "", perDose: "1" };

export default function Supplements() {
  const { data, update } = useData();
  const [f, setF] = useState(blank), [open, setOpen] = useState(false);
  if (!data) return <Loading />;
  const d0 = today();
  const taken = (id: string, t: string) => data.suppLogs.some((l) => l.date === d0 && l.suppId === id && l.time === t);
  const toggle = (s: Supplement, t: string) => update((d) => {
    const was = taken(s.id, t);
    const suppLogs = was ? d.suppLogs.filter((l) => !(l.date === d0 && l.suppId === s.id && l.time === t)) : [...d.suppLogs, { date: d0, suppId: s.id, time: t }];
    const supplements = d.supplements.map((x) => x.id === s.id && x.stock != null ? { ...x, stock: Math.max(0, x.stock + (was ? 1 : -1) * (x.perDose ?? 1)) } : x);
    let n = { ...d, suppLogs, supplements };
    const all = n.supplements.every((x) => x.times.every((tt) => n.suppLogs.some((l) => l.date === d0 && l.suppId === x.id && l.time === tt)));
    if (all && n.supplements.length) n = addWin(n, "Took all my supplements", "supps");
    return n;
  });
  const doses = data.supplements.flatMap((s) => s.times.map((t) => ({ s, t })));
  const done = doses.filter(({ s, t }) => taken(s.id, t)).length;
  const daysLeft = (s: Supplement) => s.stock == null ? null : Math.floor(s.stock / Math.max(1, (s.perDose ?? 1) * s.times.length));
  const save = () => { if (!f.name.trim()) return; update((d) => ({ ...d, supplements: [...d.supplements, { id: uid(), name: f.name.trim(), dose: f.dose, withFood: f.withFood, notes: f.notes, times: f.times.filter(Boolean).sort(), stock: f.stock ? +f.stock : undefined, perDose: +f.perDose || 1 }] })); setF(blank); setOpen(false); };
  return (
    <>
      <PageHeader eyebrow="Supplements" title="Your daily lineup" sub="Your list, your schedule. Tap a dose to check it off." right={<button className="btn !px-4" onClick={() => setOpen(true)}><Icon name="plus" size={18} /> Add</button>} />
      <CoachChips page="supplements" />
      {doses.length > 0 && <div className="card mb-4 flex items-center gap-4"><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2"><motion.div className="h-full rounded-full bg-gradient-to-r from-sage to-moss" animate={{ width: `${(done / doses.length) * 100}%` }} /></div><span className="font-display text-lg font-semibold">{done}/{doses.length}</span></div>}
      <div className="grid gap-4 lg:grid-cols-3">
        {data.supplements.length === 0 ? <Empty className="lg:col-span-3" text="Nothing added yet. Add what you take and I'll remind you at the right time."><button className="btn" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> Add a supplement</button><Link href={"/coach?q=" + encodeURIComponent("Explain common supplements simply")} className="btn-soft">Learn first</Link></Empty> :
          groups.map(([g, icon, test]) => { const items = doses.filter(({ t }) => test(t)); if (!items.length) return null; return (
            <section key={g} className="card">
              <div className="mb-3 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-honey/25 text-terra"><Icon name={icon} size={16} /></span><h2 className="h2 !text-lg">{g}</h2></div>
              <ul className="space-y-2">{items.map(({ s, t }) => { const on = taken(s.id, t), dl = daysLeft(s); return (
                <li key={s.id + t}><motion.button whileTap={{ scale: 0.97 }} onClick={() => toggle(s, t)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 transition ${on ? "bg-sage/15 ring-sage/40" : "bg-surface-2/60 ring-line"}`}>
                  <span className={`grid h-8 w-8 place-items-center rounded-full ${on ? "bg-sage text-white" : "bg-surface ring-1 ring-line"}`}>{on && <Icon name="check" size={16} stroke={3} />}</span>
                  <span className="flex-1"><span className="block font-bold">{s.name}</span><span className="text-xs text-muted">{t} · {s.dose}{s.withFood ? " · with food" : ""}</span></span>
                  {dl != null && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${dl <= 7 ? "bg-clay/20 text-terra" : "bg-surface text-muted"}`}>{dl}d left</span>}
                </motion.button></li>); })}</ul>
            </section>); })}
      </div>
      {data.supplements.length > 0 && (
        <section className="card mt-4">
          <h2 className="h2 mb-2">Refills & details</h2>
          <ul className="divide-y divide-line">{data.supplements.map((s) => { const dl = daysLeft(s); return (
            <li key={s.id} className="flex flex-wrap items-center gap-2 py-2.5">
              <span className="flex-1 font-semibold">{s.name}<span className="block text-xs font-normal text-muted">{s.times.join(", ")}{s.notes ? ` · ${s.notes}` : ""}</span></span>
              {s.stock != null ? <span className={`text-sm font-bold ${dl! <= 7 ? "text-terra" : "text-muted"}`}>{s.stock} left{dl! <= 7 ? " · refill soon" : ""}</span> : <span className="text-xs text-muted">no count</span>}
              <button className="chip !text-xs" onClick={() => { const n = prompt("New bottle count?", "60"); if (n) update((d) => ({ ...d, supplements: d.supplements.map((x) => x.id === s.id ? { ...x, stock: +n } : x) })); }}>Refill</button>
              <button aria-label="remove" className="text-muted" onClick={() => update((d) => ({ ...d, supplements: d.supplements.filter((x) => x.id !== s.id) }))}><Icon name="trash" size={16} /></button>
            </li>); })}</ul>
        </section>)}
      <section className="mt-6">
        <h2 className="h2 mb-1">Commonly asked about</h2>
        <p className="mb-3 text-sm text-muted">General information, not a recommendation. Food first, supplements to fill gaps.</p>
        <div className="grid gap-3 md:grid-cols-2">{suppInfo.map((s) => (
          <div key={s.name} className="card p-4"><div className="flex items-start justify-between gap-2"><b className="font-display text-lg">{s.name}</b><span className="chip !text-[11px]">{s.when}</span></div><p className="mt-1 text-sm text-muted">{s.note}</p><Caveat />
            <button className="mt-2 text-xs font-bold text-clay" onClick={() => { setF({ ...blank, name: s.name, times: [/evening/i.test(s.when) ? "20:00" : "08:00"] }); setOpen(true); }}>+ Add to my lineup</button></div>))}</div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">{sources.map(([l, u]) => <a key={u} href={u} target="_blank" rel="noreferrer" className="chip !text-xs">{l} ↗</a>)}</div>
      </section>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add a supplement">
        <div className="space-y-3">
          <input className="input" placeholder="Name, e.g. Vitamin D3" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className="input" placeholder="Dose, as on the label or from your doctor" value={f.dose} onChange={(e) => setF({ ...f, dose: e.target.value })} />
          <div><div className="mb-1 text-sm font-bold">Times</div><div className="flex flex-wrap gap-2">{f.times.map((t, i) => <input key={i} type="time" className="input !w-auto" value={t} onChange={(e) => setF({ ...f, times: f.times.map((x, k) => (k === i ? e.target.value : x)) })} />)}<button className="chip" onClick={() => setF({ ...f, times: [...f.times, "20:00"] })}>+ time</button></div></div>
          <div className="grid grid-cols-2 gap-2"><input className="input" inputMode="numeric" placeholder="Count in bottle" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /><input className="input" inputMode="numeric" placeholder="Per dose" value={f.perDose} onChange={(e) => setF({ ...f, perDose: e.target.value })} /></div>
          <input className="input" placeholder="Notes (optional)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.withFood} onChange={(e) => setF({ ...f, withFood: e.target.checked })} /> Take with food</label>
          <Caveat />
          <button className="btn w-full" onClick={save}>Save</button>
        </div>
      </Sheet>
    </>
  );
}
