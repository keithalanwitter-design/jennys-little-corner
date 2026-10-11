"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useData, uid, today, daysAgo, addWin } from "@/lib/store";
import { PageHeader, Loading, Sheet, Tabs } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { doseState, logDose, undoDose, daysLeft, adherence, nowMin, type DoseState } from "@/lib/meds";
import type { Med } from "@/lib/types";

const TABS = [{ id: "today", label: "Today", icon: "today" }, { id: "list", label: "My meds", icon: "pill" }, { id: "history", label: "History", icon: "calendar" }] as const;
type Tab = (typeof TABS)[number]["id"];
const chip: Record<DoseState, [string, string]> = { upcoming: ["Later", "bg-surface-2 text-muted"], due: ["Due now", "bg-honey/30 text-terra"], late: ["A bit late", "bg-clay/15 text-terra"], missed: ["Missed", "bg-plum/15 text-plum"], taken: ["Taken", "bg-sage/20 text-moss"], skipped: ["Skipped", "bg-surface-2 text-muted"] };
const blank = { name: "", dose: "", times: ["08:00"], withFood: false, notes: "", stock: "", perDose: "1", prescriber: "", asNeeded: false };
const fmt = (hm: string) => new Date(`2000-01-01T${hm}`).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export default function Meds() {
  const { data, update } = useData();
  const [tab, setTab] = useState<Tab>("today"); const [open, setOpen] = useState<Med | "new" | null>(null); const [f, setF] = useState(blank);
  const [now, setNow] = useState(0); useEffect(() => { setNow(nowMin()); const i = setInterval(() => setNow(nowMin()), 60000); return () => clearInterval(i); }, []);
  if (!data) return <Loading />;
  const active = data.meds.filter((m) => m.active);
  const doses = active.filter((m) => !m.asNeeded).flatMap((m) => m.times.map((t) => ({ m, t, s: doseState(data, m, t, today(), now) }))).sort((a, b) => a.t.localeCompare(b.t));
  const anyMissed = doses.some((d) => d.s === "missed" || d.s === "late");
  const adh = adherence(data);
  const edit = (m: Med) => { setF({ name: m.name, dose: m.dose, times: m.times, withFood: m.withFood, notes: m.notes ?? "", stock: m.stock?.toString() ?? "", perDose: (m.perDose ?? 1).toString(), prescriber: m.prescriber ?? "", asNeeded: !!m.asNeeded }); setOpen(m); };
  const save = () => { if (!f.name.trim()) return; const rec = { name: f.name.trim(), dose: f.dose, times: f.asNeeded ? [] : f.times.filter(Boolean).sort(), withFood: f.withFood, notes: f.notes, stock: f.stock ? +f.stock : undefined, perDose: +f.perDose || 1, prescriber: f.prescriber, asNeeded: f.asNeeded };
    update((d) => ({ ...d, meds: open === "new" ? [...d.meds, { id: uid(), active: true, createdAt: new Date().toISOString(), ...rec }] : d.meds.map((m) => (m.id === (open as Med).id ? { ...m, ...rec } : m)) })); setOpen(null); };
  return (
    <>
      <PageHeader eyebrow="Medications" title="Meds, kindly kept" sub="Your schedule, your instructions. Gentle nudges, never guilt." right={<button className="btn !px-4" onClick={() => { setF(blank); setOpen("new"); }}><Icon name="plus" size={18} /> Add</button>} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {tab === "today" && (<div className="space-y-3">
          {active.length === 0 && <div className="card text-center text-muted">No medications added. Tap <b>Add</b> to set up a schedule. Vitamins live in <b>Supplements</b>.</div>}
          {anyMissed && <div className="card !bg-plum/10 text-sm"><b>Missed or late doses happen.</b> Check your label or ask your pharmacist whether to take it now or skip it. Please don&apos;t double up unless you&apos;ve been told to.</div>}
          {doses.map(({ m, t, s }) => (
            <motion.div layout key={m.id + t} className={`card flex items-center gap-3 p-4 ${s === "due" ? "ring-2 !ring-honey" : ""}`}>
              <div className="w-16 shrink-0 text-center"><div className="font-display text-lg font-semibold leading-none">{fmt(t).replace(/ (AM|PM)/, "")}</div><div className="text-[11px] font-bold text-muted">{fmt(t).slice(-2)}</div></div>
              <div className="min-w-0 flex-1"><div className="font-bold">{m.name}</div><div className="text-xs text-muted">{m.dose}{m.withFood ? " · with food" : ""}</div><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${chip[s][1]}`}>{chip[s][0]}</span></div>
              {s === "taken" || s === "skipped" ? <button className="chip !text-xs" onClick={() => update((d) => undoDose(d, m.id, t))}>Undo</button> : (
                <div className="flex flex-col gap-1.5"><motion.button whileTap={{ scale: 0.93 }} className="btn !px-3 !py-2 text-sm" onClick={() => update((d) => addWin(logDose(d, m.id, t, "taken"), "Took my meds", "meds"))}><Icon name="check" size={16} stroke={2.6} /> Taken</motion.button>
                  <button className="text-xs font-bold text-muted" onClick={() => update((d) => logDose(d, m.id, t, "skipped"))}>Skip</button></div>)}
            </motion.div>))}
          {active.filter((m) => m.asNeeded).map((m) => (
            <div key={m.id} className="card flex items-center gap-3 p-4"><div className="flex-1"><div className="font-bold">{m.name} <span className="chip !py-0 !text-[10px]">as needed</span></div><div className="text-xs text-muted">{m.dose} · taken {data.doseLogs.filter((l) => l.medId === m.id && l.date === today()).length}× today</div></div>
              <button className="btn-soft !py-2 text-sm" onClick={() => update((d) => logDose(d, m.id, new Date().toTimeString().slice(0, 5), "taken"))}>Log a dose</button></div>))}
        </div>)}
        {tab === "list" && (<div className="grid gap-3 md:grid-cols-2">
          {data.meds.map((m) => { const dl = daysLeft(m); return (
            <div key={m.id} className={`card ${m.active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-2"><div><div className="font-display text-xl font-semibold">{m.name}</div><div className="text-sm text-muted">{m.dose}{m.asNeeded ? " · as needed" : ` · ${m.times.map(fmt).join(", ")}`}</div></div>
                <button className="chip !text-xs" onClick={() => edit(m)}>Edit</button></div>
              {m.stock != null && <div className="mt-3"><div className="mb-1 flex justify-between text-xs font-bold"><span>{m.stock} left</span><span className={dl! <= 7 ? "text-terra" : "text-muted"}>{dl} days{dl! <= 7 ? " · time to refill" : ""}</span></div><div className="h-2 rounded-full bg-surface-2"><div className={`h-2 rounded-full ${dl! <= 7 ? "bg-clay" : "bg-sage"}`} style={{ width: `${Math.min(100, (dl! / 30) * 100)}%` }} /></div></div>}
              {(m.prescriber || m.notes) && <p className="mt-2 text-xs text-muted">{m.prescriber && `Prescribed by ${m.prescriber}. `}{m.notes}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="chip !text-xs" onClick={() => { const n = prompt("New count after refill?", "30"); if (n) update((d) => ({ ...d, meds: d.meds.map((x) => (x.id === m.id ? { ...x, stock: +n } : x)) })); }}>Refilled</button>
                <button className="chip !text-xs" onClick={() => update((d) => ({ ...d, meds: d.meds.map((x) => (x.id === m.id ? { ...x, active: !x.active } : x)) }))}>{m.active ? "Pause" : "Resume"}</button>
              </div>
            </div>); })}
          {data.meds.length === 0 && <div className="card text-center text-muted md:col-span-2">Nothing yet.</div>}
        </div>)}
        {tab === "history" && (<div className="space-y-4">
          {adh != null && <div className="card flex items-center gap-4"><div className="font-display text-4xl font-semibold text-moss">{Math.round(adh * 100)}%</div><p className="text-sm text-muted">of scheduled doses logged as taken over the last 7 days. This is just for you, and any number is okay.</p></div>}
          <div className="card overflow-x-auto">
            <table className="w-full text-center text-xs"><thead><tr><th className="pb-2 text-left font-bold text-muted">Dose</th>{Array.from({ length: 14 }, (_, i) => daysAgo(13 - i)).map((d) => <th key={d} className="pb-2 font-bold text-muted">{new Date(d + "T12:00").toLocaleDateString(undefined, { weekday: "narrow" })}</th>)}</tr></thead>
              <tbody>{active.filter((m) => !m.asNeeded).flatMap((m) => m.times.map((t) => (
                <tr key={m.id + t}><td className="whitespace-nowrap py-1 pr-2 text-left font-semibold">{m.name} <span className="text-muted">{fmt(t)}</span></td>
                  {Array.from({ length: 14 }, (_, i) => daysAgo(13 - i)).map((d) => { const l = data.doseLogs.find((x) => x.date === d && x.medId === m.id && x.time === t); const before = m.createdAt && d < m.createdAt.slice(0, 10);
                    return <td key={d} className="p-0.5"><span className={`mx-auto block h-5 w-5 rounded-md ${before ? "" : l?.status === "taken" ? "bg-sage" : l?.status === "skipped" ? "bg-line" : d === today() ? "ring-1 ring-line" : "bg-plum/20"}`} title={l?.status ?? "not logged"} /></td>; })}</tr>)))}</tbody></table>
            <div className="mt-3 flex gap-4 text-[11px] font-bold text-muted"><span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-sage" /> taken</span><span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-line" /> skipped</span><span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-plum/20" /> not logged</span></div>
          </div>
        </div>)}
      </motion.div>
      <p className="mt-6 text-xs text-muted">This tracker helps you remember. It doesn&apos;t give medical advice. Always follow your prescriber&apos;s and pharmacist&apos;s instructions.</p>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open === "new" ? "Add a medication" : "Edit medication"}>
        <div className="space-y-3">
          <input className="input" placeholder="Name, as on the label" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className="input" placeholder="Dose, e.g. 1 tablet (10 mg)" value={f.dose} onChange={(e) => setF({ ...f, dose: e.target.value })} />
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.asNeeded} onChange={(e) => setF({ ...f, asNeeded: e.target.checked })} /> As needed (no fixed schedule)</label>
          {!f.asNeeded && <div><div className="mb-1 text-sm font-bold">Times</div><div className="flex flex-wrap gap-2">{f.times.map((t, i) => <span key={i} className="flex items-center gap-1"><input type="time" className="input !w-auto" value={t} onChange={(e) => setF({ ...f, times: f.times.map((x, k) => (k === i ? e.target.value : x)) })} />{f.times.length > 1 && <button aria-label="remove time" onClick={() => setF({ ...f, times: f.times.filter((_, k) => k !== i) })}><Icon name="x" size={14} /></button>}</span>)}<button className="chip" onClick={() => setF({ ...f, times: [...f.times, "20:00"] })}>+ time</button></div></div>}
          <div className="grid grid-cols-2 gap-2"><input className="input" inputMode="numeric" placeholder="Pills on hand" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /><input className="input" inputMode="numeric" placeholder="Per dose" value={f.perDose} onChange={(e) => setF({ ...f, perDose: e.target.value })} /></div>
          <input className="input" placeholder="Prescriber (optional)" value={f.prescriber} onChange={(e) => setF({ ...f, prescriber: e.target.value })} />
          <input className="input" placeholder="Notes, e.g. take on an empty stomach" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.withFood} onChange={(e) => setF({ ...f, withFood: e.target.checked })} /> Take with food</label>
          <button className="btn w-full" onClick={save}>Save</button>
          {open !== "new" && open && <button className="w-full text-sm font-bold text-terra" onClick={() => { if (confirm("Delete this medication and its history?")) { update((d) => ({ ...d, meds: d.meds.filter((m) => m.id !== (open as Med).id), doseLogs: d.doseLogs.filter((l) => l.medId !== (open as Med).id) })); setOpen(null); } }}>Delete</button>}
        </div>
      </Sheet>
    </>
  );
}
