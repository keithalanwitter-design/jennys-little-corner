"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useData, getLog, setLog, today, addWin, weekMinutes } from "@/lib/store";
import { Scene, WaterGlass, Ring, Calf, Wordmark } from "@/components/Brand";
import { Icon } from "@/components/Icons";
import { Loading, Stagger, Item, Scale } from "@/components/ui";
import { moods } from "@/lib/content";
import { recipes } from "@/lib/recipes";

type Phase = "morning" | "afternoon" | "evening" | "night";
const phaseOf = (h: number): Phase => (h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night");
const greet = { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Hello, night owl" };
const notes = ["Rest is productive too.", "You're allowed to take up space.", "Small and steady still gets there.", "Drink some water and unclench your jaw. 💛", "You're doing better than you think."];
const suggestions: Record<string, { t: string; href: string; icon: string }[]> = {
  drained: [{ t: "5-minute Calm Circulation bounce", href: "/move", icon: "move" }, { t: "4-7-8 breathing, 2 minutes", href: "/unwind", icon: "moon" }, { t: "Pick a 5-minute Jenny Time idea", href: "/unwind", icon: "heart" }],
  busy: [{ t: "Grab a 5-minute breakfast", href: "/nourish", icon: "nourish" }, { t: "Back & Shoulder Melt", href: "/move", icon: "leaf" }, { t: "Ask for a hand with dinner", href: "/unwind", icon: "heart" }],
  okay: [{ t: "10-minute Sunrise Flow", href: "/move", icon: "move" }, { t: "Plan this week's dinners", href: "/nourish", icon: "calendar" }, { t: "Write three good things", href: "/journal", icon: "journal" }],
  good: [{ t: "15-minute Heart Glow Intervals", href: "/move", icon: "flame" }, { t: "Batch-prep for the week", href: "/nourish", icon: "pot" }, { t: "Hip Opening flow", href: "/move", icon: "leaf" }],
  spark: [{ t: "Kitchen Dance Party", href: "/move", icon: "sparkle" }, { t: "Try a new recipe", href: "/nourish", icon: "nourish" }, { t: "Touch-Your-Toes Journey", href: "/move", icon: "leaf" }],
};

export default function Today() {
  const { data, update } = useData();
  const [hour, setHour] = useState(9);
  useEffect(() => setHour(new Date().getHours()), []);
  if (!data) return <Loading />;
  const p = data.profile, log = getLog(data), phase = phaseOf(hour);
  const wTarget = p.waterTargetOz ?? 80, pTarget = p.proteinTargetG ?? 100, mTarget = p.moveTargetMin ?? 150;
  const wk = weekMinutes(data);
  const mood = moods.find((m) => m.id === log.mood);
  const plan = data.mealPlan[today()] ?? {};
  const planned = (Object.entries(plan) as [string, string][]).map(([slot, id]) => ({ slot, r: recipes.find((r) => r.id === id) })).filter((x) => x.r);
  const dueSupps = data.supplements.flatMap((s) => s.times.map((t) => ({ s, t }))).filter(({ s, t }) => !data.suppLogs.some((l) => l.date === today() && l.suppId === s.id && l.time === t));
  const todaysWins = data.wins.filter((w) => w.date === today());
  const note = notes[new Date().getDate() % notes.length];
  const addWater = (oz: number) => update((d) => { const n = Math.max(0, getLog(d).waterOz + oz); let x = setLog(d, { waterOz: n }); if (p.waterTargetOz && n >= p.waterTargetOz) x = addWin(x, "Reached my water goal", "water"); return x; });
  const addProtein = (g: number) => update((d) => { const n = Math.max(0, getLog(d).proteinG + g); let x = setLog(d, { proteinG: n }); if (p.proteinTargetG && n >= p.proteinTargetG) x = addWin(x, "Hit my protein goal", "protein"); return x; });

  return (
    <Stagger className="space-y-4">
      <Item className="flex items-center justify-between lg:hidden"><Wordmark /><Link href="/settings" aria-label="settings" className="rounded-full bg-surface p-2.5 ring-1 ring-line"><Icon name="settings" size={18} /></Link></Item>

      <Item>
        <section className="relative overflow-hidden rounded-[32px] ring-1 ring-line" style={{ minHeight: 210 }}>
          <Scene phase={phase} />
          <div className={`relative p-6 ${phase === "night" ? "text-white" : "text-[#3b332c]"}`}>
            <div className="eyebrow !text-current opacity-70">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
            <h1 className="mt-1 font-display text-[34px] font-semibold leading-[1.05] tracking-tight">{greet[phase]}{p.name ? `, ${p.name}` : ""}.</h1>
            <p className="mt-2 max-w-[18rem] text-[15px] font-medium opacity-80">{mood ? mood.msg : "Your day doesn't have to be perfect. Find one little thing that feels right."}</p>
          </div>
        </section>
      </Item>

      {!p.onboarded && (
        <Item><Link href="/onboarding" className="card flex items-center gap-4 !bg-gradient-to-br from-honey/30 to-clay/20">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface text-clay"><Icon name="sparkle" /></div>
          <div className="flex-1"><div className="font-display text-lg font-semibold">Make it yours</div><div className="text-sm text-muted">Set your own goals in 2 minutes. Everything is skippable.</div></div><Icon name="skip" size={16} />
        </Link></Item>
      )}

      <Item>
        <section className="card">
          <div className="mb-3 flex items-baseline justify-between"><h2 className="h2">How are you, really?</h2><span className="text-xs font-semibold text-muted">optional</span></div>
          <div className="grid grid-cols-5 gap-1.5">{moods.map((m) => (
            <motion.button whileTap={{ scale: 0.93 }} key={m.id} onClick={() => update((d) => setLog(d, { mood: log.mood === m.id ? undefined : m.id }))}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-center text-[10.5px] font-bold leading-tight ring-1 transition ${log.mood === m.id ? "bg-gradient-to-br from-sage to-moss text-white ring-transparent" : "bg-surface-2/70 ring-line"}`}>
              <span className="text-2xl">{m.emoji}</span>{m.label}</motion.button>
          ))}</div>
          <div className="mt-4 grid gap-x-6 md:grid-cols-2">
            <Scale label="Energy" value={hour < 15 ? log.energyAm : log.energyPm} onChange={(n) => update((d) => setLog(d, hour < 15 ? { energyAm: n } : { energyPm: n }))} low="running on empty" high="bright" />
            <Scale label="Stress" value={log.stress} onChange={(n) => update((d) => setLog(d, { stress: n }))} low="calm" high="a lot" colors={["var(--sage)", "var(--sage)", "var(--honey)", "var(--clay)", "var(--plum)"]} />
          </div>
        </section>
      </Item>

      <Item className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <section className="card col-span-2 flex items-center gap-4 lg:col-span-1">
          <WaterGlass pct={log.waterOz / wTarget} size={118} />
          <div className="flex-1">
            <div className="eyebrow">Hydration</div>
            <div className="font-display text-4xl font-semibold leading-none">{log.waterOz}<span className="text-lg text-muted"> oz</span></div>
            <div className="mt-1 text-xs font-semibold text-muted">{p.waterTargetOz ? `of ${p.waterTargetOz} oz` : "just noticing"}</div>
            <div className="mt-3 flex gap-2">
              <motion.button whileTap={{ scale: 0.92 }} className="btn flex-1 !px-3 !py-2.5" style={{ background: "linear-gradient(135deg,#8fb2c6,#5e93b0)" }} onClick={() => addWater(16)}>+16oz</motion.button>
              <button className="btn-soft !px-3" aria-label="undo water" onClick={() => addWater(-16)}>↶</button>
            </div>
          </div>
        </section>
        <section className="card flex flex-col items-center text-center">
          <Ring pct={log.proteinG / pTarget} size={104} color="var(--clay)"><div><div className="font-display text-2xl font-semibold leading-none">{log.proteinG}g</div><div className="text-[10px] font-bold text-muted">protein</div></div></Ring>
          <div className="mt-2 text-xs text-muted">{p.proteinTargetG ? `of ${p.proteinTargetG}g` : "so far today"}</div>
          <div className="mt-2 flex w-full gap-1.5"><motion.button whileTap={{ scale: 0.92 }} className="btn flex-1 !px-2 !py-2" onClick={() => addProtein(20)}>+20g</motion.button><button className="btn-soft !px-2.5" aria-label="undo protein" onClick={() => addProtein(-20)}>↶</button></div>
        </section>
        <Link href="/move" className="card flex flex-col items-center text-center">
          <Ring pct={wk / mTarget} size={104} color="var(--sage)"><div><div className="font-display text-2xl font-semibold leading-none">{wk}</div><div className="text-[10px] font-bold text-muted">min / week</div></div></Ring>
          <div className="mt-2 text-xs text-muted">movement</div>
          <div className="btn-sage mt-2 w-full !py-2 text-sm">Move</div>
        </Link>
      </Item>

      <Item className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["/move", "Move a little", "move", "from-clay/90 to-terra"], ["/unwind", "Recharge", "heart", "from-plum/90 to-blush"], ["/nourish", "Nourish", "nourish", "from-sage to-moss"], ["/unwind", "Unwind", "moon", "from-sky to-[#5e7f95]"]].map(([h, l, i, g]) => (
          <Link key={l} href={h} className={`relative overflow-hidden rounded-[24px] bg-gradient-to-br ${g} p-4 text-white shadow-[0_10px_24px_-14px_rgba(80,50,30,.6)] transition active:scale-[.97]`}>
            <Icon name={i} size={26} /><div className="mt-6 font-display text-lg font-semibold">{l}</div>
            <svg className="absolute -bottom-6 -right-6 opacity-20" width="90" height="90" viewBox="0 0 90 90"><circle cx="45" cy="45" r="44" fill="#fff" /></svg>
          </Link>
        ))}
      </Item>

      <Item>
        <section className="card">
          <h2 className="h2 mb-3">{mood ? "Ideas for how you feel" : "A few gentle ideas"}</h2>
          <div className="space-y-2">{(suggestions[log.mood ?? "okay"]).map((s) => (
            <Link key={s.t} href={s.href} className="flex items-center gap-3 rounded-2xl bg-surface-2/60 p-3 ring-1 ring-line transition hover:bg-surface-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface text-clay"><Icon name={s.icon} size={20} /></span><span className="flex-1 font-semibold">{s.t}</span><Icon name="skip" size={14} className="text-muted" />
            </Link>))}</div>
        </section>
      </Item>

      <Item className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <div className="mb-2 flex items-center justify-between"><h2 className="h2">Today&apos;s plate</h2><Link href="/nourish" className="text-sm font-bold text-clay">Plan →</Link></div>
          {planned.length ? <ul className="space-y-2">{planned.map(({ slot, r }) => <li key={slot} className="flex items-center justify-between rounded-2xl bg-surface-2/60 p-3"><div><div className="eyebrow">{slot}</div><div className="font-semibold">{r!.title}</div></div><span className="text-sm font-bold text-clay">{r!.protein}g</span></li>)}</ul>
            : <p className="text-sm text-muted">Nothing planned yet. Pick meals for the week in Nourish, or grab a quick high-protein idea.</p>}
        </section>
        <section className="card">
          <div className="mb-2 flex items-center justify-between"><h2 className="h2">Supplements</h2><Link href="/supplements" className="text-sm font-bold text-clay">All →</Link></div>
          {data.supplements.length === 0 ? <p className="text-sm text-muted">Add your own supplements and when you take them.</p>
            : dueSupps.length === 0 ? <p className="font-semibold text-moss">All done for today ✓</p>
            : <ul className="space-y-2">{dueSupps.slice(0, 3).map(({ s, t }) => (
              <li key={s.id + t} className="flex items-center justify-between rounded-2xl bg-surface-2/60 p-3"><span><b>{s.name}</b> <span className="text-sm text-muted">· {t}</span></span>
                <button className="chip" onClick={() => update((d) => ({ ...d, suppLogs: [...d.suppLogs, { date: today(), suppId: s.id, time: t }] }))}><Icon name="check" size={14} /> Took it</button></li>))}</ul>}
        </section>
      </Item>

      <Item>
        <section className="card flex items-center gap-4 overflow-hidden !bg-gradient-to-br from-blush/40 to-honey/30">
          <div className="animate-floaty"><Calf size={84} /></div>
          <div className="flex-1">
            <div className="eyebrow">Little note</div>
            <p className="font-display text-lg font-semibold leading-snug">{note}</p>
            {todaysWins.length > 0 && <p className="mt-1 text-sm text-muted">{todaysWins.length} little win{todaysWins.length > 1 ? "s" : ""} today 🌱</p>}
          </div>
        </section>
      </Item>
    </Stagger>
  );
}
