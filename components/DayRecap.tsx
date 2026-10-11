"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useData } from "@/lib/store";
import { recap, tomorrowFirst } from "@/lib/flow";
import { CalfReact, runAct } from "./Toaster";
import { Icon } from "./Icons";

const fmt = (hm: string) => new Date(`2000-01-01T${hm}`).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
export default function DayRecap() {
  const { data, update } = useData(); if (!data) return null;
  const r = recap(data), t = tomorrowFirst(data);
  const wound = (data.nextDone[new Date().toLocaleDateString("en-CA")] ?? []).includes("wind");
  return (
    <section className="card overflow-hidden !bg-gradient-to-br from-[#2d3550]/90 to-[#55506b]/90 text-white">
      <div className="flex items-start gap-3">
        <CalfReact react="calm" size={56} />
        <div className="min-w-0 flex-1"><div className="eyebrow !text-white/70">Today&apos;s story</div><p className="mt-1 font-display text-lg font-semibold leading-snug">{r.story}</p></div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[["drop", r.water, "oz"], ["nourish", r.protein, "g"], ["move", r.moved, "min"], ["wins", r.wins, "wins"]].map(([i, v, u]) => (
          <motion.div key={u as string} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl bg-white/10 py-2"><Icon name={i as string} size={16} className="mx-auto opacity-80" /><div className="font-display text-xl font-semibold">{v as number}</div><div className="text-[10px] font-bold uppercase tracking-wide opacity-70">{u as string}</div></motion.div>))}
      </div>
      <div className="mt-4 rounded-2xl bg-white/10 p-3">
        <div className="text-[11px] font-bold uppercase tracking-wide opacity-70">Tomorrow&apos;s first step · {t.day}</div>
        <div className="font-semibold">{fmt(t.at)}: {t.title}</div>
        {t.then.length > 0 && <div className="text-xs opacity-75">then {t.then.join(" · ")}</div>}
      </div>
      <div className="mt-4 flex gap-2">
        {!wound ? <button className="btn flex-1 !bg-none !bg-white !text-[#2d3550]" onClick={() => runAct(update, "wind")}><Icon name="moon" size={16} /> Start winding down</button>
          : <Link href="/journal" className="btn flex-1 !bg-none !bg-white !text-[#2d3550]"><Icon name="journal" size={16} /> Three good things</Link>}
        <Link href="/unwind#breathe" className="btn-soft !bg-white/15 !text-white">Breathe</Link>
      </div>
    </section>
  );
}
