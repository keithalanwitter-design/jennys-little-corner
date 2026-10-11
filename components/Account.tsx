"use client";
import { useEffect, useState } from "react";
import { supabaseConfigured, sb } from "@/lib/supabase";
import { onSyncStatus, signInWithEmail, signOut, pullMerge } from "@/lib/sync";
import { enablePush, disablePush, pushStatus, pushSupported } from "@/lib/push";
import { peek, replaceData, migrateData } from "@/lib/store";
import { Icon } from "./Icons";

export default function Account() {
  const [st, setSt] = useState<{ state: string; email?: string; at?: string; error?: string }>({ state: "local" });
  const [email, setEmail] = useState(""), [sent, setSent] = useState(false), [err, setErr] = useState(""), [push, setPush] = useState(false), [busy, setBusy] = useState(false);
  useEffect(() => onSyncStatus(setSt), []);
  useEffect(() => { pushStatus().then(setPush); }, [st.email]);
  if (!supabaseConfigured) return (
    <section className="card lg:col-span-2">
      <h2 className="h2 mb-1">Account & sync</h2>
      <p className="text-sm text-muted">Sync, the AI coach and closed-app reminders aren&apos;t connected yet. Everything works on this device without an account. (Setup steps are in <code>SETUP.md</code>.)</p>
    </section>);
  const signedIn = !!st.email;
  return (
    <section className="card lg:col-span-2">
      <div className="mb-3 flex items-center justify-between"><h2 className="h2">Account & sync</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.state === "synced" ? "bg-sage/20 text-moss" : st.state === "error" ? "bg-clay/15 text-terra" : "bg-surface-2 text-muted"}`}>{signedIn ? (st.state === "synced" ? "Synced" : st.state === "syncing" ? "Syncing…" : st.state === "error" ? "Sync issue" : "Signed in") : "On this device only"}</span></div>
      {!signedIn ? (sent ? <p className="rounded-2xl bg-sage/15 p-3 text-sm">Check <b>{email}</b> for a magic link. Open it on this device to sign in. Your current data will merge in, nothing is lost.</p> : (
        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); setErr(""); try { await signInWithEmail(email); setSent(true); } catch (x) { setErr((x as Error).message); } }}>
          <input className="input" type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /><button className="btn !px-4">Send link</button>
        </form>)) : (
        <div className="space-y-3">
          <p className="text-sm">Signed in as <b>{st.email}</b>{st.at && <span className="text-muted"> · last synced {new Date(st.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>}</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-soft" onClick={() => pullMerge(peek, replaceData, migrateData)}><Icon name="sparkle" size={16} /> Sync now</button>
            {pushSupported() && <button className={push ? "btn-soft" : "btn"} disabled={busy} onClick={async () => { setBusy(true); setErr(""); try { if (push) { await disablePush(); setPush(false); } else { await enablePush(); setPush(true); } } catch (x) { setErr((x as Error).message); } setBusy(false); }}><Icon name="bell" size={16} /> {push ? "Turn off closed-app reminders" : "Get reminders even when closed"}</button>}
            {push && <button className="btn-soft" onClick={async () => { const { error } = await sb()!.functions.invoke("push-send", { body: { test: true } }); setErr(error ? error.message : "Test sent 💛"); }}>Send test push</button>}
            <button className="btn-soft !text-terra" onClick={signOut}>Sign out</button>
          </div>
        </div>)}
      {(err || st.error) && <p className="mt-2 text-sm text-terra">{err || st.error}</p>}
      <p className="mt-3 text-xs text-muted">Your data stays on this device first. When you&apos;re signed in, a private copy syncs to your account (only you can read it), so it works across your phone and computer.</p>
    </section>);
}
