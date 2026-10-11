"use client";
import { useState } from "react";
import Link from "next/link";
import { useData, resetCache } from "@/lib/store";
import { db } from "@/lib/db";
import { BASE } from "@/lib/base";
import { notify } from "@/lib/reminders";
import { H, Loading } from "@/components/ui";

export default function Settings() {
  const { data, update } = useData();
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  if (!data) return <Loading />;
  const ask = async () => { if (typeof Notification === "undefined") return; setPerm(await Notification.requestPermission()); };
  const exportData = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })); a.download = "little-corner-data.json"; a.click(); };
  return (
    <>
      <H sub="Gentle nudges, only the ones you want.">Settings ⚙️</H>
      <section className="card mb-4">
        <h2 className="mb-2 font-semibold">Reminders</h2>
        {perm !== "granted" ? (
          <div className="mb-3 text-sm">
            {perm === "unsupported" ? <p>This browser doesn&apos;t support notifications. On iPhone, add the app to your Home Screen first (Share, then Add to Home Screen).</p>
              : <button className="btn w-full" onClick={ask}>Allow notifications</button>}
          </div>
        ) : <button className="btn-soft mb-3 text-sm" onClick={() => notify("Little Corner", "Reminders are on. 💛")}>Send a test</button>}
        <ul className="space-y-2">{data.reminders.map((r) => (
          <li key={r.id} className="flex items-center gap-2">
            <input type="checkbox" checked={r.enabled} onChange={(e) => update((d) => ({ ...d, reminders: d.reminders.map((x) => x.id === r.id ? { ...x, enabled: e.target.checked } : x) }))} />
            <span className="flex-1 text-sm">{r.label}</span>
            <input type="time" className="rounded-lg border border-sand px-2" value={r.time} onChange={(e) => update((d) => ({ ...d, reminders: d.reminders.map((x) => x.id === r.id ? { ...x, time: e.target.value } : x) }))} />
          </li>))}</ul>
        <p className="mt-2 text-xs opacity-60">For now, reminders fire while the app is open or running in the background. Push notifications that arrive when it&apos;s closed are planned.</p>
      </section>
      <section className="card mb-4 space-y-2">
        <h2 className="font-semibold">You &amp; your data</h2>
        <Link className="btn-soft block text-center" href="/onboarding">Edit goals &amp; preferences</Link>
        <button className="btn-soft w-full" onClick={exportData}>Export my data</button>
        <button className="btn-soft w-full text-clay" onClick={async () => { if (confirm("Delete everything on this device?")) { await db.clear(); resetCache(); location.href = `${BASE}/`; } }}>Delete all my data</button>
        <p className="text-xs opacity-60">Everything stays on this device. Nothing is shared with anyone.</p>
      </section>
    </>
  );
}
