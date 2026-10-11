"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Icon } from "./Icons";
import { Wordmark } from "./Brand";
const main = [["/", "today", "Today"], ["/nourish", "nourish", "Nourish"], ["/move", "move", "Move"], ["/unwind", "unwind", "Unwind"], ["/more", "more", "More"]] as const;
const extra = [["/progress", "progress", "Progress"], ["/journal", "journal", "Journal & Wins"], ["/supplements", "pill", "Supplements"], ["/settings", "settings", "Settings"]] as const;
export default function Nav() {
  const p = usePathname().replace(/(.)\/$/, "$1");
  if (p === "/onboarding") return null;
  const active = (h: string) => h === p || (h === "/more" && extra.some(([e]) => e === p));
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-1 border-r border-line bg-surface/60 p-5 backdrop-blur lg:flex">
        <div className="mb-6 px-2"><Wordmark /></div>
        {[...main.filter(([h]) => h !== "/more"), ...extra].map(([h, i, l]) => (
          <Link key={h} href={h} className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold transition ${p === h ? "text-white" : "text-ink/75 hover:bg-surface-2"}`}>
            {p === h && <motion.span layoutId="side" className="absolute inset-0 rounded-2xl" style={{ background: "linear-gradient(135deg,var(--clay),var(--terra))" }} />}
            <span className="relative"><Icon name={i} /></span><span className="relative">{l}</span>
          </Link>
        ))}
        <p className="mt-auto px-2 text-xs text-muted">Everything stays on this device.</p>
      </aside>
      <nav className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-40 rounded-[26px] border border-line bg-surface/85 shadow-[0_12px_40px_-12px_rgba(60,40,25,.35)] backdrop-blur-xl lg:hidden">
        <ul className="mx-auto flex max-w-md justify-around px-1 py-1.5">
          {main.map(([h, i, l]) => (
            <li key={h} className="flex-1">
              <Link href={h} className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold transition ${active(h) ? "text-white" : "text-muted"}`}>
                {active(h) && <motion.span layoutId="tab" className="absolute inset-x-1 inset-y-0 rounded-2xl" style={{ background: "linear-gradient(135deg,var(--clay),var(--terra))" }} transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <span className="relative"><Icon name={i} size={21} /></span><span className="relative">{l}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
