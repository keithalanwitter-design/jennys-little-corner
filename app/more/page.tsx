"use client";
import Link from "next/link";
import { PageHeader, Stagger, Item } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { Calf } from "@/components/Brand";
const links = [
  ["/unwind", "unwind", "Unwind", "Breathing, me time, sleep & wind-down", "from-sky to-[#5e7f95]"],
  ["/meds", "pill", "Medications", "Schedule, gentle reminders, refills, history", "from-plum to-blush"],
  ["/checkin", "calendar", "Weekly check-in", "2 minutes: look back, one small tweak", "from-plum to-clay"],
  ["/progress", "progress", "Progress & insights", "Water, protein, movement, energy and sleep trends", "from-sky to-sage"],
  ["/journal", "journal", "Journal & little wins", "Gratitude, reflections and milestones", "from-honey to-clay"],
  ["/supplements", "leaf", "Supplements", "Your schedule, check-offs and refills", "from-sage to-moss"],
  ["/onboarding", "sparkle", "Goals & preferences", "Change anything you've told the app", "from-plum to-blush"],
  ["/settings", "settings", "Settings & reminders", "Theme, notifications, your data", "from-clay to-terra"],
];
export default function More() {
  return (
    <>
      <PageHeader eyebrow="More" title="Everything else" />
      <Stagger className="space-y-3">
        {links.map(([h, i, t, s, g]) => (
          <Item key={h}><Link href={h} className="card flex items-center gap-4 p-4 transition active:scale-[.98]">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${g} text-white`}><Icon name={i} /></span>
            <span className="flex-1"><span className="block font-display text-lg font-semibold">{t}</span><span className="text-sm text-muted">{s}</span></span><Icon name="skip" size={14} className="text-muted" />
          </Link></Item>))}
        <Item><div className="flex flex-col items-center pt-6 text-center text-sm text-muted"><Calf size={70} /><p className="mt-2">Made with love, just for you.</p></div></Item>
      </Stagger>
    </>
  );
}
