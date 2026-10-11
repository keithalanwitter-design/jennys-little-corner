"use client";
import CoachChips from "@/components/CoachChips";
import Link from "next/link";
import { useHashTab } from "@/lib/useHashTab";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useData, uid, ymd } from "@/lib/store";
import { PageHeader, Tabs, Sheet, Loading , Empty } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { recipes, consolidate, aisleOf, fmtQty, type Recipe } from "@/lib/recipes";
import { proteins, produce, carbsFats, sauces, proteinEst } from "@/lib/content";
import type { AppData, Slot } from "@/lib/types";

const TABS = [{ id: "plan", label: "Week", icon: "calendar" }, { id: "recipes", label: "Recipes", icon: "book" }, { id: "build", label: "Build", icon: "nourish" }, { id: "fridge", label: "Fridge", icon: "fridge" }, { id: "prep", label: "Prep", icon: "pot" }, { id: "grocery", label: "Grocery", icon: "cart" }] as const;
type Tab = (typeof TABS)[number]["id"];
const SLOTS: Slot[] = ["breakfast", "lunch", "dinner", "snack"];
const slotStyles: Record<Slot, string[]> = { breakfast: ["Breakfast"], lunch: ["Lunch", "Fridge Staple", "15-Min Dinner"], dinner: ["15-Min Dinner", "Family Style", "Fridge Staple"], snack: ["Snack"] };
const norm = (s: string) => s.toLowerCase().trim();
const STAPLES = /oil|salt|pepper$|seasoning|spice|honey|baking|soy sauce|garlic|ginger|dressing|sauce$/;
const weekDays = () => { const d = new Date(); const m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return Array.from({ length: 7 }, (_, i) => { const x = new Date(m); x.setDate(m.getDate() + i); return x; }); };

function useAvoid(data: AppData | null) {
  return useMemo(() => (data ? `${data.profile.avoid},${data.profile.allergies}`.split(",").map(norm).filter((x) => x && x !== "none") : []), [data]);
}

export default function Nourish() {
  const { data, update } = useData();
  const [tab, setTab] = useHashTab<Tab>("plan", TABS);
  const [open, setOpen] = useState<Recipe | null>(null);
  const avoid = useAvoid(data);
  if (!data) return <Loading />;
  const ok = (r: Recipe) => !avoid.some((a) => norm(r.title).includes(a) || r.ingredients.some((i) => norm(i.n).includes(a)));
  const pool = recipes.filter(ok);
  const fav = (id: string) => data.favorites.includes(id);
  const toggleFav = (id: string) => update((d) => ({ ...d, favorites: fav(id) ? d.favorites.filter((x) => x !== id) : [...d.favorites, id] }));
  const toGrocery = (items: { name: string; qty?: string }[]) => update((d) => {
    const have = new Set(d.pantry.map(norm)); const g = [...d.grocery];
    for (const it of items) { if (have.has(norm(it.name))) continue; const ex = g.find((x) => norm(x.name) === norm(it.name) && !x.checked); if (ex) { if (it.qty) ex.qty = ex.qty ? `${ex.qty} + ${it.qty}` : it.qty; } else g.push({ id: uid(), name: it.name, qty: it.qty, aisle: aisleOf(it.name), checked: false }); }
    return { ...d, grocery: g };
  });
  const props = { data, update, pool, fav, toggleFav, setOpen, toGrocery, ok };
  return (
    <>
      <PageHeader eyebrow="Nourish" title="Good food, less thinking" sub="Protein-forward and flexible. No food is good or bad here." />
      <CoachChips page="nourish" />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {tab === "plan" && <Planner {...props} />}
        {tab === "recipes" && <Recipes {...props} />}
        {tab === "build" && <Builder {...props} />}
        {tab === "fridge" && <Fridge {...props} />}
        {tab === "prep" && <Prep {...props} />}
        {tab === "grocery" && <Grocery {...props} />}
      </motion.div>
      <RecipeSheet r={open} onClose={() => setOpen(null)} {...props} />
    </>
  );
}
type P = { data: AppData; update: (f: (d: AppData) => AppData) => void; pool: Recipe[]; fav: (id: string) => boolean; toggleFav: (id: string) => void; setOpen: (r: Recipe | null) => void; toGrocery: (i: { name: string; qty?: string }[]) => void; ok: (r: Recipe) => boolean };

