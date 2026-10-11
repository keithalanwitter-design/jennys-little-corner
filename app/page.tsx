"use client";
import Link from "next/link";
import { useData, getLog, setLog, today } from "@/lib/store";
import { H, Slider, Loading } from "@/components/ui";

export default function Today() {
  const { data, update } = useData();
  if (!data) return <Loading />;
  const log = getLog(data), p = data.profile;
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const takenToday = data.suppLogs.filter((s) => s.date === today()).length;
  const suppDoses = data.supplements.reduce((a, s) => a + s.times.length, 0);
  const activeGoals = data.goals.filter((g) => g.status === "active");
  const weekMin = data.workouts.filter((w) => Date.now() - new Date(w.date).getTime() < 7 * 864e5).reduce((a, w) => a + w.minutes, 0);
  return (
    <>
      <H sub="A little space just for you. Every small thing counts.">{hello}{p.name ? `, ${p.name}` : ""} ☀️</H>
      {!p.onboarded && <Link href="/onboarding" className="card mb-4 block bg-sand/60">✨ <b>Make it yours.</b> Take 2 minutes to set your own goals. You can skip any question.</Link>}

      <section className="mb-4 grid grid-cols-2 gap-3">
        <div className="card text-center">
          <div className="text-3xl">💧</div>
          <div className="text-2xl font-bold">{log.waterOz} oz</div>
          {p.waterTargetOz ? <Bar v={log.waterOz} max={p.waterTargetOz} color="bg-sky" /> : <div className="text-xs opacity-60">no target set, just noticing</div>}
          <div className="mt-2 flex gap-2">
            <button className="btn flex-1 bg-sky" onClick={() => update((d) => setLog(d, { waterOz: getLog(d).waterOz + 16 }))}>+16oz</button>
            <button className="btn-soft" aria-label="undo water" onClick={() => update((d) => setLog(d, { waterOz: Math.max(0, getLog(d).waterOz - 16) }))}>↶</button>
          </div>
        </div>
        <div className="card text-center">
          <div className="text-3xl">🍳</div>
          <div className="text-2xl font-bold">{log.proteinG} g</div>
          {p.proteinTargetG ? <Bar v={log.proteinG} max={p.proteinTargetG} color="bg-clay" /> : <div className="text-xs opacity-60">protein so far</div>}
          <div className="mt-2 flex gap-2">
            <button className="btn flex-1" onClick={() => update((d) => setLog(d, { proteinG: getLog(d).proteinG + 20 }))}>+20g</button>
            <button className="btn-soft" aria-label="undo protein" onClick={() => update((d) => setLog(d, { proteinG: Math.max(0, getLog(d).proteinG - 20) }))}>↶</button>
          </div>
        </div>
      </section>

      <section className="card mb-4">
        <h2 className="mb-2 font-semibold">How are you feeling?</h2>
        <Slider label="Energy" value={hour < 15 ? log.energyAm : log.energyPm} onChange={(n) => update((d) => setLog(d, hour < 15 ? { energyAm: n } : { energyPm: n }))} low="running on empty" high="bright" />
        <Slider label="Stress" value={log.stress} onChange={(n) => update((d) => setLog(d, { stress: n }))} low="calm" high="a lot" />
        {log.energyAm || log.energyPm ? <p className="text-sm opacity-80">{suggest(log.energyAm ?? log.energyPm ?? 3, log.stress ?? 3)}</p> : null}
      </section>

      <section className="mb-4 grid grid-cols-3 gap-3 text-center text-sm">
        <Link href="/kitchen" className="card">🥗<br />Next meal idea</Link>
        <Link href="/move" className="card">🌀<br />{weekMin} min moved this week</Link>
        <Link href="/supplements" className="card">🌿<br />{suppDoses ? `${takenToday}/${suppDoses} taken` : "Add supplements"}</Link>
      </section>

      {activeGoals.length > 0 && (
        <section className="card">
          <h2 className="mb-2 font-semibold">Your goals</h2>
          <ul className="space-y-1 text-sm">{activeGoals.map((g) => <li key={g.id}>🌱 {g.title}{g.target ? ` (${g.target})` : ""}</li>)}</ul>
          <Link href="/onboarding" className="mt-2 inline-block text-sm underline">Edit goals</Link>
        </section>
      )}
    </>
  );
}
function Bar({ v, max, color }: { v: number; max: number; color: string }) {
  return <div className="mt-1 h-2 rounded-full bg-sand"><div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(100, (v / max) * 100)}%` }} /></div>;
}
function suggest(energy: number, stress: number) {
  if (energy <= 2) return "Low-energy day: a 5-minute gentle bounce or the cooldown stretch is plenty. Rest counts too. 💛";
  if (stress >= 4) return "Feeling stressed? Try 4 rounds of box breathing (4 in, 4 hold, 4 out, 4 hold) or a gentle bounce.";
  return "You've got some spark today. Maybe a 15-minute interval bounce if it feels good.";
}
