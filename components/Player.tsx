"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Step } from "@/lib/content";
import { Ring } from "./Brand";
import { Icon } from "./Icons";

const tint = { warm: "var(--honey)", work: "var(--clay)", rest: "var(--sky)", cool: "var(--sage)" };
const tag = { warm: "Ease in", work: "Move", rest: "Recover", cool: "Stretch" };
const beep = (f = 660) => { try { const a = new AudioContext(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = f; g.gain.setValueAtTime(0.15, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.25); o.start(); o.stop(a.currentTime + 0.25); } catch {} };

export default function Player({ title, steps, onClose, onDone }: { title: string; steps: Step[]; onClose: () => void; onDone: (minutes: number, feel?: number) => void }) {
  const [i, setI] = useState(0), [left, setLeft] = useState(steps[0].sec), [run, setRun] = useState(true), [done, setDone] = useState(false);
  const elapsed = useRef(0);
  useEffect(() => {
    if (!run || done) return;
    const t = setInterval(() => { elapsed.current++; setLeft((l) => l - 1); }, 1000);
    return () => clearInterval(t);
  }, [run, done]);
  useEffect(() => {
    if (left > 0 || done) return;
    if (i + 1 < steps.length) { beep(steps[i + 1].kind === "work" ? 880 : 520); setI(i + 1); setLeft(steps[i + 1].sec); }
    else { beep(990); setDone(true); }
  }, [left, i, steps, done]);
  const s = steps[i], total = steps.reduce((a, x) => a + x.sec, 0);
  const progress = (steps.slice(0, i).reduce((a, x) => a + x.sec, 0) + s.sec - left) / total;
  const go = (n: number) => { const k = Math.max(0, Math.min(steps.length - 1, n)); setI(k); setLeft(steps[k].sec); };
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col bg-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(600px 400px at 50% 20%, ${tint[s.kind]}55, transparent 70%)` }} />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-[max(env(safe-area-inset-top),16px)]">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="rounded-full bg-surface p-2.5 ring-1 ring-line" aria-label="close"><Icon name="x" size={18} /></button>
          <div className="text-center"><div className="eyebrow">{title}</div><div className="text-xs font-bold text-muted">{i + 1} of {steps.length}</div></div>
          <div className="w-10" />
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2"><motion.div className="h-full rounded-full" style={{ background: tint[s.kind] }} animate={{ width: `${progress * 100}%` }} /></div>
        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <motion.div initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="mb-4 text-6xl">🌿</motion.div>
            <h2 className="font-display text-3xl font-semibold">Beautifully done.</h2>
            <p className="mt-2 text-muted">{Math.max(1, Math.round(elapsed.current / 60))} minutes, just for you.</p>
            <p className="mb-3 mt-6 text-sm font-bold">How did that feel?</p>
            <div className="flex gap-2">{["😮‍💨", "🙂", "😊", "🤩"].map((e, k) => <button key={e} className="rounded-2xl bg-surface px-4 py-3 text-2xl ring-1 ring-line active:scale-95" onClick={() => onDone(Math.max(1, Math.round(elapsed.current / 60)), k + 1)}>{e}</button>)}</div>
            <button className="mt-4 text-sm font-bold text-muted underline" onClick={() => onDone(Math.max(1, Math.round(elapsed.current / 60)))}>Skip</button>
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="eyebrow mb-4" style={{ color: tint[s.kind] }}>{tag[s.kind]}</div>
              <Ring pct={1 - left / s.sec} size={232} stroke={14} color={tint[s.kind]}>
                <div className="font-display text-6xl font-semibold tabular-nums">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</div>
              </Ring>
              <AnimatePresence mode="wait">
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="card mt-7 w-full text-center">
                  <div className="font-display text-2xl font-semibold">{s.name}</div>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{s.cue}</p>
                </motion.div>
              </AnimatePresence>
              {steps[i + 1] && <div className="mt-3 text-sm font-semibold text-muted">Up next · {steps[i + 1].name}</div>}
            </div>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => go(i - 1)} className="rounded-full bg-surface p-4 ring-1 ring-line" aria-label="previous"><Icon name="skip" className="rotate-180" /></button>
              <button onClick={() => setRun(!run)} className="btn h-[72px] w-[72px] rounded-full p-0" aria-label={run ? "pause" : "play"}><Icon name={run ? "pause" : "play"} size={28} /></button>
              <button onClick={() => go(i + 1)} className="rounded-full bg-surface p-4 ring-1 ring-line" aria-label="next"><Icon name="skip" /></button>
            </div>
            <p className="mt-4 text-center text-xs text-muted">Stop if anything hurts, you feel dizzy, or you can&apos;t catch your breath.</p>
          </>
        )}
      </div>
    </motion.div>
  );
}
