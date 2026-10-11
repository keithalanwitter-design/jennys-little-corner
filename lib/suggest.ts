import { recipes, type Recipe } from "./recipes";
import type { AppData } from "./types";
const norm = (s: string) => s.toLowerCase().trim();
const STAPLES = /oil|salt|pepper$|seasoning|spice|honey|baking|soy sauce|garlic|ginger|dressing|sauce$/;
const PROT = /chicken|turkey|beef|steak|pork|salmon|shrimp|cod|tuna|tofu|egg|yogurt|cottage|beans|lentil|chickpea|edamame/;
export const avoidList = (d: AppData) => `${d.profile.avoid},${d.profile.allergies}`.split(",").map(norm).filter((x) => x && x !== "none");
export const allowed = (d: AppData) => { const a = avoidList(d); return recipes.filter((r) => !a.some((x) => norm(r.title).includes(x) || r.ingredients.some((i) => norm(i.n).includes(x)))); };
export function scoreRecipe(r: Recipe, pantry: string[], fav: boolean, cookMin: number) {
  const has = (n: string) => pantry.some((p) => { const a = norm(n), b = norm(p); return a.includes(b) || b.includes(a) || a.split(" ").some((w) => w.length > 3 && b.includes(w)); });
  let tot = 0, got = 0; const have: string[] = [], need: string[] = [];
  for (const i of r.ingredients) { const staple = STAPLES.test(i.n); const w = staple ? 0.25 : PROT.test(i.n) ? 2 : 1; tot += w; if (has(i.n)) { got += w; have.push(i.n); } else if (!staple) need.push(i.n); }
  const proteinHave = r.ingredients.some((i) => PROT.test(i.n) && has(i.n));
  const score = Math.round(Math.min(100, (got / tot) * 80 + (proteinHave ? 10 : 0) + (fav ? 5 : 0) + (r.minutes <= cookMin ? 5 : 0)));
  return { score, have, need };
}
export function fridgeMatches(d: AppData, n = 3, style?: string) {
  return allowed(d).filter((r) => !style || r.style === style).map((r) => ({ r, ...scoreRecipe(r, d.pantry, d.favorites.includes(r.id), d.profile.cookMinutes) }))
    .sort((a, b) => b.score - a.score || b.r.protein - a.r.protein).slice(0, n);
}
