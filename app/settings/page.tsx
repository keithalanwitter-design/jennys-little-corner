"use client";
import { useEffect, useState } from "react";
import { useData, resetCache } from "@/lib/store";
import { db } from "@/lib/db";
import { BASE } from "@/lib/base";
import { notify } from "@/lib/reminders";
import { PageHeader, Loading } from "@/components/ui";
import { Icon } from "@/components/Icons";

export default function Settings() {
  const { data, update } = useData();
  const [perm, setPerm] = useState<string>("default");
  useEffect(() => setPerm(typeof Notification !== "undefined" ? Notification.permission : "unsupported"), []);
  if (!data) return <Loading />;
  const p = data.profile;
  const setP = (x: Partial<typeof p>) => update((d) => ({ ...d, profile: { ...d.profile, ...x } }));
  const ask = async () => { if (typeof Notification === "undefined") return; setPerm(await Notification.requestPermission()); };
  const exportData = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })); a.download = "little-corner-data.json"; a.click(); };
  const importData = (file: File) => file.text().then(async (t) => { await db.save(JSON.parse(t)); resetCache(); location.reload(); });
  return (
    <>
      <PageHeader eyebrow="Settings" title="Make it feel right" sub="Gentle nudges, only the ones you want." />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="h2 mb-3">Appearance</h2>
          <div className="grid grid-cols-3 gap-2">{(["light", "system", "dark"] as const).map((t) => (
            <button key={t} onClick={() => setP({ theme: t })} className={`rounded-2xl p-3 text-sm font-bold capitalize ring-1 ${p.theme === t ? "bg-gradient-to-br from-sage to-moss text-white ring-transparent" : "bg-surface-2 ring-line"}`}>
              <Icon name={t === "light" ? "sun" : t === "dark" ? "moon" : "sparkle"} className="mx-auto mb-1" />{t}</button>))}</div>
          <label className="mt-4 flex items-center justify-between text-sm font-semibold">Celebrate little wins<input type="checkbox" checked={p.celebrate} onChange={(e) => setP({ celebrate: e.target.checked })} /></label>
        </section>
        <section className="card">
          <h2 className="h2 mb-3">Daily targets <span className="text-sm font-normal text-muted">(optional)</span></h2>
          {([["waterTargetOz", "Water (oz)"], ["proteinTargetG", "Protein (g)"], ["moveTargetMin", "Movement (min/week)"]] as const).map(([k, l]) => (
            <label key={k} className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold">{l}<input className="input !w-28 !py-2 text-right" inputMode="numeric" placeholder="—" value={p[k] ?? ""} onChange={(e) => setP({ [k]: e.target.value ? +e.target.value : undefined })} /></label>))}
          <label className="mt-1 flex items-center justify-between gap-3 text-sm font-semibold">People I usually cook for<input className="input !w-28 !py-2 text-right" inputMode="numeric" value={p.householdSize} onChange={(e) => setP({ householdSize: Math.max(1, +e.target.value || 1) })} /></label>
        </section>
        <section className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between"><h2 className="h2">Reminders</h2>
            {perm === "granted" ? <button className="chip" onClick={() => notify("Little Corner", "Reminders are on. 💛")}><Icon name="bell" size={14} /> Send a test</button>
              : perm === "unsupported" ? null : <button className="btn !py-2 text-sm" onClick={ask}><Icon name="bell" size={16} /> Allow notifications</button>}</div>
          {perm === "unsupported" && <p className="mb-3 rounded-2xl bg-sky/15 p-3 text-sm">On iPhone, first add the app to your Home Screen (Share, then Add to Home Screen), then open it from there to turn on notifications.</p>}
          {perm === "denied" && <p className="mb-3 rounded-2xl bg-clay/10 p-3 text-sm">Notifications are blocked. You can turn them back on in your browser&apos;s site settings.</p>}
          <ul className="grid gap-2 md:grid-cols-2">{data.reminders.map((r) => (
            <li key={r.id} className={`flex items-center gap-3 rounded-2xl p-3 ring-1 ring-line transition ${r.enabled ? "bg-sage/10" : "bg-surface-2/50"}`}>
              <button role="switch" aria-checked={r.enabled} aria-label={r.label} onClick={() => update((d) => ({ ...d, reminders: d.reminders.map((x) => x.id === r.id ? { ...x, enabled: !x.enabled } : x) }))} className={`relative h-7 w-12 shrink-0 rounded-full transition ${r.enabled ? "bg-sage" : "bg-line"}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${r.enabled ? "left-6" : "left-1"}`} /></button>
              <span className="flex-1 text-sm font-semibold">{r.label}{r.days && <span className="block text-xs font-normal text-muted">Sundays</span>}</span>
              <input type="time" className="rounded-xl bg-surface px-2 py-1.5 text-sm font-semibold ring-1 ring-line" value={r.time} onChange={(e) => update((d) => ({ ...d, reminders: d.reminders.map((x) => x.id === r.id ? { ...x, time: e.target.value } : x) }))} />
            </li>))}</ul>
          <p className="mt-3 text-xs text-muted">For now, reminders arrive while the app is open or running in the background. Push notifications for when it&apos;s fully closed are planned.</p>
        </section>
        <section className="card lg:col-span-2">
          <h2 className="h2 mb-1">Your data</h2>
          <p className="mb-3 text-sm text-muted">Everything stays on this device. Nothing is shared with anyone, ever, unless you choose to.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-soft" onClick={exportData}><Icon name="book" size={16} /> Export</button>
            <label className="btn-soft cursor-pointer"><Icon name="plus" size={16} /> Import<input type="file" accept="application/json" className="sr-only" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} /></label>
            <button className="btn-soft !text-terra" onClick={async () => { if (confirm("Delete everything on this device?")) { await db.clear(); resetCache(); location.href = `${BASE}/`; } }}><Icon name="trash" size={16} /> Delete all</button>
          </div>
        </section>
      </div>
    </>
  );
}
