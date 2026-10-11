"use client";
import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, AreaChart, Area, CartesianGrid, ReferenceLine } from "recharts";
import { useData, daysAgo, today } from "@/lib/store";
import { PageHeader, Loading, Stat } from "@/components/ui";
import { Icon } from "@/components/Icons";

const axis = { tick: { fill: "var(--muted)", fontSize: 11, fontWeight: 700 }, axisLine: false, tickLine: false } as const;
const tip = { contentStyle: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, color: "var(--ink)", fontWeight: 700 }, cursor: { fill: "var(--surface-2)" } };

function Chart({ title, sub, children }: { title: string; sub?: string; children: React.ReactElement }) {
  return <section className="card"><div className="mb-3"><h3 className="h2 !text-lg">{title}</h3>{sub && <p className="text-xs text-muted">{sub}</p>}</div><div className="h-44 -ml-3"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></section>;
}

export default function Progress() {
  const { data, update } = useData();
  const [range, setRange] = useState(7);
  const [m, setM] = useState({ weight: "", waist: "", hips: "" });
  if (!data) return <Loading />;
  const days = Array.from({ length: range }, (_, i) => daysAgo(range - 1 - i));
  const rows = days.map((d) => { const l = data.logs[d]; return {
    day: new Date(d + "T12:00").toLocaleDateString(undefined, range > 7 ? { month: "numeric", day: "numeric" } : { weekday: "short" }),
    water: l?.waterOz ?? 0, protein: l?.proteinG ?? 0, energy: l?.energyAm ?? l?.energyPm ?? null, stress: l?.stress ?? null, sleep: l?.sleepHours ?? null,
    move: data.workouts.filter((w) => w.date === d).reduce((a, w) => a + w.minutes, 0) }; });
  const avg = (k: "water" | "protein" | "move") => Math.round(rows.reduce((a, r) => a + r[k], 0) / Math.max(1, rows.filter((r) => r[k]).length || 1));
  const p = data.profile;
  const meas = [...data.measurements].sort((a, b) => a.date.localeCompare(b.date)).map((x) => ({ ...x, day: new Date(x.date + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) }));
  return (
    <>
      <PageHeader eyebrow="Progress" title="Your gentle trends" sub="Patterns, not grades. Look when it helps, ignore it when it doesn't." right={
        <div className="flex rounded-full bg-surface-2 p-1 ring-1 ring-line">{[7, 30].map((r) => <button key={r} onClick={() => setRange(r)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${range === r ? "bg-surface shadow-sm" : "text-muted"}`}>{r}d</button>)}</div>} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Avg water" value={avg("water")} unit="oz" icon="drop" tint="linear-gradient(135deg,#8fb2c6,#5e93b0)" />
        <Stat label="Avg protein" value={avg("protein")} unit="g" icon="flame" tint="linear-gradient(135deg,var(--clay),var(--terra))" />
        <Stat label="Moved" value={rows.reduce((a, r) => a + r.move, 0)} unit="min" icon="move" tint="linear-gradient(135deg,var(--sage),var(--moss))" />
        <Stat label="Little wins" value={data.wins.filter((w) => w.date >= days[0]).length} icon="wins" tint="linear-gradient(135deg,var(--honey),var(--clay))" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Chart title="Water" sub={p.waterTargetOz ? `Your goal: ${p.waterTargetOz} oz` : "ounces per day"}><BarChart data={rows}><XAxis dataKey="day" {...axis} /><YAxis {...axis} width={34} /><Tooltip {...tip} />{p.waterTargetOz && <ReferenceLine y={p.waterTargetOz} stroke="var(--sky)" strokeDasharray="4 4" />}<Bar dataKey="water" fill="var(--sky)" radius={[8, 8, 3, 3]} /></BarChart></Chart>
        <Chart title="Protein" sub={p.proteinTargetG ? `Your goal: ${p.proteinTargetG} g` : "grams per day"}><BarChart data={rows}><XAxis dataKey="day" {...axis} /><YAxis {...axis} width={34} /><Tooltip {...tip} />{p.proteinTargetG && <ReferenceLine y={p.proteinTargetG} stroke="var(--clay)" strokeDasharray="4 4" />}<Bar dataKey="protein" fill="var(--clay)" radius={[8, 8, 3, 3]} /></BarChart></Chart>
        <Chart title="Movement minutes"><BarChart data={rows}><XAxis dataKey="day" {...axis} /><YAxis {...axis} width={34} /><Tooltip {...tip} /><Bar dataKey="move" fill="var(--sage)" radius={[8, 8, 3, 3]} /></BarChart></Chart>
        <Chart title="Energy & stress" sub="1–5 check-ins"><LineChart data={rows}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="day" {...axis} /><YAxis domain={[0, 5]} {...axis} width={24} /><Tooltip {...tip} /><Line connectNulls type="monotone" dataKey="energy" stroke="var(--honey)" strokeWidth={3} dot={{ r: 4 }} /><Line connectNulls type="monotone" dataKey="stress" stroke="var(--plum)" strokeWidth={3} dot={{ r: 4 }} /></LineChart></Chart>
        <Chart title="Sleep" sub="hours"><AreaChart data={rows}><defs><linearGradient id="sl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--plum)" stopOpacity={0.5} /><stop offset="1" stopColor="var(--plum)" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="day" {...axis} /><YAxis domain={[0, 11]} {...axis} width={24} /><Tooltip {...tip} /><Area connectNulls type="monotone" dataKey="sleep" stroke="var(--plum)" strokeWidth={2.5} fill="url(#sl)" /></AreaChart></Chart>
        <section className="card">
          <div className="mb-2 flex items-center justify-between"><h3 className="h2 !text-lg">Measurements</h3>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={p.trackMeasurements} onChange={(e) => update((d) => ({ ...d, profile: { ...d.profile, trackMeasurements: e.target.checked } }))} /> Show</label></div>
          {!p.trackMeasurements ? <p className="text-sm text-muted">Optional and private. Turn this on only if it&apos;s helpful to you. You can hide or delete measurements anytime.</p> : (<>
            {meas.length > 1 && <div className="-ml-3 h-36"><ResponsiveContainer><LineChart data={meas}><XAxis dataKey="day" {...axis} /><YAxis {...axis} width={34} domain={["auto", "auto"]} /><Tooltip {...tip} /><Line type="monotone" dataKey="weight" stroke="var(--clay)" strokeWidth={2.5} /><Line type="monotone" dataKey="waist" stroke="var(--sage)" strokeWidth={2.5} /><Line type="monotone" dataKey="hips" stroke="var(--plum)" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div>}
            <form className="mt-2 grid grid-cols-3 gap-2" onSubmit={(e) => { e.preventDefault(); const n = (s: string) => (s ? +s : undefined); if (!m.weight && !m.waist && !m.hips) return; update((d) => ({ ...d, measurements: [...d.measurements.filter((x) => x.date !== today()), { date: today(), weight: n(m.weight), waist: n(m.waist), hips: n(m.hips) }] })); setM({ weight: "", waist: "", hips: "" }); }}>
              {(["weight", "waist", "hips"] as const).map((k) => <input key={k} className="input !px-3 !py-2" inputMode="decimal" placeholder={k === "weight" ? "lb" : `${k} in`} value={m[k]} onChange={(e) => setM({ ...m, [k]: e.target.value })} />)}
              <button className="btn-soft col-span-3">Save today</button>
            </form>
            {data.measurements.length > 0 && <button className="mt-2 flex items-center gap-1 text-xs font-bold text-muted" onClick={() => confirm("Delete all measurements?") && update((d) => ({ ...d, measurements: [] }))}><Icon name="trash" size={12} /> Delete all measurements</button>}
          </>)}
        </section>
      </div>
    </>
  );
}
