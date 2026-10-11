"use client";
import CoachChips from "@/components/CoachChips";
import { useHashTab } from "@/lib/useHashTab";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useData, getLog, setLog, today, addWin, daysAgo } from "@/lib/store";
import { PageHeader, Tabs, Loading, Scale } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { breathPatterns, selfCare, mobility } from "@/lib/content";
import Player from "@/components/Player";

const TABS = [{ id: "breathe", label: "Breathe", icon: "leaf" }, { id: "jenny", label: "Me Time", icon: "heart" }, { id: "sleep", label: "Sleep", icon: "moon" }] as const;
type Tab = (typeof TABS)[number]["id"];

export default function Unwind() {
  const { data, update } = useData();
  const [tab, setTab] = useHashTab<Tab>("breathe", TABS);
  if (!data) return <Loading />;
  return (
    <>
      <PageHeader eyebrow="Unwind" title="Soften the edges" sub="Breathe, recharge and wind down. A rest day is a good day." />
      <CoachChips page="unwind" />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {tab === "breathe" && <Breathe onDone={(n) => update((d) => addWin(d, `Took ${n} mindful minutes`, "calm"))} />}
        {tab === "jenny" && <JennyTime />}
        {tab === "sleep" && <Sleep />}
      </motion.div>
    </>
  );
}

