// AI coach: OpenAI-compatible chat completion with Jenny's context. Requires a signed-in user (JWT verified by Supabase).
// Secrets: LLM_API_KEY (required), LLM_BASE_URL (default https://api.openai.com/v1), LLM_MODEL (default gpt-4o-mini)
import { cors, json } from "../_shared/util.ts";
import catalog from "../_shared/catalog.json" with { type: "json" };

const SYSTEM = `You are the warm, encouraging wellness coach inside "Little Corner", a private app for a busy mom of two.
Help with: meal ideas from her fridge, honoring her goals and NEVER suggesting foods on her avoid/allergy list; turning ideas into grocery lists; plain-language explanations of common supplements; gentle low-impact movement (rebounder, mobility); hydration, sleep and stress habits.
Rules:
- No medical advice, diagnoses, dosing instructions or claims that anything treats, cures or prevents disease. For symptoms, medications, dosing, pregnancy or interactions, kindly suggest asking her doctor or pharmacist.
- Whenever you discuss a supplement, end with: "Please check with your doctor or pharmacist before starting or changing any supplement."
- No weight-loss pressure, calorie shaming, "good/bad food" language or guilt. Celebrate small wins. Keep replies short (under 140 words), friendly, skimmable, using **bold** and "•" bullets.
- Prefer recipes from the CATALOG (use their ids). Respect safeguards (e.g. kneeCare → gentler options).
Respond ONLY as JSON: {"reply": string, "grocery": string[] (optional, ingredients to buy), "planRecipeId": string (optional catalog id to plan for today)}.`;
const WEEKLY = `This is her Sunday weekly check-in. Given the week summary, what went well, and what felt hard, write 2-3 short warm sentences: celebrate one specific thing, then suggest ONE small, doable tweak for next week. No pressure. JSON: {"reply": string}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const key = Deno.env.get("LLM_API_KEY"); if (!key) return json({ error: "coach_not_configured" }, 503);
  const { mode = "chat", context, messages = [], extra } = await req.json();
  const avoid: string[] = context?.avoid ?? [];
  const recipes = catalog.recipes.filter((r) => !avoid.some((a) => (r.t + " " + r.i.join(" ")).toLowerCase().includes(a)));
  const sys = mode === "weekly" ? WEEKLY : SYSTEM;
  const body = {
    model: Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini", temperature: 0.6, response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "system", content: `HER CONTEXT: ${JSON.stringify(context)}` },
      ...(mode === "weekly" ? [{ role: "user", content: JSON.stringify(extra) }] : [
        { role: "system", content: `CATALOG: ${JSON.stringify(recipes.map((r) => [r.id, r.t, r.s, r.p + "g", r.m + "min", r.i.join("|")]))}` },
        { role: "system", content: `SUPPLEMENT NOTES: ${JSON.stringify(catalog.supplements)}` },
        ...messages.slice(-12).map((m: { role: string; content: string }) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 2000) })),
      ]),
    ],
  };
  const r = await fetch(`${Deno.env.get("LLM_BASE_URL") ?? "https://api.openai.com/v1"}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) return json({ error: "llm_error", detail: (await r.text()).slice(0, 300) }, 502);
  const out = await r.json();
  let parsed: { reply?: string; grocery?: string[]; planRecipeId?: string } = {};
  try { parsed = JSON.parse(out.choices?.[0]?.message?.content ?? "{}"); } catch { parsed = { reply: out.choices?.[0]?.message?.content }; }
  const actions = [];
  if (parsed.grocery?.length) actions.push({ label: "Add to grocery list", kind: "grocery", payload: parsed.grocery.slice(0, 25) });
  if (parsed.planRecipeId && recipes.some((x) => x.id === parsed.planRecipeId)) actions.push({ label: "Plan it for today", kind: "plan", payload: [parsed.planRecipeId] });
  return json({ reply: parsed.reply ?? "Sorry, I lost my train of thought. Try again?", actions: actions.length ? actions : undefined });
});
