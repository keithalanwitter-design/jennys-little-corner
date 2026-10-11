"use client";
import CoachChips from "@/components/CoachChips";
import { useHashTab } from "@/lib/useHashTab";
import { useState } from "react";
import { motion } from "framer-motion";
import { useData, today, uid, addWin } from "@/lib/store";
import { PageHeader, Tabs, Loading } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { Calf, Sprig } from "@/components/Brand";
import { moods } from "@/lib/content";

const TABS = [{ id: "write", label: "Journal", icon: "journal" }, { id: "wins", label: "Little Wins", icon: "wins" }] as const;
type Tab = (typeof TABS)[number]["id"];
const prompts = ["What made you smile today?", "What's one thing your body did for you today?", "What are you looking forward to?", "What would make tomorrow 1% easier?", "Who made your day a little brighter?", "What do you want to let go of tonight?"];
const quickWins = ["Took a walk", "Drank my water", "Rested without guilt", "Tried a new recipe", "Stretched", "Bounced!", "Asked for help", "Went to bed on time"];

export default function Journal() {
  const { data, update } = useData();
  const [tab, setTab] = useHashTab<Tab>("write", TABS);
  const [text, setText] = useState(""), [g, setG] = useState(["", "", ""]), [mood, setMood] = useState<string>(), [win, setWin] = useState("");
  if (!data) return <Loading />;
  const prompt = prompts[new Date().getDate() % prompts.length];
  const save = () => { if (!text.trim() && !g.some((x) => x.trim())) return; update((d) => addWin({ ...d, journal: [{ id: uid(), date: today(), text: text.trim(), gratitude: g.map((x) => x.trim()).filter(Boolean), mood }, ...d.journal] }, "Wrote in my journal", "journal")); setText(""); setG(["", "", ""]); setMood(undefined); };
  const byKind = data.wins.reduce<Record<string, number>>((a, w) => ({ ...a, [w.kind]: (a[w.kind] ?? 0) + 1 }), {});
  const badges = [
    { id: "first", name: "First little win", icon: "🌱", got: data.wins.length >= 1 },
    { id: "ten", name: "10 little wins", icon: "🌿", got: data.wins.length >= 10 },
    { id: "move5", name: "Moved 5 times", icon: "🌀", got: data.workouts.length >= 5 },
    { id: "move60", name: "60 minutes moved", icon: "💪", got: data.workouts.reduce((a, w) => a + w.minutes, 0) >= 60 },
    { id: "water", name: "Hydration hero", icon: "💧", got: (byKind.water ?? 0) >= 1 },
    { id: "protein", name: "Protein power", icon: "🍳", got: (byKind.protein ?? 0) >= 1 },
    { id: "calm", name: "Found my breath", icon: "🫧", got: (byKind.calm ?? 0) >= 1 },
    { id: "journal", name: "Three good things", icon: "📖", got: data.journal.length >= 3 },
    { id: "care", name: "Me-time matters", icon: "💛", got: (byKind.selfcare ?? 0) >= 3 },
    { id: "chef", name: "Planned a week", icon: "🗓️", got: Object.keys(data.mealPlan).length >= 5 },
    { id: "favs", name: "Favorite five", icon: "♥", got: data.favorites.length >= 5 },
    { id: "rest", name: "Rest is a win", icon: "🌙", got: (byKind.sleep ?? 0) >= 1 },
  ];
  return (
    <>
      <PageHeader eyebrow="Journal & Wins" title="Notice the good" sub="Private, kind, no pressure. Gaps are totally fine." />
      <CoachChips page="journal" />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {tab === "write" ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <section className="card relative overflow-hidden">
              <Sprig className="absolute -right-2 -top-2 h-24 w-24 opacity-40" />
              <div className="eyebrow">Today&apos;s prompt</div>
              <p className="mb-3 mt-1 max-w-[85%] font-display text-xl font-semibold">{prompt}</p>
              <textarea className="input min-h-28 resize-none font-medium" placeholder="Write as much or as little as you like…" value={text} onChange={(e) => setText(e.target.value)} />
              <div className="mb-2 mt-4 font-bold">Three good things</div>
              {g.map((x, i) => <div key={i} className="mb-2 flex items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-honey/30 text-sm font-bold text-terra">{i + 1}</span><input className="input !py-2.5" value={x} onChange={(e) => setG(g.map((y, k) => (k === i ? e.target.value : y)))} placeholder={["A small moment", "Someone you're thankful for", "Something you did for you"][i]} /></div>)}
              <div className="my-3 flex flex-wrap gap-1.5">{moods.map((m) => <button key={m.id} className={mood === m.id ? "chip-on" : "chip"} onClick={() => setMood(mood === m.id ? undefined : m.id)}>{m.emoji} {m.label}</button>)}</div>
              <button className="btn w-full" onClick={save}>Save entry</button>
            </section>
            <section className="space-y-3">
              {data.journal.length === 0 ? <div className="card flex flex-col items-center text-center text-muted"><Calf size={80} /><p className="mt-2">Your entries will live here, only on this device.</p></div> :
                data.journal.slice(0, 12).map((j) => (
                  <article key={j.id} className="card p-4">
                    <div className="mb-1 flex items-center justify-between"><span className="eyebrow">{new Date(j.date + "T12:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                      <span className="flex items-center gap-2">{j.mood && <span>{moods.find((m) => m.id === j.mood)?.emoji}</span>}<button aria-label="delete" className="text-muted" onClick={() => update((d) => ({ ...d, journal: d.journal.filter((x) => x.id !== j.id) }))}><Icon name="trash" size={14} /></button></span></div>
                    {j.text && <p className="whitespace-pre-wrap text-[15px]">{j.text}</p>}
                    {j.gratitude.length > 0 && <ul className="mt-2 space-y-0.5 text-sm text-muted">{j.gratitude.map((x) => <li key={x}>✿ {x}</li>)}</ul>}
                  </article>))}
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <section className="card">
              <h3 className="h2 mb-2">Log a little win</h3>
              <div className="mb-3 flex flex-wrap gap-1.5">{quickWins.map((w) => <button key={w} className="chip" onClick={() => update((d) => addWin(d, w))}>+ {w}</button>)}</div>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (win.trim()) update((d) => addWin(d, win.trim())); setWin(""); }}><input className="input" placeholder="Something else you're proud of…" value={win} onChange={(e) => setWin(e.target.value)} /><button className="btn !px-4" aria-label="add"><Icon name="plus" /></button></form>
            </section>
            <section>
              <h3 className="h2 mb-3">Milestones</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">{badges.map((b) => (
                <motion.div key={b.id} whileHover={{ y: -2 }} className={`card flex flex-col items-center p-3 text-center ${b.got ? "" : "opacity-45 grayscale"}`}>
                  <div className={`grid h-14 w-14 place-items-center rounded-full text-2xl ${b.got ? "bg-gradient-to-br from-honey to-clay shadow-lg" : "bg-surface-2"}`}>{b.icon}</div>
                  <div className="mt-2 text-xs font-bold leading-tight">{b.name}</div>
                </motion.div>))}</div>
              <p className="mt-2 text-xs text-muted">Milestones only ever add up. Nothing resets or expires.</p>
            </section>
            <section className="card">
              <h3 className="h2 mb-2">Win jar · {data.wins.length}</h3>
              {data.wins.length === 0 ? <p className="text-sm text-muted">Every tiny thing counts. Add your first one above.</p> :
                <ul className="divide-y divide-line">{data.wins.slice(0, 20).map((w) => <li key={w.id} className="flex items-center justify-between py-2 text-[15px]"><span>🌱 {w.text}</span><span className="text-xs text-muted">{new Date(w.date + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></li>)}</ul>}
            </section>
          </div>
        )}
      </motion.div>
    </>
  );
}