function Breathe({ onDone }: { onDone: (n: number) => void }) {
  const [pat, setPat] = useState(breathPatterns[0]); const [on, setOn] = useState(false);
  const [ph, setPh] = useState(0), [t, setT] = useState(pat.phases[0][1]), [rounds, setRounds] = useState(0), [mins, setMins] = useState(2);
  const total = pat.phases.reduce((a, p) => a + p[1], 0), maxRounds = Math.ceil((mins * 60) / total);
  useEffect(() => {
    if (!on) return;
    const i = setInterval(() => setT((x) => x - 1), 1000); return () => clearInterval(i);
  }, [on]);
  useEffect(() => {
    if (!on || t > 0) return;
    const n = (ph + 1) % pat.phases.length;
    if (n === 0) { if (rounds + 1 >= maxRounds) { setOn(false); setRounds(0); setPh(0); setT(pat.phases[0][1]); onDone(mins); return; } setRounds(rounds + 1); }
    setPh(n); setT(pat.phases[n][1]);
  }, [t, on, ph, pat, rounds, maxRounds, mins, onDone]);
  const label = pat.phases[ph][0]; const dur = pat.phases[ph][1];
  const scale = /in/i.test(label) ? 1 : /out/i.test(label) ? 0.55 : (ph > 0 && /in/i.test(pat.phases[ph - 1][0]) ? 1 : 0.55);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card relative flex flex-col items-center overflow-hidden py-8">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(400px 300px at 50% 40%, color-mix(in oklab, var(--sky) 35%, transparent), transparent 70%)" }} />
        <div className="relative grid h-64 w-64 place-items-center">
          {[1, 0.8, 0.6].map((o, k) => (
            <motion.div key={k} className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, color-mix(in oklab, var(--sky) ${70 - k * 15}%, transparent), transparent 70%)`, opacity: o }}
              animate={{ scale: on ? scale * (1 - k * 0.12) : 0.7 - k * 0.08 }} transition={{ duration: on ? dur : 1, ease: "easeInOut" }} />))}
          <motion.div className="relative grid h-36 w-36 place-items-center rounded-full bg-gradient-to-br from-sky to-sage text-white shadow-xl" animate={{ scale: on ? scale : 0.8 }} transition={{ duration: on ? dur : 1, ease: "easeInOut" }}>
            <div className="text-center"><div className="font-display text-lg font-semibold">{on ? label : "Ready"}</div>{on && <div className="font-display text-3xl font-semibold">{t}</div>}</div>
          </motion.div>
        </div>
        <div className="relative mt-4 text-sm font-semibold text-muted">{on ? `Round ${rounds + 1} of ${maxRounds}` : `${pat.name} · ${mins} min`}</div>
        <button className="btn relative mt-4" onClick={() => { setPh(0); setT(pat.phases[0][1]); setRounds(0); setOn(!on); }}>{on ? <><Icon name="pause" size={16} /> Stop</> : <><Icon name="play" size={16} /> Begin</>}</button>
      </section>
      <section className="space-y-2">
        {breathPatterns.map((b) => (
          <button key={b.id} onClick={() => { setPat(b); setOn(false); setPh(0); setT(b.phases[0][1]); }} className={`card flex w-full items-center gap-3 p-4 text-left ${pat.id === b.id ? "ring-2 !ring-sage" : ""}`}>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky to-sage text-white"><Icon name="leaf" size={20} /></div>
            <div className="flex-1"><div className="font-display text-lg font-semibold">{b.name}</div><div className="text-sm text-muted">{b.desc} · {b.phases.map((p) => p[1]).join("-")}</div></div>
          </button>))}
        <div className="card flex items-center justify-between p-4"><span className="font-semibold">Length</span><div className="flex gap-1.5">{[1, 2, 5, 10].map((m) => <button key={m} className={mins === m ? "chip-on" : "chip"} onClick={() => setMins(m)}>{m} min</button>)}</div></div>
      </section>
    </div>
  );
}

function JennyTime() {
  const { data, update } = useData();
  const [roll, setRoll] = useState<string | null>(null), [mine, setMine] = useState("");
  if (!data) return null;
  const all = [...selfCare, { cat: "My ideas", icon: "sparkle", items: data.customSelfCare }].filter((c) => c.items.length);
  const isFav = (s: string) => data.selfCareFavs.includes(s);
  return (
    <div className="space-y-4">
      <section className="card relative overflow-hidden !bg-gradient-to-br from-plum/25 to-blush/35 text-center">
        <div className="eyebrow">Pick a pause</div>
        <motion.p key={roll ?? "x"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto my-3 max-w-sm font-display text-2xl font-semibold leading-snug">{roll ?? "What would feel good right now?"}</motion.p>
        <div className="flex justify-center gap-2">
          <button className="btn" onClick={() => { const xs = all.flatMap((c) => c.items); setRoll(xs[Math.floor(Math.random() * xs.length)]); }}>🎲 Surprise me</button>
          {roll && <button className="btn-soft" onClick={() => { update((d) => addWin(d, roll, "selfcare")); setRoll(null); }}><Icon name="check" size={16} /> I did it</button>}
        </div>
      </section>
      <div className="grid gap-3 md:grid-cols-2">{all.map((c) => (
        <section key={c.cat} className="card">
          <div className="mb-2 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-blush/50 text-terra"><Icon name={c.icon} size={16} /></span><h3 className="h2 !text-lg">{c.cat}</h3></div>
          <ul className="space-y-1">{c.items.map((s) => (
            <li key={s} className="flex items-center gap-2 rounded-xl p-1.5 text-[15px]"><span className="flex-1">{s}</span>
              <button aria-label="favorite" onClick={() => update((d) => ({ ...d, selfCareFavs: isFav(s) ? d.selfCareFavs.filter((x) => x !== s) : [...d.selfCareFavs, s] }))} className={isFav(s) ? "text-terra" : "text-muted/60"}>♥</button>
              <button aria-label="done" className="text-moss" onClick={() => update((d) => addWin(d, s, "selfcare"))}><Icon name="check" size={16} /></button></li>))}</ul>
        </section>))}</div>
      <form className="card flex gap-2" onSubmit={(e) => { e.preventDefault(); if (mine.trim()) update((d) => ({ ...d, customSelfCare: [...d.customSelfCare, mine.trim()] })); setMine(""); }}>
        <input className="input" placeholder="Add your own recharge idea" value={mine} onChange={(e) => setMine(e.target.value)} /><button className="btn !px-4" aria-label="add"><Icon name="plus" /></button>
      </form>
    </div>
  );
}

function Sleep() {
  const { data, update } = useData();
  const [play, setPlay] = useState(false);
  if (!data) return null;
  const log = getLog(data, daysAgo(0));
  const week = Array.from({ length: 7 }, (_, i) => data.logs[daysAgo(6 - i)]?.sleepHours ?? 0);
  const bed = mobility.find((m) => m.id === "bed")!;
  const routine = ["Screens down, lights low", "Warm shower or herbal tea", "Bedtime Unwind stretch", "4-7-8 breathing in bed", "Three good things in your journal"];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="card relative overflow-hidden !bg-gradient-to-br from-[#2d3550] to-[#55506b] text-white">
        <svg className="absolute right-4 top-4 opacity-80" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="20" fill="#FFF6DA" /><circle cx="38" cy="24" r="18" fill="#3d4260" /></svg>
        <div className="eyebrow !text-white/70">Last night</div>
        <div className="mt-1 font-display text-5xl font-semibold">{log.sleepHours ?? "–"}<span className="text-xl opacity-70"> hrs</span></div>
        <input type="range" min={3} max={11} step={0.5} value={log.sleepHours ?? 7} onChange={(e) => update((d) => setLog(d, { sleepHours: +e.target.value }, today()))} className="mt-4 w-full accent-[#e8c47c]" aria-label="hours slept" />
        <div className="mt-2 flex h-14 items-end gap-1.5">{week.map((h, i) => <div key={i} className="flex-1 rounded-md bg-white/70" style={{ height: `${(h / 11) * 100}%`, opacity: h ? 0.85 : 0.2, minHeight: 3 }} />)}</div>
        <div className="mt-1 text-[11px] opacity-70">last 7 nights</div>
      </section>
      <section className="card">
        <Scale label="Sleep quality" value={log.sleepQuality} onChange={(n) => update((d) => setLog(d, { sleepQuality: n }))} low="restless" high="restful" colors={["var(--plum)", "var(--plum)", "var(--sky)", "var(--sage)", "var(--moss)"]} />
        <h3 className="h2 mb-2">Wind-down routine</h3>
        <ol className="space-y-2">{routine.map((r, i) => <li key={r} className="flex items-center gap-3 text-[15px]"><span className="grid h-7 w-7 place-items-center rounded-full bg-plum/20 text-xs font-bold text-plum">{i + 1}</span>{r}</li>)}</ol>
        <button className="btn-sage mt-4 w-full" onClick={() => setPlay(true)}><Icon name="moon" size={16} /> Start Bedtime Unwind ({bed.minutes} min)</button>
      </section>
      {play && <Player title={bed.name} steps={bed.steps} onClose={() => setPlay(false)} onDone={(m) => { setPlay(false); update((d) => addWin({ ...d, workouts: [...d.workouts, { date: today(), minutes: m, mode: bed.name, routineId: bed.id }] }, "Wound down before bed", "sleep")); }} />}
    </div>
  );
}
