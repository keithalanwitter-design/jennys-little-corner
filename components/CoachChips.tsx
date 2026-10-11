"use client";
import Link from "next/link";
import { useData, getLog } from "@/lib/store";
import { phaseNow } from "@/lib/flow";
import { Icon } from "./Icons";
import type { AppData } from "@/lib/types";

export type Page = "today" | "nourish" | "move" | "unwind" | "meds" | "supplements" | "journal" | "progress" | "coach";
const q = (s: string) => "/coach?q=" + encodeURIComponent(s);
export function coachPrompts(page: Page, d: AppData): string[] {
  const ph = phaseNow(), left = Math.max(0, (d.profile.proteinTargetG ?? 100) - getLog(d).proteinG);
  const meal = { morning: "Breakfast from my fridge?", midday: "Quick protein lunch from my fridge?", evening: "What's for dinner from my fridge?", winddown: "Help me wind down" }[ph];
  const m: Record<Page, string[]> = {
    today: ["What's my next step?", meal, "How's my day going?"],
    nourish: ["What can I make from my fridge?", "Turn that into a grocery list", left ? `Snack ideas for ${left} g protein` : "High-protein breakfast ideas"],
    move: ["I'm tired. What movement?", "Gentle cooldown ideas", "What's my next step?"],
    unwind: ["Help me wind down", "A 5-minute me-time idea", "How's my day going?"],
    meds: ["I missed a dose. What now?", "What's my next step?"],
    supplements: ["What does magnesium do?", "Explain vitamin D simply", "I missed a dose. What now?"],
    journal: ["Give me a journal prompt", "How's my week going?"],
    progress: ["How's my week going?", "One small tweak for this week?"],
    coach: ["What's my next step?", meal, "Turn that into a grocery list", "How's my day going?", "What does magnesium do?"],
  };
  return m[page];
}
export default function CoachChips({ page }: { page: Page }) {
  const { data } = useData(); if (!data) return null;
  return (
    <div className="no-scrollbar -mx-4 mb-4 flex items-center gap-1.5 overflow-x-auto px-4">
      <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-muted"><Icon name="sparkle" size={13} /> Ask coach</span>
      {coachPrompts(page, data).map((s) => <Link key={s} href={q(s)} className="chip shrink-0 !text-xs">{s}</Link>)}
    </div>);
}
