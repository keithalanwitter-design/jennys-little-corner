// Data layer. localStorage today; swap in SupabaseAdapter later (schema in /supabase/schema.sql).
import type { AppData } from "./types";
export interface DataAdapter { load(): Promise<AppData | null>; save(d: AppData): Promise<void>; clear(): Promise<void> }
const KEY = "jlc-data-v1";
export const localAdapter: DataAdapter = {
  async load() { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; } },
  async save(d) { localStorage.setItem(KEY, JSON.stringify(d)); },
  async clear() { localStorage.removeItem(KEY); },
};
/* Supabase sketch (npm i @supabase/supabase-js, set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY):
export const supabaseAdapter: DataAdapter = {
  async load() { const { data } = await sb.from("app_state").select("data").single(); return data?.data ?? null; },
  async save(d) { await sb.from("app_state").upsert({ user_id: (await sb.auth.getUser()).data.user!.id, data: d }); },
  async clear() { await sb.from("app_state").delete().neq("user_id", ""); },
}; Normalized tables are also provided in the schema for a later migration. */
export const db: DataAdapter = localAdapter;
