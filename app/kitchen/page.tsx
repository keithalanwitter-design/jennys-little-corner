"use client";
import { useMemo, useState } from "react";
import { useData, uid } from "@/lib/store";
import { H, Loading } from "@/components/ui";
import { proteins, produce, carbsFats, sauces, recipes, type Recipe } from "@/lib/content";

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const norm = (s: string) => s.toLowerCase().trim();
const tabs = ["Mix & Match", "Recipes", "My Fridge", "Grocery"] as const;

export default function Kitchen() {
  const { data, update } = useData();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Mix & Match");
  const [meal, setMeal] = useState({ p: proteins[0], v: produce[0], c: carbsFats[0], s: sauces[0] });
  const [style, setStyle] = useState("All");
  const [item, setItem] = useState("");
  const avoid = useMemo(() => (data ? `${data.profile.avoid},${data.profile.allergies}`.split(",").map(norm).filter(Boolean) : []), [data]);
  if (!data) return <Loading />;
  const ok = (x: string) => !avoid.some((a) => norm(x).includes(a));
  const okRecipe = (r: Recipe) => ok(r.title) && r.ingredients.every(ok);
  const addGrocery = (names: string[]) => update((d) => {
    const have = new Set([...d.grocery.map((g) => norm(g.name)), ...d.pantry.map(norm)]);
    return { ...d, grocery: [...d.grocery, ...names.filter((n) => !have.has(norm(n))).map((name) => ({ id: uid(), name, checked: false }))] };
  });
  const pantry = data.pantry.map(norm);
  const matches = recipes.filter(okRecipe).map((r) => {
    const have = r.ingredients.filter((i) => pantry.some((p) => i.includes(p) || p.includes(i)));
    return { r, have, missing: r.ingredients.filter((i) => !have.includes(i)) };
  }).sort((a, b) => b.have.length / b.r.ingredients.length - a.have.length / a.r.ingredients.length);

  return (
    <>
      <H sub="Protein-forward, flexible, no good or bad foods.">Kitchen Hub 🥗</H>
      <div className="mb-4 flex gap-2 overflow-x-auto">{tabs.map((t) => <button key={t} className={tab === t ? "chip-on" : "chip"} onClick={() => setTab(t)}>{t}{t === "Grocery" && data.grocery.length ? ` (${data.grocery.filter((g) => !g.checked).length})` : ""}</button>)}</div>

      {tab === "Mix & Match" && (
        <div className="card">
          <p className="mb-3 text-sm opacity-70">Fill about half the plate with produce, a quarter with protein, a quarter with carbs, plus a sauce. Tap any row to change it.</p>
          {([["p", "🍗 Protein", proteins], ["v", "🥦 Produce", produce], ["c", "🍠 Carb / fat", carbsFats], ["s", "🥣 Sauce", sauces]] as const).map(([k, l, opts]) => (
            <div key={k} className="mb-2">
              <div className="text-xs font-semibold opacity-70">{l}</div>
              <select className="input" value={meal[k]} onChange={(e) => setMeal({ ...meal, [k]: e.target.value })}>{opts.filter(ok).map((o) => <option key={o}>{o}</option>)}</select>
            </div>
          ))}
          <div className="my-3 rounded-2xl bg-sand/60 p-3 text-center font-semibold">{meal.p} + {meal.v} + {meal.c} with {meal.s}</div>
          <div className="flex gap-2">
            <button className="btn-soft flex-1" onClick={() => setMeal({ p: pick(proteins.filter(ok)), v: pick(produce.filter(ok)), c: pick(carbsFats.filter(ok)), s: pick(sauces.filter(ok)) })}>🎲 Surprise me</button>
            <button className="btn flex-1" onClick={() => addGrocery([meal.p, meal.v, meal.c, meal.s])}>Add to grocery</button>
          </div>
          <p className="mt-3 text-xs opacity-60">Prep tip: cook one protein and one grain on Sunday and you have bowls, wraps and tacos ready through Wednesday.</p>
        </div>
      )}

      {tab === "Recipes" && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">{["All", "15-Min Dinner", "Fridge Staple", "Grab & Go Breakfast", "Family Style"].map((s) => <button key={s} className={style === s ? "chip-on" : "chip"} onClick={() => setStyle(s)}>{s}</button>)}</div>
          <div className="space-y-3">{recipes.filter(okRecipe).filter((r) => style === "All" || r.style === style).map((r) => <RecipeCard key={r.id} r={r} onAdd={() => addGrocery(r.ingredients)} />)}</div>
        </>
      )}

      {tab === "My Fridge" && (
        <>
          <div className="card mb-3">
            <p className="mb-2 text-sm">What do you have on hand? We&apos;ll suggest what to make.</p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (item.trim()) update((d) => ({ ...d, pantry: [...new Set([...d.pantry, ...item.split(",").map((x) => x.trim()).filter(Boolean)])] })); setItem(""); }}>
              <input className="input" value={item} onChange={(e) => setItem(e.target.value)} placeholder="eggs, spinach, chicken breast" />
              <button className="btn">Add</button>
            </form>
            <div className="mt-2 flex flex-wrap gap-2">{data.pantry.map((p) => <button key={p} className="chip" onClick={() => update((d) => ({ ...d, pantry: d.pantry.filter((x) => x !== p) }))}>{p} ✕</button>)}</div>
          </div>
          {data.pantry.length > 0 && <div className="space-y-3">{matches.slice(0, 6).map(({ r, have, missing }) => (
            <RecipeCard key={r.id} r={r} extra={<p className="text-xs"><b>Have:</b> {have.join(", ") || "nothing yet"} · <b>Need:</b> {missing.join(", ") || "nothing! 🎉"}</p>} onAdd={() => addGrocery(missing)} addLabel="Add missing to grocery" />
          ))}</div>}
        </>
      )}

      {tab === "Grocery" && (
        <div className="card">
          <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (item.trim()) addGrocery([item.trim()]); setItem(""); }}>
            <input className="input" value={item} onChange={(e) => setItem(e.target.value)} placeholder="Add an item" /><button className="btn">Add</button>
          </form>
          {data.grocery.length === 0 && <p className="text-sm opacity-60">Your list is empty. Add items from recipes or Mix & Match.</p>}
          <ul className="space-y-1">{data.grocery.map((g) => (
            <li key={g.id} className="flex items-center gap-2">
              <input type="checkbox" checked={g.checked} onChange={() => update((d) => ({ ...d, grocery: d.grocery.map((x) => x.id === g.id ? { ...x, checked: !x.checked } : x) }))} />
              <span className={g.checked ? "line-through opacity-50" : ""}>{g.name}</span>
            </li>))}</ul>
          {data.grocery.some((g) => g.checked) && <button className="btn-soft mt-3" onClick={() => update((d) => ({ ...d, pantry: [...new Set([...d.pantry, ...d.grocery.filter((g) => g.checked).map((g) => g.name.toLowerCase())])], grocery: d.grocery.filter((g) => !g.checked) }))}>Move checked to fridge</button>}
        </div>
      )}
    </>
  );
}
function RecipeCard({ r, onAdd, extra, addLabel = "Add to grocery" }: { r: Recipe; onAdd: () => void; extra?: React.ReactNode; addLabel?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <button className="w-full text-left" onClick={() => setOpen(!open)}>
        <div className="font-semibold">{r.title}</div>
        <div className="text-xs opacity-70">{r.style} · {r.minutes} min · ~{r.proteinG}g protein/serving · serves {r.servings}</div>
      </button>
      {extra}
      {open && <div className="mt-2 text-sm"><p className="mb-1"><b>Ingredients:</b> {r.ingredients.join(", ")}</p><p>{r.steps}</p><p className="mt-1 text-xs opacity-60">Protein amounts are rough estimates.</p></div>}
      <button className="btn-soft mt-2 text-sm" onClick={onAdd}>{addLabel}</button>
    </div>
  );
}
