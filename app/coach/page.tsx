"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useData, uid, today, ymd } from "@/lib/store";
import { PageHeader, Loading } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { Calf } from "@/components/Brand";
import { localReply, remoteReply, coachAvailable, pantryFrom } from "@/lib/coach";
import { aisleOf } from "@/lib/recipes";
import { recipes } from "@/lib/recipes";
import type { ChatMsg } from "@/lib/types";
import { coachPrompts } from "@/components/CoachChips";
import { useRef as useRef2 } from "react";

const md = (t: string) => t.split("\n").map((line, i) => <p key={i} className={line.startsWith("•") || /^\d\./.test(line) ? "pl-1" : ""} dangerouslySetInnerHTML={{ __html: line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") || "&nbsp;" }} />);

export default function Coach() {
  const { data, update } = useData();
  const [q, setQ] = useState(""), [busy, setBusy] = useState(false), [live, setLive] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const asked = useRef2(false); const sendRef = useRef2<(t: string) => void>(() => {});
  useEffect(() => { coachAvailable().then(setLive); }, []);
  useEffect(() => { if (!data || asked.current) return; const p = new URLSearchParams(location.search).get("q"); if (p) { asked.current = true; history.replaceState(null, "", location.pathname); sendRef.current(p); } });
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [data?.chat.length, busy]);
  if (!data) return <Loading />;
  const send = async (text: string) => {
    if (!text.trim() || busy) return; setQ("");
    const items = pantryFrom(text);
    const user: ChatMsg = { id: uid(), role: "user", text, at: new Date().toISOString() };
    let snapshot = data;
    update((d) => { snapshot = { ...d, chat: [...d.chat, user], pantry: items.length ? [...new Set([...d.pantry, ...items])] : d.pantry }; return snapshot; });
    setBusy(true);
    const reply = (live && (await remoteReply(snapshot, snapshot.chat))) || localReply(snapshot, text, snapshot.chat);
    await new Promise((r) => setTimeout(r, live ? 0 : 450));
    update((d) => ({ ...d, chat: [...d.chat, reply].slice(-60) })); setBusy(false);
  };
  // eslint-disable-next-line react-hooks/refs -- latest send for the ?q= deep-link effect
  sendRef.current = send;
  const act = (a: NonNullable<ChatMsg["actions"]>[number]) => a.kind === "link" ? undefined : update((d) => {
    if (a.kind === "grocery") { const have = new Set(d.grocery.map((g) => g.name.toLowerCase())); return { ...d, grocery: [...d.grocery, ...a.payload.filter((n) => !have.has(n.toLowerCase())).map((name) => ({ id: uid(), name, aisle: aisleOf(name), checked: false }))], chat: [...d.chat, { id: uid(), role: "assistant", text: `Added ${a.payload.length} item${a.payload.length > 1 ? "s" : ""} to your grocery list 🛒`, at: new Date().toISOString() }] }; }
    const r = recipes.find((x) => x.id === a.payload[0]); if (!r) return d;
    const slot = r.style === "Breakfast" ? "breakfast" : r.style === "Snack" ? "snack" : r.style === "Lunch" ? "lunch" : "dinner";
    return { ...d, mealPlan: { ...d.mealPlan, [today()]: { ...d.mealPlan[ymd(new Date())], [slot]: r.id } }, chat: [...d.chat, { id: uid(), role: "assistant", text: `Planned **${r.title}** for ${slot} today ✓`, at: new Date().toISOString() }] };
  });
  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      <PageHeader eyebrow="Coach" title="Ask me anything" sub="Meals, groceries, movement and supplements explained. Never medical advice." right={data.chat.length > 0 ? <button className="chip !text-xs" onClick={() => update((d) => ({ ...d, chat: [] }))}>Clear</button> : undefined} />
      {!live && (
        <div className="card mb-4 flex items-start gap-3 !bg-gradient-to-br from-honey/20 to-sky/15 !p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-clay"><Icon name="sparkle" size={18} /></span>
          <div className="text-sm"><b>AI coach not connected yet.</b> I&apos;m using smart local suggestions from your fridge, goals and avoid list. Everything still works on this device. <Link href="/settings" className="font-bold text-clay underline">Sign in</Link> once sync is set up to unlock the full AI coach.</div>
        </div>)}
      <div className="flex-1 space-y-3">
        {data.chat.length === 0 && (
          <div className="flex flex-col items-center py-6 text-center"><div className="animate-floaty"><Calf size={96} /></div><p className="mt-3 max-w-xs font-display text-xl font-semibold">Hi{data.profile.name ? ` ${data.profile.name}` : ""}! What can I help with today?</p></div>)}
        <AnimatePresence initial={false}>
          {data.chat.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] space-y-1 rounded-[22px] px-4 py-3 text-[15px] leading-relaxed ${m.role === "user" ? "rounded-br-md text-white" : "rounded-bl-md bg-surface ring-1 ring-line"}`} style={m.role === "user" ? { background: "linear-gradient(135deg,var(--clay),var(--terra))" } : undefined}>
                {md(m.text)}
                {m.actions && <div className="flex flex-wrap gap-1.5 pt-2">{m.actions.map((a) => a.kind === "link" ? <Link key={a.label} href={a.payload[0]} className="chip !text-xs"><Icon name="skip" size={13} /> {a.label}</Link> : <button key={a.label} className="chip !text-xs" onClick={() => act(a)}><Icon name={a.kind === "grocery" ? "cart" : "calendar"} size={13} /> {a.label}</button>)}</div>}
              </div>
            </motion.div>))}
        </AnimatePresence>
        {busy && <div className="flex gap-1 px-4">{[0, 1, 2].map((i) => <motion.span key={i} className="h-2 w-2 rounded-full bg-muted" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />)}</div>}
        <div ref={end} />
      </div>
      <div className="sticky bottom-24 mt-4 lg:bottom-4">
        <div className="no-scrollbar -mx-4 mb-2 flex gap-1.5 overflow-x-auto px-4">{coachPrompts("coach", data).map((s) => <button key={s} className="chip !text-xs" onClick={() => send(s)}>{s}</button>)}</div>
        <form className="flex gap-2 rounded-[26px] bg-surface/90 p-1.5 ring-1 ring-line backdrop-blur" onSubmit={(e) => { e.preventDefault(); send(q); }}>
          <input className="flex-1 bg-transparent px-3 outline-none placeholder:text-muted/70" placeholder='Try "I have eggs, spinach and chicken"' value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn !rounded-full !px-4 !py-2.5" aria-label="send" disabled={busy}><Icon name="skip" size={18} /></button>
        </form>
      </div>
    </div>
  );
}