function Macro({ r }: { r: Recipe }) {
  return <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
    <span className="rounded-full bg-clay/15 px-2 py-0.5 text-terra">{r.protein}g protein</span>
    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">{r.carbs}c · {r.fat}f</span>
    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">{r.minutes} min</span>
  </div>;
}
function Thumb({ r, size = 56 }: { r: Recipe; size?: number }) {
  const hues: Record<string, string> = { Breakfast: "from-honey to-clay", Lunch: "from-sage to-moss", "15-Min Dinner": "from-clay to-terra", "Family Style": "from-terra to-plum", "Fridge Staple": "from-sky to-sage", Snack: "from-blush to-honey" };
  const em: Record<string, string> = { Breakfast: "🍳", Lunch: "🥗", "15-Min Dinner": "🍤", "Family Style": "🍲", "Fridge Staple": "🫙", Snack: "🥜" };
  return <div className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${hues[r.style]}`} style={{ width: size, height: size, fontSize: size * 0.45 }}>{em[r.style]}</div>;
}
function RecipeRow({ r, fav, toggleFav, onClick, extra, draggable }: { r: Recipe; fav: boolean; toggleFav: () => void; onClick: () => void; extra?: React.ReactNode; draggable?: boolean }) {
  return (
    <div className="card flex gap-3 p-3.5" draggable={draggable} onDragStart={(e) => e.dataTransfer.setData("text/recipe", r.id)}>
      <button onClick={onClick}><Thumb r={r} /></button>
      <button onClick={onClick} className="min-w-0 flex-1 text-left">
        <div className="eyebrow !text-[10px]">{r.style}</div>
        <div className="truncate font-display text-[17px] font-semibold">{r.title}</div>
        <div className="mt-1"><Macro r={r} /></div>
        {extra}
      </button>
      <button onClick={toggleFav} aria-label="favorite" className={`self-start rounded-full p-2 ${fav ? "text-terra" : "text-muted"}`}><svg width="20" height="20" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg></button>
    </div>
  );
}

function Planner({ data, update, pool, setOpen, toGrocery, fav }: P) {
  const days = weekDays();
  const [pick, setPick] = useState<{ date: string; slot: Slot } | null>(null);
  const [q, setQ] = useState("");
  const assign = (date: string, slot: Slot, id?: string) => update((d) => ({ ...d, mealPlan: { ...d.mealPlan, [date]: { ...d.mealPlan[date], [slot]: id } } }));
  const autofill = () => update((d) => {
    const mp = { ...d.mealPlan }; const used = new Set<string>();
    const favFirst = (xs: Recipe[]) => [...xs].sort((a, b) => +d.favorites.includes(b.id) - +d.favorites.includes(a.id) + (Math.random() - 0.5));
    for (const day of days) { const k = ymd(day); const cur = { ...mp[k] };
      for (const s of SLOTS) { if (cur[s]) continue; const opts = favFirst(pool.filter((r) => slotStyles[s].includes(r.style) && r.minutes <= Math.max(d.profile.cookMinutes, 15) + 10)); const r = opts.find((x) => !used.has(x.id)) ?? opts[0]; if (r) { cur[s] = r.id; used.add(r.id); } }
      mp[k] = cur; }
    return { ...d, mealPlan: mp };
  });
  const planned = days.flatMap((day) => SLOTS.map((s) => data.mealPlan[ymd(day)]?.[s]).filter(Boolean) as string[]);
  const weekProtein = (k: string) => SLOTS.reduce((a, s) => a + (recipes.find((r) => r.id === data.mealPlan[k]?.[s])?.protein ?? 0), 0);
  const people = data.profile.family ? data.profile.householdSize : 1;
  const sendWeek = () => { const counts = new Map<string, number>(); planned.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    toGrocery(consolidate([...counts].map(([id, n]) => { const r = recipes.find((x) => x.id === id)!; return { recipe: r, servings: n * (r.style === "Breakfast" || r.style === "Snack" ? 1 : people) }; })).map((i) => ({ name: i.n, qty: `${fmtQty(i.q)} ${i.u}` }))); };
  const list = pool.filter((r) => (!pick || slotStyles[pick.slot].includes(r.style) || q) && r.title.toLowerCase().includes(q.toLowerCase())).sort((a, b) => +fav(b.id) - +fav(a.id));
  const todayK = ymd(new Date());
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <button className="btn" onClick={autofill}><Icon name="sparkle" size={18} /> Fill empty slots</button>
        <button className="btn-soft" onClick={sendWeek} disabled={!planned.length}><Icon name="cart" size={18} /> Week → grocery</button>
        <button className="btn-soft" onClick={() => update((d) => { const mp = { ...d.mealPlan }; days.forEach((x) => delete mp[ymd(x)]); return { ...d, mealPlan: mp }; })}>Clear week</button>
      </div>
      <p className="mb-3 text-xs text-muted">Tap a slot to choose a meal. On a computer you can also drag recipes from the Recipes tab or the shelf below onto a slot.</p>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0">
        {days.map((day) => { const k = ymd(day); const isToday = k === todayK; return (
          <div key={k} className={`card w-[78%] shrink-0 snap-center p-3.5 sm:w-[46%] lg:w-auto ${isToday ? "ring-2 !ring-clay" : ""}`}>
            <div className="mb-2 flex items-baseline justify-between"><div><div className="eyebrow">{day.toLocaleDateString(undefined, { weekday: "short" })}</div><div className="font-display text-2xl font-semibold leading-none">{day.getDate()}</div></div><span className="text-xs font-bold text-terra">{weekProtein(k) ? `${weekProtein(k)}g` : ""}</span></div>
            <div className="space-y-1.5">{SLOTS.map((s) => { const r = recipes.find((x) => x.id === data.mealPlan[k]?.[s]); return (
              <div key={s} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData("text/recipe"); if (id) assign(k, s, id); }}
                className={`group rounded-xl p-2 text-left text-xs transition ${r ? "bg-surface-2/80" : "border border-dashed border-line"}`}>
                <div className="flex items-center justify-between"><span className="font-bold capitalize text-muted">{s}</span>{r && <button aria-label="remove" onClick={() => assign(k, s, undefined)} className="text-muted"><Icon name="x" size={12} /></button>}</div>
                <button className="w-full text-left" onClick={() => r ? setOpen(r) : (setPick({ date: k, slot: s }), setQ(""))}>{r ? <span className="line-clamp-2 font-semibold text-ink">{r.title}</span> : <span className="text-muted">+ add</span>}</button>
              </div>); })}</div>
          </div>); })}
      </div>
      <h3 className="h2 mb-2 mt-5">Favorites shelf</h3>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {(data.favorites.length ? pool.filter((r) => fav(r.id)) : pool.slice(0, 8)).map((r) => (
          <button key={r.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/recipe", r.id)} onClick={() => setOpen(r)} className="chip !py-2"><span>{r.title}</span></button>))}
      </div>
      <Sheet open={!!pick} onClose={() => setPick(null)} title={pick ? `Choose ${pick.slot}` : ""}>
        <input className="input mb-3" placeholder="Search all recipes…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="space-y-2">{list.slice(0, 30).map((r) => (
          <button key={r.id} onClick={() => { assign(pick!.date, pick!.slot, r.id); setPick(null); }} className="flex w-full items-center gap-3 rounded-2xl bg-surface-2/60 p-2.5 text-left ring-1 ring-line">
            <Thumb r={r} size={44} /><div className="flex-1"><div className="font-semibold">{fav(r.id) ? "♥ " : ""}{r.title}</div><div className="text-xs text-muted">{r.protein}g protein · {r.minutes} min</div></div>
          </button>))}</div>
      </Sheet>
    </>
  );
}

const FILTERS = ["quick", "meal-prep", "vegetarian", "gluten-free", "low-carb", "family", "freezer-friendly", "no-cook", "high-fiber", "omega-3"];
function Recipes({ pool, fav, toggleFav, setOpen }: P) {
  const [q, setQ] = useState(""), [style, setStyle] = useState("All"), [tags, setTags] = useState<string[]>([]), [sort, setSort] = useState("protein"), [onlyFav, setOnlyFav] = useState(false);
  const list = pool.filter((r) => (style === "All" || r.style === style) && tags.every((t) => r.tags.includes(t)) && (!onlyFav || fav(r.id)) && (r.title + r.ingredients.map((i) => i.n).join(" ")).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === "protein" ? b.protein - a.protein : sort === "time" ? a.minutes - b.minutes : b.protein / b.kcal - a.protein / a.kcal);
  return (
    <>
      <div className="relative mb-3"><input className="input !pl-11" placeholder="Search recipes or ingredients…" value={q} onChange={(e) => setQ(e.target.value)} /><Icon name="book" size={18} className="absolute left-4 top-3.5 text-muted" /></div>
      <div className="no-scrollbar -mx-4 mb-2 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        <button className={onlyFav ? "chip-on" : "chip"} onClick={() => setOnlyFav(!onlyFav)}>♥ Favorites</button>
        {["All", "Breakfast", "Lunch", "15-Min Dinner", "Family Style", "Fridge Staple", "Snack"].map((s) => <button key={s} className={style === s ? "chip-on" : "chip"} onClick={() => setStyle(s)}>{s}</button>)}
      </div>
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {FILTERS.map((t) => <button key={t} className={`${tags.includes(t) ? "chip-on" : "chip"} !text-xs`} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</button>)}
      </div>
      <div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold text-muted">{list.length} recipes</span>
        <select className="rounded-xl bg-surface px-3 py-1.5 font-semibold ring-1 ring-line" value={sort} onChange={(e) => setSort(e.target.value)}><option value="protein">Most protein</option><option value="time">Quickest</option><option value="density">Protein per calorie</option></select></div>
      <div className="grid gap-3 md:grid-cols-2">{list.map((r) => <RecipeRow key={r.id} r={r} fav={fav(r.id)} toggleFav={() => toggleFav(r.id)} onClick={() => setOpen(r)} draggable />)}</div>
      <p className="mt-4 text-xs text-muted">Macros are rough per-serving estimates.</p>
    </>
  );
}

function Builder({ toGrocery }: P) {
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  const [m, setM] = useState({ p: "Chicken breast", v: "Roasted broccoli", c: "Sweet potato", s: "Chimichurri" });
  const rows = [["p", "Protein", proteins, "var(--clay)"], ["v", "Produce", produce, "var(--sage)"], ["c", "Carb or fat", carbsFats, "var(--honey)"], ["s", "Sauce", sauces, "var(--plum)"]] as const;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="card flex min-w-0 flex-col items-center">
        <svg viewBox="0 0 220 220" className="w-full max-w-[260px]" aria-label="plate">
          <circle cx="110" cy="110" r="104" fill="var(--surface-2)" /><circle cx="110" cy="110" r="88" fill="var(--surface)" stroke="var(--line)" />
          <path d="M110 110 L110 26 A84 84 0 0 1 110 194 Z" fill="var(--sage)" opacity=".85" />
          <path d="M110 110 L110 194 A84 84 0 0 1 26 110 Z" fill="var(--honey)" opacity=".85" />
          <path d="M110 110 L26 110 A84 84 0 0 1 110 26 Z" fill="var(--clay)" opacity=".85" />
          <text x="150" y="112" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">PRODUCE</text>
          <text x="72" y="152" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">CARB/FAT</text>
          <text x="72" y="78" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">PROTEIN</text>
          <circle cx="190" cy="44" r="16" fill="var(--plum)" opacity=".85" />
        </svg>
        <p className="mt-2 text-center text-xs text-muted">About half produce, a quarter protein, a quarter carbs or fats, and a sauce for joy (inspired by the Harvard Healthy Eating Plate).</p>
      </section>
      <section className="card min-w-0">
        {rows.map(([k, l, opts, c]) => (
          <div key={k} className="mb-3">
            <div className="mb-1.5 flex items-center gap-2 text-sm font-bold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{l}</div>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">{(opts as readonly string[]).map((o) => <button key={o} className={m[k] === o ? "chip-on" : "chip"} onClick={() => setM({ ...m, [k]: o })}>{o}</button>)}</div>
          </div>))}
        <motion.div key={JSON.stringify(m)} initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="my-3 rounded-3xl bg-gradient-to-br from-honey/25 to-clay/20 p-4 text-center">
          <div className="font-display text-xl font-semibold">{m.p} with {m.v.toLowerCase()} & {m.c.toLowerCase()}</div>
          <div className="text-sm text-muted">drizzled with {m.s.toLowerCase()} · ~{proteinEst[m.p] ?? 25}g protein</div>
        </motion.div>
        <div className="flex gap-2">
          <button className="btn-soft flex-1" onClick={() => setM({ p: pick(proteins), v: pick(produce), c: pick(carbsFats), s: pick(sauces) })}>🎲 Surprise me</button>
          <button className="btn flex-1" onClick={() => toGrocery([m.p, m.v, m.c, m.s].map((name) => ({ name })))}>Add to grocery</button>
        </div>
      </section>
    </div>
  );
}

function scoreRecipe(r: Recipe, pantry: string[], fav: boolean, cookMin: number) {
  const has = (n: string) => pantry.some((p) => { const a = norm(n), b = norm(p); return a.includes(b) || b.includes(a) || a.split(" ").some((w) => w.length > 3 && b.includes(w)); });
  let tot = 0, got = 0; const have: string[] = [], need: string[] = [];
  for (const i of r.ingredients) { const staple = STAPLES.test(i.n); const isP = /chicken|turkey|beef|steak|pork|salmon|shrimp|cod|tuna|tofu|egg|yogurt|cottage|beans|lentil|chickpea|edamame/.test(i.n); const w = staple ? 0.25 : isP ? 2 : 1;
    tot += w; if (has(i.n)) { got += w; have.push(i.n); } else if (!staple) need.push(i.n); }
  const coverage = got / tot; const proteinHave = r.ingredients.some((i) => /chicken|turkey|beef|steak|pork|salmon|shrimp|cod|tuna|tofu|egg|yogurt|cottage|beans|lentil|chickpea|edamame/.test(i.n) && has(i.n));
  const score = Math.round(Math.min(100, coverage * 80 + (proteinHave ? 10 : 0) + (fav ? 5 : 0) + (r.minutes <= cookMin ? 5 : 0)));
  return { score, have, need };
}
function Fridge({ data, update, pool, fav, toggleFav, setOpen, toGrocery }: P) {
  const [item, setItem] = useState("");
  const quick = ["eggs", "chicken breast", "greek yogurt", "spinach", "bell pepper", "black beans", "salmon", "cottage cheese", "sweet potato", "broccoli", "ground turkey", "tortillas"];
  const add = (s: string) => update((d) => ({ ...d, pantry: [...new Set([...d.pantry, ...s.split(",").map((x) => norm(x)).filter(Boolean)])] }));
  const matches = pool.map((r) => ({ r, ...scoreRecipe(r, data.pantry, fav(r.id), data.profile.cookMinutes) })).filter((m) => m.have.length).sort((a, b) => b.score - a.score);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <section className="card self-start">
        <h3 className="h2 mb-1">What&apos;s in your fridge?</h3>
        <p className="mb-3 text-sm text-muted">Add what you have, and we&apos;ll rank meals by what you can make right now.</p>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (item.trim()) add(item); setItem(""); }}>
          <input className="input" value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. eggs, spinach" /><button className="btn !px-4" aria-label="add"><Icon name="plus" /></button>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">{data.pantry.map((p) => <button key={p} className="chip-on !text-xs" onClick={() => update((d) => ({ ...d, pantry: d.pantry.filter((x) => x !== p) }))}>{p} <Icon name="x" size={12} /></button>)}</div>
        <div className="mt-3 border-t border-line pt-3"><div className="eyebrow mb-2">Quick add</div><div className="flex flex-wrap gap-1.5">{quick.filter((q) => !data.pantry.includes(q)).map((q) => <button key={q} className="chip !text-xs" onClick={() => add(q)}>+ {q}</button>)}</div></div>
      </section>
      <section className="space-y-3">
        {data.pantry.length === 0 ? <Empty text="Add a few things from your fridge above to see what you can make ✨"><Link href={"/coach?q=" + encodeURIComponent("What can I make from my fridge?")} className="btn-soft">Ask coach instead</Link></Empty> :
          matches.slice(0, 10).map(({ r, score, have, need }) => (
            <RecipeRow key={r.id} r={r} fav={fav(r.id)} toggleFav={() => toggleFav(r.id)} onClick={() => setOpen(r)} extra={
              <div className="mt-2">
                <div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><motion.div className="h-full rounded-full bg-gradient-to-r from-sage to-moss" initial={{ width: 0 }} animate={{ width: `${score}%` }} /></div><span className="text-xs font-extrabold text-moss">{score}%</span></div>
                <p className="mt-1 text-xs text-muted"><b className="text-ink">Have:</b> {have.join(", ")}{need.length ? <> · <b className="text-ink">Need:</b> {need.join(", ")}</> : " · ready to cook! 🎉"}</p>
                {need.length > 0 && <span role="button" className="mt-1.5 inline-block text-xs font-bold text-clay" onClick={(e) => { e.stopPropagation(); toGrocery(need.map((name) => ({ name }))); }}>+ add missing to grocery</span>}
              </div>} />))}
      </section>
    </div>
  );
}

function Prep({ data, update, pool, toGrocery }: P) {
  const prep = data.prep; const people = data.profile.family ? data.profile.householdSize : 1;
  const plannedCounts = useMemo(() => { const c = new Map<string, number>(); weekDays().forEach((d) => SLOTS.forEach((s) => { const id = data.mealPlan[ymd(d)]?.[s]; if (id) c.set(id, (c.get(id) ?? 0) + 1); })); return c; }, [data.mealPlan]);
  const setPrep = (p: Partial<typeof prep>) => update((d) => ({ ...d, prep: { ...d.prep, ...p } }));
  const sel = prep.recipeIds.map((id) => recipes.find((r) => r.id === id)!).filter(Boolean);
  const servingsOf = (r: Recipe) => prep.servings[r.id] ?? Math.max(r.servings, (plannedCounts.get(r.id) ?? 0) * (r.style === "Breakfast" || r.style === "Snack" ? 1 : people));
  const fromPlan = () => { const ids = [...plannedCounts.keys()].filter((id) => recipes.find((r) => r.id === id)?.prep); setPrep({ recipeIds: [...new Set([...prep.recipeIds, ...ids])] }); };
  const cons = consolidate(sel.map((r) => ({ recipe: r, servings: servingsOf(r) })));
  const totalMin = sel.reduce((a, r) => a + r.minutes, 0); const parallel = Math.round(totalMin * 0.6);
  const meals = sel.reduce((a, r) => a + servingsOf(r), 0);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; const di = days.indexOf(prep.day);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-3">
        <div className="card">
          <h3 className="h2">Batch-prep session</h3>
          <p className="mb-3 text-sm text-muted">One cooking session, many easy meals. Pick recipes and adjust servings. Your grocery list builds itself.</p>
          <div className="mb-3 flex items-center gap-2"><span className="text-sm font-bold">Prep day</span>
            <select className="rounded-xl bg-surface-2 px-3 py-2 font-semibold ring-1 ring-line" value={prep.day} onChange={(e) => setPrep({ day: e.target.value })}>{days.map((d) => <option key={d}>{d}</option>)}</select></div>
          <button className="btn-soft w-full" onClick={fromPlan} disabled={!plannedCounts.size}><Icon name="calendar" size={18} /> Pull prep-friendly meals from my week</button>
        </div>
        {sel.map((r) => (
          <div key={r.id} className="card flex items-center gap-3 p-3.5">
            <Thumb r={r} size={48} />
            <div className="flex-1"><div className="font-semibold">{r.title}</div><div className="text-xs text-muted">{r.minutes} min · keeps {r.tags.includes("freezer-friendly") ? "3–4 days or freezes" : "3–4 days"}</div></div>
            <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1 ring-1 ring-line">
              <button className="h-8 w-8 rounded-full bg-surface font-bold" onClick={() => setPrep({ servings: { ...prep.servings, [r.id]: Math.max(1, servingsOf(r) - 1) } })}>–</button>
              <span className="w-7 text-center font-extrabold">{servingsOf(r)}</span>
              <button className="h-8 w-8 rounded-full bg-surface font-bold" onClick={() => setPrep({ servings: { ...prep.servings, [r.id]: servingsOf(r) + 1 } })}>+</button>
            </div>
            <button aria-label="remove" className="text-muted" onClick={() => setPrep({ recipeIds: prep.recipeIds.filter((x) => x !== r.id) })}><Icon name="x" size={16} /></button>
          </div>))}
        <div className="card"><div className="eyebrow mb-2">Add prep-friendly recipes</div>
          <div className="flex flex-wrap gap-1.5">{pool.filter((r) => r.prep && !prep.recipeIds.includes(r.id)).map((r) => <button key={r.id} className="chip !text-xs" onClick={() => setPrep({ recipeIds: [...prep.recipeIds, r.id] })}>+ {r.title}</button>)}</div></div>
      </section>
      <section className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[[meals, "servings"], [`~${parallel}`, "min hands-on"], [sel.reduce((a, r) => a + r.protein * servingsOf(r), 0), "g protein"]].map(([v, l]) => <div key={l as string} className="card p-3 text-center"><div className="font-display text-2xl font-semibold">{v}</div><div className="text-[11px] font-bold text-muted">{l}</div></div>)}
        </div>
        {sel.length > 0 && <div className="card">
          <h3 className="h2 mb-2">Your plan</h3>
          <ol className="space-y-2 text-sm">
            {sel.sort((a, b) => b.minutes - a.minutes).map((r, i) => <li key={r.id} className="flex gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-bold text-white">{i + 1}</span><span><b>{r.title}</b> ×{servingsOf(r)}. {i === 0 ? "Start first, it takes the longest." : "Prep while the first one cooks."}</span></li>)}
            <li className="flex gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage text-xs font-bold text-white">✓</span><span>Cool, portion into containers and label them. Covers about {days[(di + 1) % 7]}–{days[(di + 4) % 7]}.</span></li>
          </ol>
        </div>}
        {cons.length > 0 && <div className="card">
          <div className="mb-2 flex items-center justify-between"><h3 className="h2">Shopping for this prep</h3><button className="btn !px-3 !py-2 text-sm" onClick={() => toGrocery(cons.map((i) => ({ name: i.n, qty: `${fmtQty(i.q)} ${i.u}` })))}>→ Grocery</button></div>
          <ul className="divide-y divide-line text-sm">{cons.map((i) => <li key={i.n + i.u} className="flex justify-between py-1.5"><span>{i.n}</span><span className="font-bold text-muted">{fmtQty(i.q)} {i.u}</span></li>)}</ul>
        </div>}
      </section>
    </div>
  );
}

function Grocery({ data, update }: P) {
  const [item, setItem] = useState("");
  const groups = ["Produce", "Protein", "Dairy & Eggs", "Pantry"].map((a) => [a, data.grocery.filter((g) => (g.aisle ?? aisleOf(g.name)) === a)] as const).filter(([, xs]) => xs.length);
  const left = data.grocery.filter((g) => !g.checked).length;
  return (
    <div className="mx-auto max-w-2xl">
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (item.trim()) update((d) => ({ ...d, grocery: [...d.grocery, { id: uid(), name: item.trim(), aisle: aisleOf(item), checked: false }] })); setItem(""); }}>
        <input className="input" value={item} onChange={(e) => setItem(e.target.value)} placeholder="Add an item" /><button className="btn !px-4" aria-label="add"><Icon name="plus" /></button>
      </form>
      {data.grocery.length === 0 ? <Empty text="Your list is empty. Plan a few meals and I'll gather what you need."><Link href="/nourish#plan" className="btn">Plan my week</Link><Link href="/nourish#recipes" className="btn-soft">Browse recipes</Link></Empty> : (
        <>
          <div className="mb-3 flex items-center justify-between text-sm"><span className="font-bold">{left} to get</span>
            <div className="flex gap-2">{data.grocery.some((g) => g.checked) && <button className="chip" onClick={() => update((d) => ({ ...d, pantry: [...new Set([...d.pantry, ...d.grocery.filter((g) => g.checked).map((g) => norm(g.name))])], grocery: d.grocery.filter((g) => !g.checked) }))}><Icon name="fridge" size={14} /> Checked → fridge</button>}
              <button className="chip" onClick={() => update((d) => ({ ...d, grocery: [] }))}>Clear</button></div></div>
          <div className="space-y-3">{groups.map(([a, xs]) => (
            <section key={a} className="card p-4"><div className="eyebrow mb-2">{a}</div>
              <ul className="space-y-1">{xs.map((g) => (
                <li key={g.id}><label className="flex cursor-pointer items-center gap-3 rounded-xl p-1.5">
                  <span className={`grid h-6 w-6 place-items-center rounded-lg ring-2 transition ${g.checked ? "bg-sage ring-sage text-white" : "ring-line"}`}>{g.checked && <Icon name="check" size={14} stroke={3} />}</span>
                  <input type="checkbox" className="sr-only" checked={g.checked} onChange={() => update((d) => ({ ...d, grocery: d.grocery.map((x) => x.id === g.id ? { ...x, checked: !x.checked } : x) }))} />
                  <span className={`flex-1 font-semibold ${g.checked ? "text-muted line-through" : ""}`}>{g.name}</span>{g.qty && <span className="text-xs font-bold text-muted">{g.qty}</span>}
                </label></li>))}</ul>
            </section>))}</div>
        </>)}
    </div>
  );
}

function RecipeSheet({ r, onClose, fav, toggleFav, toGrocery, update }: P & { r: Recipe | null; onClose: () => void }) {
  const [serv, setServ] = useState<number | null>(null);
  const [day, setDay] = useState(ymd(new Date()));
  if (!r) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;
  const s = serv ?? r.servings; const f = s / r.servings;
  const max = Math.max(r.protein * 4, r.carbs * 4, r.fat * 9);
  const slot: Slot = r.style === "Breakfast" ? "breakfast" : r.style === "Snack" ? "snack" : r.style === "Lunch" ? "lunch" : "dinner";
  return (
    <Sheet open={!!r} onClose={() => { setServ(null); onClose(); }} title={r.title}>
      <div className="mb-3 flex items-center gap-3"><Thumb r={r} size={64} /><div className="min-w-0 flex-1"><div className="eyebrow">{r.style} · {r.minutes} min</div><div className="text-sm text-muted">{r.tags.join(" · ")}</div></div>
        <button onClick={() => toggleFav(r.id)} className={`shrink-0 chip ${fav(r.id) ? "!text-terra" : ""}`}>{fav(r.id) ? "♥ Saved" : "♡ Save"}</button></div>
      <div className="mb-4 rounded-2xl bg-surface-2/70 p-3">
        <div className="mb-2 text-xs font-bold text-muted">Per serving (estimate) · {r.kcal} kcal</div>
        {[["Protein", r.protein, 4, "var(--clay)"], ["Carbs", r.carbs, 4, "var(--honey)"], ["Fat", r.fat, 9, "var(--sage)"]].map(([l, g, k, c]) => (
          <div key={l as string} className="mb-1.5 flex items-center gap-2 text-sm"><span className="w-16 font-semibold">{l}</span><div className="h-2 flex-1 rounded-full bg-surface"><div className="h-2 rounded-full" style={{ width: `${((g as number) * (k as number) / max) * 100}%`, background: c as string }} /></div><span className="w-10 text-right font-bold">{g}g</span></div>))}
      </div>
      <div className="mb-2 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Ingredients</h3>
        <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1"><button className="h-7 w-7 rounded-full bg-surface font-bold" onClick={() => setServ(Math.max(1, s - 1))}>–</button><span className="px-1 text-sm font-bold">{s} serv</span><button className="h-7 w-7 rounded-full bg-surface font-bold" onClick={() => setServ(s + 1)}>+</button></div></div>
      <ul className="mb-4 space-y-1 text-[15px]">{r.ingredients.map((i) => <li key={i.n} className="flex justify-between border-b border-line/60 py-1"><span>{i.n}</span><span className="font-semibold text-muted">{fmtQty(i.q * f)} {i.u}</span></li>)}</ul>
      <h3 className="mb-2 font-display text-lg font-semibold">Steps</h3>
      <ol className="mb-5 space-y-2">{r.steps.map((st, k) => <li key={k} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay text-xs font-bold text-white">{k + 1}</span><span className="text-[15px]">{st}</span></li>)}</ol>
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-1 gap-2"><select className="rounded-2xl bg-surface-2 px-3 font-semibold ring-1 ring-line" value={day} onChange={(e) => setDay(e.target.value)}>{weekDays().map((d) => <option key={ymd(d)} value={ymd(d)}>{d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</option>)}</select>
          <button className="btn-soft flex-1" onClick={() => { update((d) => ({ ...d, mealPlan: { ...d.mealPlan, [day]: { ...d.mealPlan[day], [slot]: r.id } } })); onClose(); }}><Icon name="calendar" size={16} /> Add to {slot}</button></div>
        <button className="btn w-full" onClick={() => { toGrocery(r.ingredients.map((i) => ({ name: i.n, qty: `${fmtQty(i.q * f)} ${i.u}` }))); onClose(); }}><Icon name="cart" size={18} /> Add ingredients to grocery</button>
      </div>
    </Sheet>
  );
}
