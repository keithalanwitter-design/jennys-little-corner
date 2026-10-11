"use client";
import { Calf } from "./Brand";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "./Icons";

export function PageHeader({ eyebrow, title, sub, right }: { eyebrow?: string; title: React.ReactNode; sub?: string; right?: React.ReactNode }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="font-display text-[32px] font-semibold leading-[1.05] tracking-tight lg:text-4xl">{title}</h1>
        {sub && <p className="mt-1.5 text-[15px] text-muted">{sub}</p>}
      </div>
      {right}
    </header>
  );
}
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: readonly { id: T; label: string; icon?: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="no-scrollbar -mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <div className="flex gap-1 rounded-full bg-surface-2/80 p-1 ring-1 ring-line">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onChange(t.id)} className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition ${value === t.id ? "text-ink" : "text-muted"}`}>
            {value === t.id && <motion.span layoutId={`tabs-${tabs[0].id}`} className="absolute inset-0 rounded-full bg-surface shadow-sm ring-1 ring-line" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
            {t.icon && <span className="relative"><Icon name={t.icon} size={16} /></span>}<span className="relative">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
export function Scale({ label, value, onChange, low, high, colors = ["var(--sky)", "var(--sage)", "var(--honey)", "var(--clay)", "var(--terra)"] }: { label: string; value?: number; onChange: (n: number) => void; low: string; high: string; colors?: string[] }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex justify-between text-sm font-bold"><span>{label}</span><span className="text-muted">{value ?? "–"}/5</span></div>
      <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => (
        <motion.button whileTap={{ scale: 0.9 }} key={n} onClick={() => onChange(n)} aria-label={`${label} ${n}`}
          className="h-11 flex-1 rounded-2xl text-sm font-extrabold ring-1 ring-line transition"
          style={value && n <= value ? { background: colors[n - 1], color: "#fff" } : { background: "var(--surface-2)" }}>{n}</motion.button>
      ))}</div>
      <div className="mt-1.5 flex justify-between text-xs text-muted"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm lg:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="max-h-[88dvh] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-t-[32px] bg-surface p-6 pb-[max(env(safe-area-inset-bottom),24px)] ring-1 ring-line lg:rounded-[32px]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line lg:hidden" />
            <div className="mb-4 flex items-start justify-between gap-3"><h2 className="font-display text-2xl font-semibold leading-tight">{title}</h2><button aria-label="close" onClick={onClose} className="rounded-full bg-surface-2 p-2"><Icon name="x" size={18} /></button></div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export const Loading = () => (
  <div className="space-y-4 pt-4">{[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-[28px] bg-surface-2/70" />)}</div>
);
export function Stat({ label, value, unit, icon, tint }: { label: string; value: React.ReactNode; unit?: string; icon: string; tint: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: tint }}><Icon name={icon} size={20} /></div>
      <div><div className="text-xs font-bold text-muted">{label}</div><div className="font-display text-xl font-semibold">{value}<span className="ml-0.5 text-sm text-muted">{unit}</span></div></div>
    </div>
  );
}
export const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };
export function Stagger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.06 } } }}>{children}</motion.div>;
}
export function Item({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} variants={{ h: { opacity: 0, y: 14 }, s: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } } }}>{children}</motion.div>;
}

/** Guiding empty state: friendly calf, one line, and a clear next action. */
export function Empty({ text, children, className = "" }: { text: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`card flex flex-col items-center gap-2 py-6 text-center ${className}`}>
      <Calf size={64} />
      <p className="max-w-xs text-sm text-muted">{text}</p>
      {children && <div className="mt-1 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}
