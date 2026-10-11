"use client";
import CoachChips from "@/components/CoachChips";
import Link from "next/link";
import { useHashTab } from "@/lib/useHashTab";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useData, today, addWin, weekMinutes, daysAgo } from "@/lib/store";
import { PageHeader, Tabs, Loading, Sheet , Empty } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { Ring } from "@/components/Brand";
import Player from "@/components/Player";
import { routines, mobility, type Step, type Routine } from "@/lib/content";

const TABS = [{ id: "bounce", label: "Rebounder", icon: "move" }, { id: "mobility", label: "Mobility", icon: "leaf" }, { id: "log", label: "My week", icon: "calendar" }] as const;
type Tab = (typeof TABS)[number]["id"];
const LEVELS = ["Seedling", "Sprout", "Bloom"];

export default function Move() {
  const { data, update } = useData();
  const [tab, setTab] = useHashTab<Tab>("bounce", TABS);
  const [play, setPlay] = useState<{ title: string; steps: Step[]; id: string } | null>(null);
  const [detail, setDetail] = useState<Routine | null>(null);
  if (!data) return <Loading />;
  const sg = data.profile.safeguards;
  const wk = weekMinutes(data), target = data.profile.moveTargetMin ?? 150;
  const lvl = (id: string) => data.routineLevels[id] ?? 0;
  const done = (id: string) => data.workouts.filter((w) => w.routineId === id).length;
  const finish = (minutes: number, feel?: number) => {
    const p = play!; setPlay(null);
    update((d) => {
      let x = { ...d, workouts: [...d.workouts, { date: today(), minutes, mode: p.title, routineId: p.id, feel }] };
      x = addWin(x, `Did ${p.title}`, "move");
      const n = x.workouts.filter((w) => w.routineId === p.id).length;
      if (n === 1) x = addWin(x, `First ${p.title} 🌱`, "milestone");
      return x;
    });
  };
  return (
    <>
      <PageHeader eyebrow="Move" title="Gentle bounce, strong body" sub="Low-impact, knee-kind movement. Rest days count too." right={
        <Ring pct={wk / target} size={72} stroke={8} color="var(--sage)"><div className="text-center"><div className="font-display text-lg font-semibold leading-none">{wk}</div><div className="text-[9px] font-bold text-muted">MIN/WK</div></div></Ring>} />
      <CoachChips page="move" />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {(sg.kneeCare || sg.balance || sg.pregnant) && (
        <div className="card mb-4 !bg-sky/15 text-sm"><b>Your gentler setup:</b> {sg.kneeCare && "Start each routine at Seedling, and swap jumps for heel bounces. "}{sg.balance && "Use a stability bar or keep a hand on a wall. "}{sg.pregnant && "Please check with your OB or midwife before rebounding."}</div>
      )}
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {tab === "bounce" && (
          <div className="grid gap-3 md:grid-cols-2">
            {routines.map((r) => { const L = r.levels[lvl(r.id)]; return (
              <motion.button whileTap={{ scale: 0.98 }} key={r.id} onClick={() => setDetail(r)} className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${r.color} p-5 text-left text-white shadow-[0_14px_30px_-18px_rgba(80,50,30,.7)]`}>
                <svg className="absolute -right-8 -top-8 opacity-15" width="160" height="160" viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="none" stroke="#fff" strokeWidth="18" /><circle cx="80" cy="80" r="30" fill="#fff" /></svg>
                <div className="relative flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest opacity-90"><span className="rounded-full bg-white/25 px-2 py-0.5">{L.label}</span>{L.minutes} min</div>
                <div className="relative mt-3 font-display text-2xl font-semibold">{r.name}</div>
                <div className="relative text-sm opacity-90">{r.vibe}</div>
                <div className="relative mt-4 flex items-center justify-between"><div className="flex gap-1">{LEVELS.map((_, k) => <span key={k} className={`h-1.5 w-6 rounded-full ${k <= lvl(r.id) ? "bg-white" : "bg-white/35"}`} />)}</div><span className="text-xs font-bold opacity-90">{done(r.id)} done</span></div>
              </motion.button>); })}
            <div className="card text-sm md:col-span-2">
              <h3 className="h2 mb-2">Bounce safely</h3>
              <ul className="grid gap-x-6 gap-y-1.5 text-muted md:grid-cols-2">
                <li>• Use a stable rebounder on a flat surface. A handlebar helps.</li><li>• Keep knees soft and land through your whole foot.</li>
                <li>• Start low. Your feet don&apos;t need to leave the mat.</li><li>• Wear supportive shoes or grippy socks.</li>
                <li>• Finish with the Knee-Friendly Cooldown.</li><li>• Stop if anything hurts, you feel dizzy, or notice pelvic-floor pressure.</li>
              </ul>
            </div>
          </div>
        )}
        {tab === "mobility" && (
          <div className="grid gap-3 md:grid-cols-2">{mobility.map((f) => (
            <div key={f.id} className="card">
              <div className="flex items-start justify-between"><div><div className="eyebrow">{f.focus}</div><div className="font-display text-xl font-semibold">{f.name}</div></div><span className="chip">{f.minutes} min</span></div>
              <ol className="my-3 space-y-1 text-sm text-muted">{f.steps.map((s, k) => <li key={k}>{k + 1}. {s.name}</li>)}</ol>
              <button className="btn-sage w-full" onClick={() => setPlay({ title: f.name, steps: f.steps, id: f.id })}><Icon name="play" size={16} /> Start guided</button>
            </div>))}</div>
        )}
        {tab === "log" && <WeekLog data={data} />}
      </motion.div>
      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ""}>
        {detail && (<>
          <p className="mb-3 text-muted">{detail.vibe}</p>
          <div className="mb-4 grid grid-cols-3 gap-2">{detail.levels.map((L, k) => (
            <button key={k} onClick={() => update((d) => ({ ...d, routineLevels: { ...d.routineLevels, [detail.id]: k } }))} className={`rounded-2xl p-3 text-center ring-1 ${lvl(detail.id) === k ? "bg-gradient-to-br from-sage to-moss text-white ring-transparent" : "bg-surface-2 ring-line"}`}>
              <div className="text-xs font-extrabold uppercase tracking-wide">{L.label}</div><div className="font-display text-2xl font-semibold">{L.minutes}</div><div className="text-[11px] opacity-80">minutes</div></button>))}</div>
          {done(detail.id) >= 3 && lvl(detail.id) < 2 && <p className="mb-3 rounded-2xl bg-honey/20 p-3 text-sm">You&apos;ve done this {done(detail.id)} times. Try {LEVELS[lvl(detail.id) + 1]} when it feels right, or stay put. Both are great.</p>}
          <h3 className="mb-2 font-display text-lg font-semibold">Cue cards</h3>
          <div className="no-scrollbar -mx-6 mb-5 flex gap-2 overflow-x-auto px-6">{[...new Map(detail.levels[lvl(detail.id)].steps.map((s) => [s.name, s])).values()].map((s) => (
            <div key={s.name} className="w-48 shrink-0 rounded-2xl bg-surface-2/70 p-3 ring-1 ring-line"><div className="eyebrow !text-[10px]">{s.kind}</div><div className="font-semibold">{s.name}</div><div className="mt-1 text-xs text-muted">{s.cue}</div></div>))}</div>
          <button className="btn w-full" onClick={() => { const L = detail.levels[lvl(detail.id)]; setPlay({ title: detail.name, steps: L.steps, id: detail.id }); setDetail(null); }}><Icon name="play" size={18} /> Start {detail.levels[lvl(detail.id)].minutes}-minute session</button>
        </>)}
      </Sheet>
      <AnimatePresence>{play && <Player title={play.title} steps={play.steps} onClose={() => setPlay(null)} onDone={finish} />}</AnimatePresence>
    </>
  );
}

function WeekLog({ data }: { data: NonNullable<ReturnType<typeof useData>["data"]> }) {
  const days = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
  const mins = days.map((d) => data.workouts.filter((w) => w.date === d).reduce((a, w) => a + w.minutes, 0));
  const max = Math.max(30, ...mins);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="card">
        <h3 className="h2 mb-4">Last 7 days</h3>
        <div className="flex h-40 items-end gap-2">{days.map((d, i) => (
          <div key={d} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-muted">{mins[i] || ""}</span>
            <motion.div className="w-full rounded-xl bg-gradient-to-t from-moss to-sage" initial={{ height: 0 }} animate={{ height: `${(mins[i] / max) * 120 + 4}px` }} style={{ opacity: mins[i] ? 1 : 0.25 }} />
            <span className="text-[11px] font-bold text-muted">{new Date(d + "T12:00").toLocaleDateString(undefined, { weekday: "narrow" })}</span>
          </div>))}</div>
        <p className="mt-3 text-xs text-muted">Adults are generally encouraged to build toward about 150 minutes of moderate activity a week (CDC). Some is better than none, and it adds up in small chunks.</p>
      </section>
      <section className="card">
        <h3 className="h2 mb-2">Recent sessions</h3>
        {data.workouts.length === 0 ? <Empty text="Your sessions will show up here. Five minutes is a perfect first one."><Link href="/move#bounce" className="btn">Start a gentle bounce</Link></Empty> :
          <ul className="divide-y divide-line">{[...data.workouts].reverse().slice(0, 8).map((w, i) => <li key={i} className="flex justify-between py-2 text-sm"><span className="font-semibold">{w.mode}</span><span className="text-muted">{w.minutes} min · {new Date(w.date + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}{w.feel ? ` · ${["😮‍💨", "🙂", "😊", "🤩"][w.feel - 1]}` : ""}</span></li>)}</ul>}
      </section>
    </div>
  );
}
