"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useData } from "@/lib/store";
import { CalfReact, Confetti } from "./Toaster";

const steps = [
  { t: "Welcome to your corner", b: "Your day flows in four gentle phases: morning, midday, evening and wind-down. Today always shows what fits right now." },
  { t: "One next step at a time", b: "Tap the big button when it's done and the next one slides in. “Later” brings it back in about 90 minutes. Missed things go into a no-guilt Catch up." },
  { t: "Little celebrations", b: "Every time you finish something, I'll cheer and suggest a natural next step: water after a bounce, breakfast after morning meds." },
  { t: "Coach is one tap away", b: "Look for the “Ask coach” chips on every page. Meals from your fridge, grocery lists and plain-language supplement help." },
  { t: "Evenings wrap up softly", b: "At night you'll see today's story and tomorrow's first step. Then rest. You did enough." },
];
export default function Tour() {
  const { data, update } = useData();
  const [i, setI] = useState(-1);
  useEffect(() => { if (data && !data.tourDone && new URLSearchParams(location.search).get("tour") === "1") setI(0); }, [data]);
  const done = () => { setI(-1); update((d) => ({ ...d, tourDone: true })); history.replaceState(null, "", location.pathname); };
  return (
    <AnimatePresence>
      {i >= 0 && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 p-4 backdrop-blur-[2px] lg:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div key={i} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md rounded-[30px] bg-surface p-6 shadow-2xl ring-1 ring-line">
            {i === 0 && <Confetti />}
            <div className="flex items-center gap-3"><CalfReact react={i === 0 ? "cheer" : "proud"} size={64} /><div className="eyebrow">First-day tour · {i + 1}/{steps.length}</div></div>
            <h2 className="mt-3 font-display text-2xl font-semibold">{steps[i].t}</h2>
            <p className="mt-1 text-[15px] text-muted">{steps[i].b}</p>
            <div className="mt-5 flex gap-2"><button className="btn-soft" onClick={done}>Skip</button><button className="btn flex-1" onClick={() => (i < steps.length - 1 ? setI(i + 1) : done())}>{i < steps.length - 1 ? "Next" : "Start my day"}</button></div>
            <div className="mt-4 flex justify-center gap-1.5">{steps.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-clay" : "w-1.5 bg-line"}`} />)}</div>
          </motion.div>
        </motion.div>)}
    </AnimatePresence>
  );
}
