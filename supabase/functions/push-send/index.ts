// Scheduled sender (pg_cron, every minute) for reminders, meds and supplements when the app is closed.
// Auth: "Authorization: Bearer <CRON_SECRET>" from pg_cron, or a signed-in user's JWT with {test:true} for a test push.
// Deploy with --no-verify-jwt. Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET, PUSH_ACTION_SECRET.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { cors, json, signToken } from "../_shared/util.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@example.com", Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);
const actionUrl = `${URL_}/functions/v1/push-action`;

type Sub = { id: number; user_id: string; endpoint: string; keys: { p256dh: string; auth: string }; tz: string | null };
type Msg = { key: string; title: string; body: string; kind: string; item?: string; time?: string; url?: string };

function localNow(tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour}:${p.minute}`, dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday) };
}
// deno-lint-ignore no-explicit-any
function dueFor(data: any, date: string, hm: string, dow: number): Msg[] {
  const out: Msg[] = [];
  for (const r of data?.reminders ?? []) if (r.enabled && r.time === hm && (!r.days || r.days.includes(dow)) && !String(r.id).startsWith("supps"))
    out.push({ key: `rem-${r.id}`, title: "Little Corner", body: r.label, kind: "reminder", url: r.id.startsWith("water") ? "" : r.id === "move" ? "move/" : r.id === "checkin" ? "checkin/" : r.id === "journal" ? "journal/" : r.id === "prep" ? "nourish/" : "unwind/" });
  for (const m of data?.meds ?? []) if (m.active !== false && !m.asNeeded) for (const t of m.times ?? []) if (t === hm && !(data.doseLogs ?? []).some((l: { medId: string; date: string; time: string }) => l.medId === m.id && l.date === date && l.time === t))
    out.push({ key: `med-${m.id}-${t}`, title: `Time for ${m.name}`, body: `${m.dose ?? ""}${m.withFood ? " · with food" : ""}`.trim() || "Gentle reminder 💛", kind: "med", item: m.id, time: t, url: "meds/" });
  for (const s of data?.supplements ?? []) for (const t of s.times ?? []) if (t === hm && !(data.suppLogs ?? []).some((l: { suppId: string; date: string; time: string }) => l.suppId === s.id && l.date === date && l.time === t))
    out.push({ key: `supp-${s.id}-${t}`, title: `${s.name}`, body: `${s.dose ?? ""}${s.withFood ? " · with food" : ""}`.trim() || "Supplement reminder 🌿", kind: "supp", item: s.id, time: t, url: "supplements/" });
  return out;
}
async function send(sub: Sub, m: Msg, date: string) {
  const token = await signToken({ u: sub.user_id, kind: m.kind, item: m.item, date, time: m.time, title: m.title, body: m.body, key: m.key });
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify({ title: m.title, body: m.body, tag: m.key, data: { kind: m.kind, url: m.url ?? "", actionUrl, token } }), { TTL: 3600, urgency: "normal" });
  } catch (e) { const code = (e as { statusCode?: number }).statusCode; if (code === 404 || code === 410) await admin.from("push_subscriptions").delete().eq("id", sub.id); else console.error("push failed", code, (e as Error).message); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const body = await req.json().catch(() => ({}));
  if (body.test) {
    const { data: { user } } = await admin.auth.getUser(auth); if (!user) return json({ error: "unauthorized" }, 401);
    const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", user.id);
    for (const s of (subs ?? []) as Sub[]) await send(s, { key: "test", title: "Little Corner", body: "Push reminders are working 💛", kind: "reminder" }, localNow(s.tz ?? "UTC").date);
    return json({ ok: true, sent: subs?.length ?? 0 });
  }
  if (auth !== Deno.env.get("CRON_SECRET")) return json({ error: "unauthorized" }, 401);
  const { data: subs } = await admin.from("push_subscriptions").select("*");
  const byUser = new Map<string, Sub[]>(); for (const s of (subs ?? []) as Sub[]) byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s]);
  let sent = 0;
  for (const [uid, us] of byUser) {
    const { data: st } = await admin.from("app_state").select("data, tz").eq("user_id", uid).maybeSingle();
    const tz = st?.tz ?? us[0].tz ?? "America/Chicago"; const { date, hm, dow } = localNow(tz);
    const msgs = dueFor(st?.data, date, hm, dow);
    const { data: snz } = await admin.from("snoozes").select("*").eq("user_id", uid).lte("due_at", new Date().toISOString());
    for (const z of snz ?? []) { msgs.push({ ...z.payload, key: `${z.payload.key}-snz-${z.id}` }); await admin.from("snoozes").delete().eq("id", z.id); }
    for (const m of msgs) {
      const { error } = await admin.from("push_log").insert({ user_id: uid, key: m.key, date }); if (error) continue; // already sent today
      for (const s of us) await send(s, m, date); sent++;
    }
  }
  return json({ ok: true, sent });
});
