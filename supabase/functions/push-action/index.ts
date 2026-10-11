// Handles notification buttons ("Taken" / "Snooze") from the service worker. Deploy with --no-verify-jwt; protected by a signed token.
import { createClient } from "npm:@supabase/supabase-js@2";
import { cors, json, verifyToken } from "../_shared/util.ts";
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const { action, token } = await req.json().catch(() => ({}));
  const p = await verifyToken(token); if (!p) return json({ error: "invalid_token" }, 401);
  if (action === "taken" && (p.kind === "med" || p.kind === "supp")) {
    const { error } = await admin.rpc("log_dose_from_push", { p_user: p.u, p_kind: p.kind, p_item: p.item, p_date: p.date, p_time: p.time });
    return error ? json({ error: error.message }, 500) : json({ ok: true });
  }
  if (action === "snooze") {
    const { error } = await admin.from("snoozes").insert({ user_id: p.u, payload: { title: p.title, body: p.body, kind: p.kind, item: p.item, date: p.date, time: p.time, key: p.key }, due_at: new Date(Date.now() + 15 * 60e3).toISOString() });
    return error ? json({ error: error.message }, 500) : json({ ok: true });
  }
  return json({ error: "unknown_action" }, 400);
});
