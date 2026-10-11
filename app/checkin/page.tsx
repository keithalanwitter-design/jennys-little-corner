"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useData, uid, today, addWin } from "@/lib/store";
import { Loading } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { Calf, Ring } from "@/components/Brand";
import { weekSummary, wentWellIdeas, hardIdeas, tweaks } from "@/lib/weekly";
import { coachAvailable, remoteReply } from "@/lib/coach";

const STEPS = ["Your week", "Went well", "Felt hard", "One tweak"];
export default function CheckIn() {
  const { data, update } = useData();
  const router = useRouter();
  const [step, setStep] = useState(0), [well, setWell] = useState<string[]>([]), [hard, setHard] = useState<string[]>([]), [note, setNote] = useState(""), [pick, setPick] = useState<string>();
  const [ai, setAi] = useState<string | null>(null), [live, setLive] = useState(false);
  useEffect(() => { coachAvailable().then(setLive); }, []);
  const s = useMemo(() => (data ? weekSummary(data) : null), [data]);
  const opts = useMemo(() => (data && s ? tweaks(s, data, hard) : []), [data, s, hard]);
  useEffect(() => { if (step === 3 && live && data && !ai) remoteReply(data, [], "weekly", { summary: s, wentWell: well, hard, note }).then((m) => m && setAi(m.text)); }, [step, live, data, ai, s, well, hard, note]);
  if (!data || !s) return <Loading />;
  const chosen = opts.find((o) => o.id === (pick ?? opts[0]?.id));
  const p = data.profile;
  const finish = () => { update((d) => addWin({ ...chosen!.apply(d), checkins: [...d.checkins, { id: uid(), weekOf: today(), wentWell: well, hard, note, tweak: chosen!.title, applied: [chosen!.id], at: new Date().toISOString() }] }, "Did my Sunday check-in", "checkin")); router.push("/"); };
  const tog = (xs: string[], x: string, set: (v: string[]) => void) => set(xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
  const body = [
    <div key="0">
      <h1 className="font-display text-3xl font-semibold">Here&apos;s your week</h1>
      <p className="mb-4 text-muted">No grades, just a gentle look back.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="card flex flex-col items-center p-4"><Ring pct={p.waterTargetOz ? s.avgWater / p.waterTargetOz : s.avgWater / 64} size={86} color="var(--sky)"><div className="font-display text-xl font-semibold">{s.avgWater}<span className="text-xs">oz</span></div></Ring><div className="mt-1 text-xs font-bold text-muted">avg water</div></div>
        <div className="card flex flex-col items-center p-4"><Ring pct={p.proteinTargetG ? s.avgProtein / p.proteinTargetG : s.avgProtein / 100} size={86} color="var(--clay)"><div className="font-display text-xl font-semibold">{s.avgProtein}<span className="text-xs">g</span></div></Ring><div className="mt-1 text-xs font-bold text-muted">avg protein</div></div>
        <div className="card flex flex-col items-center p-4"><Ring pct={s.moveMin / (p.moveTargetMin ?? 150)} size={86} color="var(--sage)"><div className="font-display text-xl font-semibold">{s.moveMin}</div></Ring><div className="mt-1 text-xs font-bold text-muted">min moved · {s.sessions} sessions</div></div>
        <div className="card flex flex-col items-center justify-center p-4 text-center"><div className="font-display text-3xl font-semibold">{s.avgSleep || "–"}<span className="text-sm text-muted"> hrs</span></div><div className="text-xs font-bold text-muted">avg sleep</div><div className="mt-2 font-display text-2xl font-semibold">{s.wins}</div><div className="text-xs font-bold text-muted">little wins</div></div>
      </div>
      {s.meds != null && <p className="mt-3 text-center text-sm text-muted">Meds logged as taken: {Math.round(s.meds * 100)}% of scheduled doses</p>}
    </div>,
    <div key="1">
      <h1 className="font-display text-3xl font-semibold">What went well? 🌱</h1>
      <p className="mb-4 text-muted">Tap any that feel true. Small things count most.</p>
      <div className="flex flex-wrap gap-2">{wentWellIdeas(s, data).map((x) => <button key={x} className={well.includes(x) ? "chip-on" : "chip"} onClick={() => tog(well, x, setWell)}>{x}</button>)}</div>
      <textarea className="input mt-4 min-h-24 resize-none" placeholder="Anything else you're proud of? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
    </div>,
    <div key="2">
      <h1 className="font-display text-3xl font-semibold">What felt hard?</h1>
      <p className="mb-4 text-muted">Totally normal. This just helps tailor next week.</p>
      <div className="grid grid-cols-2 gap-2">{hardIdeas.map((x) => <button key={x} className={`rounded-2xl p-3 text-left text-sm font-bold ring-1 transition ${hard.includes(x) ? "bg-gradient-to-br from-plum/80 to-blush text-white ring-transparent" : "bg-surface ring-line"}`} onClick={() => tog(hard, x, setHard)}>{x}</button>)}</div>
    </div>,
    <div key="3">
      <h1 className="font-display text-3xl font-semibold">One small tweak</h1>
      <p className="mb-4 text-muted">Just one. Choose what sounds doable.</p>
      {ai && <div className="card mb-3 !bg-gradient-to-br from-honey/20 to-sky/15 text-[15px]"><div className="eyebrow mb-1">From your coach</div>{ai}</div>}
      <div className="space-y-2">{opts.map((o, i) => { const on = (pick ?? opts[0].id) === o.id; return (
        <button key={o.id} onClick={() => setPick(o.id)} className={`card w-full !p-4 text-left transition ${on ? "ring-2 !ring-clay" : ""}`}>
          <div className="flex items-center gap-2">{i === 0 && <span className="rounded-full bg-clay/15 px-2 py-0.5 text-[10px] font-extrabold uppercase text-terra">Suggested</span>}<span className="font-display text-lg font-semibold">{o.title}</span>{on && <Icon name="check" size={18} className="ml-auto text-clay" stroke={2.6} />}</div>
          <p className="mt-1 text-sm text-muted">{o.why}</p>
        </button>); })}</div>
    </div>,
  ];
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9rem)] max-w-md flex-col lg:max-w-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">{STEPS.map((x, i) => <div key={x} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><motion.div className="h-full bg-gradient-to-r from-plum to-clay" animate={{ width: i <= step ? "100%" : "0%" }} /></div>)}</div>
        <span className="text-xs font-bold text-muted">Sunday check-in</span>
      </div>
      <AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1">{body[step]}</motion.div></AnimatePresence>
      {step === 0 && <div className="mt-4 flex items-center gap-3"><Calf size={56} /><p className="text-sm text-muted">{s.loggedDays ? "Look at you showing up. Let's make next week a little easier." : "A quiet week is still a week. Let's set up something gentle."}</p></div>}
      <div className="mt-6 flex gap-2">
        {step > 0 && <button className="btn-soft !px-5" onClick={() => setStep(step - 1)}>Back</button>}
        <button className="btn flex-1" onClick={() => (step < 3 ? setStep(step + 1) : finish())}>{step < 3 ? "Continue" : "Apply & finish"}</button>
      </div>
    </div>
  );
}
