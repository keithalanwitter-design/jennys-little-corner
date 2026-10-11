"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { onFlow } from "@/lib/bus";
import { followUp, type Toast, type NextAction } from "@/lib/flow";
import { peek, useData, getLog, setLog, addWin, today } from "@/lib/store";
import { Calf } from "./Brand";
import { Icon } from "./Icons";
import { plan } from "@/lib/nextstep";
import { completeStep } from "./NextStep";

const COLORS = ["var(--clay)", "var(--honey)", "var(--sage)", "var(--sky)", "var(--plum)", "var(--blush)"];
export function Confetti() {
  return <div className="pointer-events-none absolute inset-x-0 -top-2 h-0" aria-hidden>{Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI - Math.PI, r = 60 + (i % 4) * 22;
    return <motion.span key={i} className="absolute left-12 top-6 h-2 w-2 rounded-[3px]" style={{ background: COLORS[i % COLORS.length] }} initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }} animate={{ x: Math.cos(a) * r + 120, y: Math.sin(a) * r * 0.9, opacity: 0, rotate: 240, scale: 1 }} transition={{ duration: 1.1, ease: "easeOut", delay: i * 0.01 }} />;
  })}</div>;
}
export function CalfReact({ react, size = 54 }: { react: Toast["react"]; size?: number }) {
  const anim = react === "cheer" ? { y: [0, -10, 0, -6, 0], rotate: [0, -6, 6, 0] } : react === "proud" ? { scale: [1, 1.1, 1], rotate: [0, 4, 0] } : { y: [0, 2, 0], rotate: [0, -3, 0] };
  return <motion.div animate={anim} transition={{ duration: react === "calm" ? 2.4 : 0.9, repeat: react === "calm" ? Infinity : 0 }}><Calf size={size} /></motion.div>;
}
export function runAct(update: ReturnType<typeof useData>["update"], a: NextAction["act"]) {
  if (a === "water16") update((d) => { const n = getLog(d).waterOz + 16; let x = setLog(d, { waterOz: n }); if (d.profile.waterTargetOz && n >= d.profile.waterTargetOz) x = addWin(x, "Reached my water goal", "water"); return x; });
  if (a === "protein20") update((d) => setLog(d, { proteinG: getLog(d).proteinG + 20 }));
  if (a === "wind") update((d) => ({ ...d, nextDone: { ...d.nextDone, [today()]: [...(d.nextDone[today()] ?? []), "wind"] } }));
}
export default function Toaster() {
  const { update } = useData();
  const [t, setT] = useState<Toast | null>(null);
  useEffect(() => onFlow((e) => { const d = peek(); if (!d) return; const x = followUp(d, e); setT({ ...x, confetti: x.confetti && d.profile.celebrate !== false }); }), []);
  useEffect(() => { if (!t) return; const i = setTimeout(() => setT(null), 7000); return () => clearTimeout(i); }, [t]);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4 lg:bottom-6 lg:left-64">
      <AnimatePresence>
        {t && (
          <motion.div key={t.id} role="status" initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto relative w-full max-w-md rounded-[26px] bg-surface/95 p-3 pr-4 shadow-2xl ring-1 ring-line backdrop-blur">
            {t.confetti && <Confetti />}
            <div className="flex items-center gap-3">
              <div className="shrink-0"><CalfReact react={t.react} /></div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[17px] font-semibold leading-tight">{t.title}</div>
                {t.body && <div className="text-[13px] leading-snug text-muted">{t.body}</div>}
                {t.next && (t.next.href
                  ? <Link href={t.next.href} onClick={() => setT(null)} className="btn mt-2 !px-3 !py-1.5 text-sm">Next: {t.next.label} <Icon name="skip" size={13} /></Link>
                  : <button onClick={() => { const n = t.next!; if (n.step) update((d) => { const it = [...plan(d).main, ...plan(d).catchUp].find((i) => i.key === n.step); return it ? completeStep(d, it) : d; }); else runAct(update, n.act); }} className="btn mt-2 !px-3 !py-1.5 text-sm">Next: {t.next.label} <Icon name="skip" size={13} /></button>)}
              </div>
              <button aria-label="dismiss" className="self-start p-1 text-muted" onClick={() => setT(null)}><Icon name="x" size={16} /></button>
            </div>
          </motion.div>)}
      </AnimatePresence>
    </div>
  );
}
