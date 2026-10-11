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
type Phase = "morning" | "midday" | "evening" | "winddown";
const phaseAt = (hm: string): Phase => (hm >= "05:00" && hm < "11:00" ? "morning" : hm >= "11:00" && hm < "16:00" ? "midday" : hm >= "16:00" && hm < "20:30" ? "evening" : "winddown");
const VOICE: Record<Phase, { hi: string; tail: string }> = {
  morning: { hi: "Good morning ☀️", tail: "Ease into the day." }, midday: { hi: "Midday check ⛅", tail: "A little goes a long way." },
  evening: { hi: "Evening 🌇", tail: "Softly does it." }, winddown: { hi: "Winding down 🌙", tail: "Then rest. You did enough." },
};
const QUIET_OK = new Set(["wind", "journal"]); // only these (plus doses) may ping during wind-down
// deno-lint-ignore no-explicit-any
function dueFor(data: any, date: string, hm: string, dow: number): Msg[] {
  const out: Msg[] = []; if (!data) return out;
  const ph = phaseAt(hm), v = VOICE[ph];
  const done = new Set<string>([...(data.nextDone?.[date] ?? []), ...(data.nextSkips?.[date] ?? [])]);
  const log = data.logs?.[date] ?? {}; const wT = data.profile?.waterTargetOz ?? 64;
  const [h, m] = hm.split(":").map(Number); const dayFrac = Math.min(1, Math.max(0, (h * 60 + m - 7 * 60) / (13 * 60)));
  const skipRem = (id: string) => {
    if (ph === "winddown" && !QUIET_OK.has(id)) return true;
    if (id.startsWith("water")) return (log.waterOz ?? 0) >= wT * dayFrac; // already on track
    if (id === "move") return done.has("move") || (data.workouts ?? []).some((w: { date: string }) => w.date === date);
    if (id === "wind") return done.has("wind");
    if (id === "checkin") return (data.checkins ?? []).some((c: { weekOf: string }) => c.weekOf === date);
    if (id === "journal") return (data.journal ?? []).some((j: { date: string }) => j.date === date);
    return false;
  };
  const copy: Record<string, string> = { "water-am": "A glass of water to wake up your body.", "water-mid": "Time for a glass of water 💧", move: "Five minutes of bouncing counts. Want a quick one?", prep: "Prep session? Two staples make the week easier.", checkin: "Your 2-minute Sunday check-in is ready.", wind: "Lights low, a stretch, a few slow breaths.", journal: "Three good things from today?" };
  for (const r of data.reminders ?? []) if (r.enabled && r.time === hm && (!r.days || r.days.includes(dow)) && !String(r.id).startsWith("supps") && !skipRem(r.id))
    out.push({ key: `rem-${r.id}`, title: v.hi, body: copy[r.id] ?? r.label, kind: "reminder", url: r.id.startsWith("water") ? "" : r.id === "move" ? "move/" : r.id === "checkin" ? "checkin/" : r.id === "journal" ? "journal/" : r.id === "prep" ? "nourish/#prep" : "unwind/#sleep" });
  for (const md of data.meds ?? []) if (md.active !== false && !md.asNeeded) for (const t of md.times ?? []) if (t === hm && !done.has(`med-${md.id}-${t}`) && !(data.doseLogs ?? []).some((l: { medId: string; date: string; time: string }) => l.medId === md.id && l.date === date && l.time === t))
    out.push({ key: `med-${md.id}-${t}`, title: `${v.hi} · ${md.name}`, body: `${md.dose ?? ""}${md.withFood ? " · with food" : ""}`.trim() || "Gentle reminder 💛", kind: "med", item: md.id, time: t, url: "meds/" });
  for (const sp of data.supplements ?? []) for (const t of sp.times ?? []) if (t === hm && !done.has(`supp-${sp.id}-${t}`) && !(data.suppLogs ?? []).some((l: { suppId: string; date: string; time: string }) => l.suppId === sp.id && l.date === date && l.time === t))
    out.push({ key: `supp-${sp.id}-${t}`, title: `${v.hi} · ${sp.name}`, body: `${sp.dose ?? ""}${sp.withFood ? " · with food" : ""}`.trim() || "Supplement time 🌿", kind: "supp", item: sp.id, time: t, url: "supplements/" });
  // "Later" in the app = soft snooze; resurface kindly at the chosen time if still not done.
  for (const [key, until] of Object.entries(data.nextSnooze?.[date] ?? {})) if (until === hm && !done.has(key) && (ph !== "winddown" || key.startsWith("med") || key === "wind")) {
    const [kind, item, time] = key.split("-");
    const label = kind === "med" ? data.meds?.find((x: { id: string }) => x.id === item)?.name : kind === "supp" ? data.supplements?.find((x: { id: string }) => x.id === item)?.name : kind === "water" ? "a glass of water" : kind === "meal" ? `your ${item}` : kind === "move" ? "a little movement" : kind === "wind" ? "winding down" : key;
    out.push({ key: `later-${key}`, title: "Back again, no rush 💛", body: `Whenever you're ready: ${label}. ${v.tail}`, kind: kind === "med" || kind === "supp" ? kind : "reminder", item: kind === "med" || kind === "supp" ? item : undefined, time, url: kind === "med" ? "meds/" : "" });
  }
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
