"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData, uid } from "@/lib/store";
import { H, Loading } from "@/components/ui";
import type { Goal } from "@/lib/types";

const focusOpts = ["Weeknight meals", "More food variety", "Meal prep", "Drinking more water", "Energy", "Sleep", "Stress", "Cardio", "Flexibility", "Strength", "Supplements"];
const goalIdeas = ["Bounce 3 times a week", "Feel less winded on the stairs", "Touch my toes", "Drink more water", "Protein at every meal", "Stretch before bed"];

export default function Onboarding() {
  const { data, update } = useData();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [g, setG] = useState(""), [t, setT] = useState("");
  if (!data) return <Loading />;
  const p = data.profile;
  const setP = (patch: Partial<typeof p>) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  const addGoal = (title: string, target = "") => title.trim() && update((d) => ({ ...d, goals: [...d.goals, { id: uid(), title: title.trim(), target, category: "custom", status: "active" } as Goal] }));
  const finish = () => { setP({ onboarded: true }); router.push("/"); };
  const steps = [
    <div key="0">
      <label className="mb-1 block font-medium">What should we call you?</label>
      <input className="input mb-4" value={p.name} onChange={(e) => setP({ name: e.target.value })} placeholder="optional" />
      <p className="mb-2 font-medium">What would you like help with right now?</p>
      <div className="flex flex-wrap gap-2">{focusOpts.map((f) => (
        <button key={f} className={p.focus.includes(f) ? "chip-on" : "chip"} onClick={() => setP({ focus: p.focus.includes(f) ? p.focus.filter((x) => x !== f) : [...p.focus, f] })}>{f}</button>
      ))}</div>
    </div>,
    <div key="1">
      <p className="mb-2 font-medium">Your goals, in your own words</p>
      <div className="mb-2 flex flex-wrap gap-2">{goalIdeas.map((x) => <button key={x} className="chip" onClick={() => addGoal(x)}>+ {x}</button>)}</div>
      <input className="input mb-2" value={g} onChange={(e) => setG(e.target.value)} placeholder="e.g. Play tag with the kids without getting winded" />
      <input className="input mb-2" value={t} onChange={(e) => setT(e.target.value)} placeholder="optional target, e.g. by spring" />
      <button className="btn-soft mb-3" onClick={() => { addGoal(g, t); setG(""); setT(""); }}>Add goal</button>
      <ul className="space-y-2">{data.goals.map((x) => (
        <li key={x.id} className="flex items-center justify-between rounded-xl bg-white p-2 text-sm">
          <span className={x.status === "paused" ? "opacity-50" : ""}>{x.title}{x.target && ` (${x.target})`}</span>
          <span className="flex gap-2">
            <button onClick={() => update((d) => ({ ...d, goals: d.goals.map((y) => y.id === x.id ? { ...y, status: y.status === "paused" ? "active" : "paused" } : y) }))}>{x.status === "paused" ? "▶️" : "⏸"}</button>
            <button aria-label="remove" onClick={() => update((d) => ({ ...d, goals: d.goals.filter((y) => y.id !== x.id) }))}>✕</button>
          </span>
        </li>))}</ul>
      <p className="mt-3 mb-1 text-sm font-medium">Optional daily targets (leave blank if you'd rather just notice)</p>
      <div className="flex gap-2">
        <input className="input" type="number" placeholder="water oz" value={p.waterTargetOz ?? ""} onChange={(e) => setP({ waterTargetOz: e.target.value ? +e.target.value : undefined })} />
        <input className="input" type="number" placeholder="protein g" value={p.proteinTargetG ?? ""} onChange={(e) => setP({ proteinTargetG: e.target.value ? +e.target.value : undefined })} />
      </div>
    </div>,
    <div key="2" className="space-y-3">
      <div><label className="block font-medium">Foods you love</label><input className="input" value={p.likes} onChange={(e) => setP({ likes: e.target.value })} placeholder="optional" /></div>
      <div><label className="block font-medium">Foods never to suggest</label><input className="input" value={p.avoid} onChange={(e) => setP({ avoid: e.target.value })} placeholder="comma separated, e.g. shrimp, tofu" /></div>
      <div><label className="block font-medium">Allergies or restrictions</label><input className="input" value={p.allergies} onChange={(e) => setP({ allergies: e.target.value })} placeholder="comma separated" /></div>
      <div><label className="block font-medium">Usual cooking time: {p.cookMinutes} min</label><input type="range" min={10} max={60} step={5} className="w-full" value={p.cookMinutes} onChange={(e) => setP({ cookMinutes: +e.target.value })} /></div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={p.family} onChange={(e) => setP({ family: e.target.checked })} /> Cooking for the family</label>
    </div>,
    <div key="3" className="space-y-2">
      <p className="font-medium">Optional. These only switch on gentler options and safety notes.</p>
      <p className="text-sm opacity-70">Stays on this device. Leave everything unchecked if you&apos;d rather not say.</p>
      {([["kneeCare", "I'd like extra knee-friendly options"], ["balance", "Balance can be tricky. Show support tips"], ["pregnant", "Pregnant, breastfeeding or trying"], ["fluidLimit", "A clinician limits how much I drink"]] as const).map(([k, l]) => (
        <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={p.safeguards[k]} onChange={(e) => setP({ safeguards: { ...p.safeguards, [k]: e.target.checked } })} /> {l}</label>
      ))}
    </div>,
  ];
  return (
    <>
      <H sub={`Step ${step + 1} of ${steps.length}. Skip anything, change it anytime.`}>Make it yours ✨</H>
      <div className="card mb-4">{steps[step]}</div>
      <div className="flex justify-between">
        <button className="btn-soft" onClick={finish}>Skip for now</button>
        <div className="flex gap-2">
          {step > 0 && <button className="btn-soft" onClick={() => setStep(step - 1)}>Back</button>}
          {step < steps.length - 1 ? <button className="btn" onClick={() => setStep(step + 1)}>Next</button> : <button className="btn" onClick={finish}>Done</button>}
        </div>
      </div>
    </>
  );
}
