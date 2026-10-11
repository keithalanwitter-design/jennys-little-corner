export const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
export const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "content-type": "application/json" } });
const enc = new TextEncoder();
const b64u = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
async function key() { return crypto.subtle.importKey("raw", enc.encode(Deno.env.get("PUSH_ACTION_SECRET") ?? ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
/** Signed, expiring token for notification action buttons (so the service worker can log a dose without a session). */
export async function signToken(payload: Record<string, unknown>) { const body = b64u(enc.encode(JSON.stringify({ ...payload, exp: Date.now() + 36 * 3600e3 }))); const sig = b64u(await crypto.subtle.sign("HMAC", await key(), enc.encode(body))); return `${body}.${sig}`; }
export async function verifyToken(t: string) { const [body, sig] = (t ?? "").split("."); if (!body || !sig) return null; const ok = await crypto.subtle.verify("HMAC", await key(), fromB64u(sig), enc.encode(body)); if (!ok) return null; const p = JSON.parse(new TextDecoder().decode(fromB64u(body))); return p.exp > Date.now() ? p : null; }
