"use client";
export function H({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return <header className="mb-4"><h1 className="text-2xl font-bold">{children}</h1>{sub && <p className="text-sm opacity-70">{sub}</p>}</header>;
}
export function Slider({ label, value, onChange, low, high }: { label: string; value?: number; onChange: (n: number) => void; low: string; high: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-sm font-medium">{label}</div>
      <div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`${label} ${n}`} className={`h-10 flex-1 rounded-xl ${value === n ? "bg-sage text-white" : "bg-sand"}`}>{n}</button>
      ))}</div>
      <div className="mt-1 flex justify-between text-xs opacity-60"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}
export const Loading = () => <p className="opacity-60">Loading…</p>;
