"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [["/", "☀️", "Today"], ["/kitchen", "🥗", "Kitchen"], ["/move", "🌀", "Move"], ["/supplements", "🌿", "Supps"], ["/settings", "⚙️", "Settings"]];
export default function Nav() {
  const p = usePathname().replace(/(.)\/$/, "$1");
  if (p === "/onboarding") return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-sand bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-md justify-around py-2">
        {items.map(([h, i, l]) => (
          <li key={h}><Link href={h} className={`flex flex-col items-center rounded-xl px-3 py-1 text-xs ${p === h ? "bg-sand font-semibold" : ""}`}><span className="text-xl">{i}</span>{l}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
