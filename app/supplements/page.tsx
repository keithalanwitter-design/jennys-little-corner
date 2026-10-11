"use client";
import { useState } from "react";
import { useData, uid, today } from "@/lib/store";
import { H, Loading } from "@/components/ui";
import { suppInfo, sources } from "@/lib/content";

const Caveat = () => <p className="mt-1 text-xs font-medium text-clay">⚕️ Check with your doctor or pharmacist before starting, especially if you take medications or are pregnant or breastfeeding.</p>;

export default function Supplements() {
  const { data, update } = useData();
  const [f, setF] = useState({ name: "", dose: "", times: "08:00", withFood: true, notes: "" });
  if (!data) return <Loading />;
  const d0 = today();
  const taken = (id: string, t: string) => data.suppLogs.some((l) => l.date === d0 && l.suppId === id && l.time === t);
  const toggle = (id: string, t: string) => update((d) => ({ ...d, suppLogs: taken(id, t) ? d.suppLogs.filter((l) => !(l.date === d0 && l.suppId === id && l.time === t)) : [...d.suppLogs, { date: d0, suppId: id, time: t }] }));
  return (
    <>
      <H sub="Your list, your schedule. Tap to check one off.">Supplements 🌿</H>
      <section className="card mb-4">
        <h2 className="mb-2 font-semibold">Today</h2>
        {data.supplements.length === 0 && <p className="text-sm opacity-60">Nothing added yet.</p>}
        <ul className="space-y-2">{data.supplements.map((s) => (
          <li key={s.id} className="rounded-xl bg-white p-2">
            <div className="flex justify-between"><b>{s.name}</b><button aria-label="remove" className="text-xs opacity-60" onClick={() => update((d) => ({ ...d, supplements: d.supplements.filter((x) => x.id !== s.id) }))}>remove</button></div>
            <div className="text-xs opacity-70">{s.dose}{s.withFood ? " · with food" : ""}{s.notes ? ` · ${s.notes}` : ""}</div>
            <div className="mt-1 flex flex-wrap gap-2">{s.times.map((t) => <button key={t} className={taken(s.id, t) ? "chip-on" : "chip"} onClick={() => toggle(s.id, t)}>{taken(s.id, t) ? "✓ " : ""}{t}</button>)}</div>
          </li>))}</ul>
      </section>
      <section className="card mb-4">
        <h2 className="mb-2 font-semibold">Add a supplement</h2>
        <div className="space-y-2">
          <input className="input" placeholder="Name, e.g. Vitamin D3" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className="input" placeholder="Dose, as on the label or from your doctor" value={f.dose} onChange={(e) => setF({ ...f, dose: e.target.value })} />
          <input className="input" placeholder="Times, comma separated (08:00, 20:00)" value={f.times} onChange={(e) => setF({ ...f, times: e.target.value })} />
          <input className="input" placeholder="Notes (optional)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.withFood} onChange={(e) => setF({ ...f, withFood: e.target.checked })} /> Take with food</label>
          <button className="btn w-full" onClick={() => { if (!f.name.trim()) return; update((d) => ({ ...d, supplements: [...d.supplements, { id: uid(), name: f.name.trim(), dose: f.dose, withFood: f.withFood, notes: f.notes, times: f.times.split(",").map((t) => t.trim()).filter(Boolean) }] })); setF({ name: "", dose: "", times: "08:00", withFood: true, notes: "" }); }}>Save</button>
        </div>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Things people commonly ask about</h2>
        <p className="mb-2 text-xs opacity-70">General info only, not a recommendation. Food comes first. Supplements fill gaps.</p>
        <div className="space-y-2">{suppInfo.map((s) => <div key={s.name} className="card"><b>{s.name}</b><p className="text-sm">{s.note}</p><Caveat /></div>)}</div>
        <div className="mt-3 text-xs">Learn more: {sources.map(([l, u]) => <a key={u} href={u} target="_blank" rel="noreferrer" className="mr-2 underline">{l}</a>)}</div>
      </section>
    </>
  );
}
