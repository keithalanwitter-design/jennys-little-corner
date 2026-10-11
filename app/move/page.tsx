"use client";
import { useEffect, useRef, useState } from "react";
import { useData, today } from "@/lib/store";
import { H, Loading } from "@/components/ui";
import { rebounderModes, cooldown } from "@/lib/content";
type Mode = keyof typeof rebounderModes;
type Seg = { label: string; sec: number; kind: "warm" | "work" | "rest" | "cool" };

function build(mode: Mode, minutes: number): Seg[] {
  const m = rebounderModes[mode], segs: Seg[] = [{ label: "Warm-up: easy bounce, heels down", sec: 120, kind: "warm" }];
  let left = minutes * 60 - 120 - 60, i = 0;
  while (left > 0) {
    const w = Math.min(m.work, left); segs.push({ label: m.moves[i++ % m.moves.length], sec: w, kind: "work" }); left -= w;
    if (m.rest && left > 0) { const r = Math.min(m.rest, left); segs.push({ label: "Soft recovery bounce", sec: r, kind: "rest" }); left -= r; }
  }
  segs.push({ label: "Slow down: gentle bounce, deep breaths", sec: 60, kind: "warm" });
  return segs;
}
const beep = () => { try { const a = new AudioContext(), o = a.createOscillator(); o.connect(a.destination); o.frequency.value = 660; o.start(); o.stop(a.currentTime + 0.15); } catch {} };

export default function Move() {
  const { data, update } = useData();
  const [mode, setMode] = useState<Mode>("gentle"), [mins, setMins] = useState(10);
  const [segs, setSegs] = useState<Seg[] | null>(null), [idx, setIdx] = useState(0), [left, setLeft] = useState(0), [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!running || !segs) return;
    ref.current = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(ref.current);
  }, [running, segs]);
  useEffect(() => {
    if (!segs || left > 0 || !running) return;
    beep();
    if (idx + 1 < segs.length) { setIdx(idx + 1); setLeft(segs[idx + 1].sec); }
    else {
      setRunning(false);
      const done = segs.filter((s) => s.kind !== "cool").reduce((a, s) => a + s.sec, 0) / 60;
      update((d) => ({ ...d, workouts: [...d.workouts, { date: today(), minutes: Math.round(done), mode: segs[0].kind === "cool" ? "cooldown" : mode }] }));
      setSegs(null);
    }
  }, [left, segs, idx, running, mode, update]);

  if (!data) return <Loading />;
  const start = (s: Seg[]) => { setSegs(s); setIdx(0); setLeft(s[0].sec); setRunning(true); };
  const sg = data.profile.safeguards;
  const weekMin = data.workouts.filter((w) => Date.now() - new Date(w.date).getTime() < 7 * 864e5).reduce((a, w) => a + w.minutes, 0);

  if (segs) {
    const s = segs[idx], total = segs.reduce((a, x) => a + x.sec, 0), done = segs.slice(0, idx).reduce((a, x) => a + x.sec, 0) + s.sec - left;
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
        <div className="text-sm uppercase tracking-wide opacity-60">{s.kind === "work" ? "Move" : s.kind === "rest" ? "Recover" : s.kind === "cool" ? "Cooldown" : "Ease in"} · {idx + 1}/{segs.length}</div>
        <div className={`my-6 flex h-56 w-56 items-center justify-center rounded-full text-6xl font-bold text-white ${s.kind === "work" ? "bg-clay" : s.kind === "rest" ? "bg-sky" : "bg-sage"}`}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</div>
        <div className="mb-2 text-xl font-semibold">{s.label}</div>
        {segs[idx + 1] && <div className="mb-6 text-sm opacity-60">Next: {segs[idx + 1].label}</div>}
        <div className="mb-6 h-2 w-full rounded-full bg-sand"><div className="h-2 rounded-full bg-sage" style={{ width: `${(done / total) * 100}%` }} /></div>
        <div className="flex gap-3">
          <button className="btn" onClick={() => setRunning(!running)}>{running ? "Pause" : "Resume"}</button>
          <button className="btn-soft" onClick={() => { setIdx(Math.min(idx + 1, segs.length - 1)); setLeft(segs[Math.min(idx + 1, segs.length - 1)].sec); }}>Skip</button>
          <button className="btn-soft" onClick={() => { setRunning(false); setSegs(null); }}>Stop</button>
        </div>
        <p className="mt-6 text-xs opacity-60">Stop if anything hurts, you feel dizzy, or you can&apos;t catch your breath.</p>
      </div>
    );
  }
  return (
    <>
      <H sub={`${weekMin} minutes this week. Every minute counts, and rest days count too.`}>Movement Studio 🌀</H>
      <section className="card mb-4">
        <h2 className="mb-2 font-semibold">Rebounder session</h2>
        <div className="mb-3 grid grid-cols-2 gap-2">{(Object.keys(rebounderModes) as Mode[]).map((k) => (
          <button key={k} onClick={() => setMode(k)} className={`rounded-2xl p-3 text-left text-sm ${mode === k ? "bg-sage text-white" : "bg-sand"}`}><b>{rebounderModes[k].label}</b><br />{rebounderModes[k].desc}</button>
        ))}</div>
        <div className="mb-3 flex gap-2">{[10, 15, 20].map((m) => <button key={m} className={`flex-1 ${mins === m ? "chip-on" : "chip"}`} onClick={() => setMins(m)}>{m} min</button>)}</div>
        <button className="btn w-full" onClick={() => start(build(mode, mins))}>Start {mins}-minute {mode} bounce</button>
        <ul className="mt-3 list-disc pl-5 text-xs opacity-70">
          <li>Use a stable rebounder on a flat surface. A handlebar helps with balance.</li>
          <li>Keep your knees soft, land through your whole foot, and keep the bounce low to start.</li>
          {(sg.kneeCare || sg.balance) && <li><b>Gentler setup:</b> stay in Gentle mode, hold the bar, and try seated bouncing or a walk if anything twinges.</li>}
          {sg.pregnant && <li><b>Please check with your OB or midwife</b> before rebounding.</li>}
        </ul>
      </section>
      <section className="card mb-4">
        <h2 className="mb-1 font-semibold">Knee-friendly cooldown (about 5 min)</h2>
        <ul className="mb-3 text-sm">{cooldown.map((c) => <li key={c.name}>• {c.name} ({c.sec}s)</li>)}</ul>
        <button className="btn-soft w-full" onClick={() => start(cooldown.map((c) => ({ label: c.name, sec: c.sec, kind: "cool" as const })))}>Start guided cooldown</button>
      </section>
      <section className="card text-sm">
        <h2 className="mb-1 font-semibold">Box breathing (2 min)</h2>
        <p className="mb-2 opacity-70">Breathe in for 4, hold for 4, out for 4, hold for 4.</p>
        <button className="btn-soft w-full" onClick={() => start(Array.from({ length: 8 }, (_, i) => ({ label: ["Breathe in", "Hold", "Breathe out", "Hold"][i % 4], sec: 4, kind: "cool" as const })).concat(Array.from({ length: 24 }, (_, i) => ({ label: ["Breathe in", "Hold", "Breathe out", "Hold"][i % 4], sec: 4, kind: "cool" as const }))))}>Start breathing</button>
        <p className="mt-3 text-xs opacity-60">The general guideline for adults is about 150 minutes of moderate activity a week (CDC), built up gradually. Talk with your doctor if you have pain, an injury, or a health condition.</p>
      </section>
    </>
  );
}
