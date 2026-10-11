"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useData, uid } from "@/lib/store";
import { Loading } from "@/components/ui";
import { Mark, Calf } from "@/components/Brand";
import { Icon } from "@/components/Icons";
import type { Goal } from "@/lib/types";

const focusOpts = [["Weeknight meals", "🍲"], ["More food variety", "🌈"], ["Meal prep", "🫙"], ["Drinking more water", "💧"], ["More energy", "⚡"], ["Better sleep", "🌙"], ["Less stress", "🫧"], ["Cardio", "🌀"], ["Flexibility", "🧘"], ["Strength", "💪"], ["Supplements", "🌿"], ["Time for me", "💛"]];
const goalIdeas = ["Bounce 3 times a week", "Climb stairs without getting winded", "Touch my toes", "Drink more water", "Protein at every meal", "Stretch before bed", "Prep lunches on Sunday", "Feel more energized"];
const steps = ["Welcome", "Focus", "Goals", "Kitchen", "Comfort"];

export default function Onboarding() {
  const { data, update } = useData();
  const router = useRouter();
  const [step, setStep] = useState(0), [dir, setDir] = useState(1);
  const [g, setG] = useState(""), [t, setT] = useState("");
  if (!data) return <Loading />;
  const p = data.profile;
  const setP = (patch: Partial<typeof p>) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  const addGoal = (title: string, target = "") => title.trim() && !data.goals.some((x) => x.title === title.trim()) && update((d) => ({ ...d, goals: [...d.goals, { id: uid(), title: title.trim(), target, category: "custom", status: "active", createdAt: new Date().toISOString() } as Goal] }));
  const finish = () => { setP({ onboarded: true }); router.push("/?tour=1"); };
  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };
  const body = [
    <div key="0" className="text-center">
      <div className="mx-auto mb-5 grid h-28 w-28 place-items-center rounded-[36px] bg-gradient-to-br from-honey/40 to-clay/30"><Mark size={84} /></div>
      <h1 className="font-display text-4xl font-semibold leading-tight">A little space,<br />just for you.</h1>
      <p className="mx-auto mt-3 max-w-xs text-muted">Nourish, move, unwind, on your terms. Everything here is optional, private, and yours to change.</p>
      <label className="mx-auto mt-6 block max-w-xs text-left text-sm font-bold">What should we call you?</label>
      <input className="input mx-auto mt-1 max-w-xs text-center text-lg" value={p.name} onChange={(e) => setP({ name: e.target.value })} placeholder="Your name (optional)" />
    </div>,
    <div key="1">
      <h2 className="font-display text-3xl font-semibold">What would you like help with?</h2>
      <p className="mb-4 mt-1 text-muted">Pick as many as you like.</p>
      <div className="grid grid-cols-2 gap-2">{focusOpts.map(([f, e]) => { const on = p.focus.includes(f); return (
        <motion.button whileTap={{ scale: 0.95 }} key={f} onClick={() => setP({ focus: on ? p.focus.filter((x) => x !== f) : [...p.focus, f] })} className={`flex items-center gap-2 rounded-2xl p-3 text-left text-sm font-bold ring-1 transition ${on ? "bg-gradient-to-br from-sage to-moss text-white ring-transparent" : "bg-surface ring-line"}`}>
          <span className="text-xl">{e}</span>{f}</motion.button>); })}</div>
    </div>,
    <div key="2">
      <h2 className="font-display text-3xl font-semibold">Your goals, your words</h2>
      <p className="mb-3 mt-1 text-muted">Tap an idea or write your own. You can pause or change them anytime.</p>
      <div className="mb-3 flex flex-wrap gap-1.5">{goalIdeas.filter((x) => !data.goals.some((y) => y.title === x)).map((x) => <button key={x} className="chip !text-xs" onClick={() => addGoal(x)}>+ {x}</button>)}</div>
      <div className="flex gap-2"><input className="input" value={g} onChange={(e) => setG(e.target.value)} placeholder="e.g. Play tag with the kids" /><button className="btn !px-4" aria-label="add goal" onClick={() => { addGoal(g, t); setG(""); setT(""); }}><Icon name="plus" /></button></div>
      <input className="input mt-2" value={t} onChange={(e) => setT(e.target.value)} placeholder="Optional: by when, or how often" />
      <ul className="mt-3 space-y-2">{data.goals.map((x) => (
        <motion.li layout key={x.id} className="flex items-center gap-2 rounded-2xl bg-surface p-3 ring-1 ring-line">
          <span className="text-lg">🌱</span><span className={`flex-1 text-sm font-semibold ${x.status === "paused" ? "opacity-50" : ""}`}>{x.title}{x.target && <span className="text-muted"> · {x.target}</span>}</span>
          <button className="chip !px-2 !py-1 !text-[11px]" onClick={() => update((d) => ({ ...d, goals: d.goals.map((y) => y.id === x.id ? { ...y, status: y.status === "paused" ? "active" : "paused" } : y) }))}>{x.status === "paused" ? "Resume" : "Pause"}</button>
          <button aria-label="remove" className="text-muted" onClick={() => update((d) => ({ ...d, goals: d.goals.filter((y) => y.id !== x.id) }))}><Icon name="x" size={16} /></button>
        </motion.li>))}</ul>
      <div className="mt-4 rounded-2xl bg-surface-2/70 p-3">
        <p className="mb-2 text-sm font-bold">Optional daily targets <span className="font-normal text-muted">(leave blank to just notice)</span></p>
        <div className="grid grid-cols-3 gap-2">
          <input className="input !px-3" inputMode="numeric" placeholder="water oz" value={p.waterTargetOz ?? ""} onChange={(e) => setP({ waterTargetOz: e.target.value ? +e.target.value : undefined })} />
          <input className="input !px-3" inputMode="numeric" placeholder="protein g" value={p.proteinTargetG ?? ""} onChange={(e) => setP({ proteinTargetG: e.target.value ? +e.target.value : undefined })} />
          <input className="input !px-3" inputMode="numeric" placeholder="move min/wk" value={p.moveTargetMin ?? ""} onChange={(e) => setP({ moveTargetMin: e.target.value ? +e.target.value : undefined })} />
        </div>
      </div>
    </div>,
    <div key="3" className="space-y-3">
      <h2 className="font-display text-3xl font-semibold">In your kitchen</h2>
      <p className="text-muted">So suggestions fit your life.</p>
      <div><label className="text-sm font-bold">Foods you love</label><input className="input mt-1" value={p.likes} onChange={(e) => setP({ likes: e.target.value })} placeholder="optional" /></div>
      <div><label className="text-sm font-bold">Never suggest</label><input className="input mt-1" value={p.avoid} onChange={(e) => setP({ avoid: e.target.value })} placeholder="comma separated, e.g. shrimp, tofu" /></div>
      <div><label className="text-sm font-bold">Allergies or restrictions</label><input className="input mt-1" value={p.allergies} onChange={(e) => setP({ allergies: e.target.value })} placeholder="comma separated" /></div>
      <div className="rounded-2xl bg-surface p-3 ring-1 ring-line"><div className="flex justify-between text-sm font-bold"><span>Usual cooking time</span><span className="text-clay">{p.cookMinutes} min</span></div><input type="range" min={10} max={60} step={5} className="mt-2 w-full accent-[var(--clay)]" value={p.cookMinutes} onChange={(e) => setP({ cookMinutes: +e.target.value })} /></div>
      <div className="flex items-center justify-between rounded-2xl bg-surface p-3 ring-1 ring-line"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={p.family} onChange={(e) => setP({ family: e.target.checked })} /> Cooking for the family</label>
        {p.family && <span className="flex items-center gap-1 text-sm"><button className="h-7 w-7 rounded-full bg-surface-2 font-bold" onClick={() => setP({ householdSize: Math.max(1, p.householdSize - 1) })}>–</button><b className="w-5 text-center">{p.householdSize}</b><button className="h-7 w-7 rounded-full bg-surface-2 font-bold" onClick={() => setP({ householdSize: p.householdSize + 1 })}>+</button></span>}</div>
    </div>,
    <div key="4" className="space-y-2">
      <h2 className="font-display text-3xl font-semibold">Comfort & safety</h2>
      <p className="pb-2 text-muted">Optional. These only turn on gentler options and safety notes. They stay on this device. Skip if you&apos;d rather not say.</p>
      {([["kneeCare", "Extra knee-friendly options", "🦵"], ["balance", "Balance support tips", "🤸"], ["pregnant", "Pregnant, breastfeeding or trying", "🤰"], ["fluidLimit", "A clinician limits how much I drink", "💧"]] as const).map(([k, l, e]) => (
        <label key={k} className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 ring-1 transition ${p.safeguards[k] ? "bg-sage/15 ring-sage/40" : "bg-surface ring-line"}`}>
          <span className="text-xl">{e}</span><span className="flex-1 text-sm font-bold">{l}</span>
          <input type="checkbox" className="h-5 w-5 accent-[var(--moss)]" checked={p.safeguards[k]} onChange={(ev) => setP({ safeguards: { ...p.safeguards, [k]: ev.target.checked } })} /></label>))}
      <div className="flex items-center gap-3 pt-3"><Calf size={64} /><p className="text-sm text-muted">That&apos;s it! You can change any of this later in More → Goals & preferences.</p></div>
    </div>,
  ];
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">{steps.map((s, i) => <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><motion.div className="h-full bg-gradient-to-r from-clay to-terra" animate={{ width: i <= step ? "100%" : "0%" }} /></div>)}</div>
        <button className="text-sm font-bold text-muted" onClick={finish}>Skip</button>
      </div>
      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} initial={{ opacity: 0, x: 40 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 * dir }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>{body[step]}</motion.div>
        </AnimatePresence>
      </div>
      <div className="sticky bottom-0 mt-6 flex gap-2 bg-gradient-to-t from-bg via-bg to-transparent pb-[max(env(safe-area-inset-bottom),16px)] pt-4">
        {step > 0 && <button className="btn-soft !px-5" onClick={() => go(step - 1)}>Back</button>}
        <button className="btn flex-1" onClick={() => (step < steps.length - 1 ? go(step + 1) : finish())}>{step === 0 ? "Let's begin" : step < steps.length - 1 ? "Continue" : "Enter my corner"}</button>
      </div>
    </div>
  );
}
