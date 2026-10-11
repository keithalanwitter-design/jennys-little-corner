"use client";
import { motion } from "framer-motion";
import { useId } from "react";

/** Brand mark: an arched "corner" window with a rising sun, rolling sage hills and a sprouting leaf. */
export function Mark({ size = 40, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-label="Jenny's Little Corner">
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6D3B0" /><stop offset="1" stopColor="#F9EBDD" /></linearGradient>
        <linearGradient id={`sun${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F0B66E" /><stop offset="1" stopColor="#C9825F" /></linearGradient>
        <linearGradient id={`hill${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9DAE97" /><stop offset="1" stopColor="#5E715E" /></linearGradient>
        <clipPath id={`arch${id}`}><path d="M12 58V30a20 20 0 0 1 40 0v28z" /></clipPath>
      </defs>
      <path d="M8 60V30a24 24 0 0 1 48 0v30z" fill="#A85B3D" />
      <g clipPath={`url(#arch${id})`}>
        <rect x="0" y="0" width="64" height="64" fill={`url(#sky${id})`} />
        <circle cx="32" cy="38" r="10" fill={`url(#sun${id})`} />
        <path d="M4 46 Q20 36 34 44 T64 42 V64 H4z" fill={`url(#hill${id})`} />
        <path d="M0 52 Q18 46 32 52 T64 50 V64 H0z" fill="#4E5F4F" opacity=".9" />
      </g>
      <path d="M32 58c0-6 1-10 5-13" stroke="#F8F4EC" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M37 45c4-1 7 1 8 4-4 1-7 0-8-4z" fill="#F8F4EC" />
      <path d="M6 60h52" stroke="#3B332C" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <Mark size={36} />
      <div className="leading-none">
        <div className="font-display text-[17px] font-semibold tracking-tight">Little Corner</div>
        <div className="text-[10px] font-bold uppercase tracking-[.2em] text-muted">a space for you</div>
      </div>
    </div>
  );
}

/** Animated glass that fills with water. */
export function WaterGlass({ pct, size = 110 }: { pct: number; size?: number }) {
  const id = useId().replace(/:/g, "");
  const p = Math.max(0, Math.min(1, pct));
  const top = 18 + (1 - p) * 84;
  return (
    <svg width={size * 0.8} height={size} viewBox="0 0 88 110" aria-hidden>
      <defs>
        <clipPath id={`g${id}`}><path d="M12 14h64l-7 86a8 8 0 0 1-8 7H27a8 8 0 0 1-8-7z" /></clipPath>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A9CBDD" /><stop offset="1" stopColor="#5E93B0" /></linearGradient>
      </defs>
      <g clipPath={`url(#g${id})`}>
        <rect width="88" height="110" fill="var(--surface-2)" />
        <motion.g initial={false} animate={{ y: top }} transition={{ type: "spring", stiffness: 60, damping: 14 }}>
          <g className="animate-wave">
            <path d="M0 6 Q11 0 22 6 T44 6 T66 6 T88 6 T110 6 T132 6 T154 6 T176 6 V200 H0z" fill={`url(#w${id})`} />
          </g>
          <circle cx="30" cy="30" r="2.5" fill="#fff" opacity=".5" /><circle cx="52" cy="46" r="1.8" fill="#fff" opacity=".45" /><circle cx="40" cy="62" r="2.2" fill="#fff" opacity=".4" />
        </motion.g>
      </g>
      <path d="M12 14h64l-7 86a8 8 0 0 1-8 7H27a8 8 0 0 1-8-7z" fill="none" stroke="var(--muted)" strokeOpacity=".5" strokeWidth="2.5" />
      <path d="M20 22l4 70" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Progress ring. */
export function Ring({ pct, size = 96, stroke = 10, color = "var(--clay)", track = "var(--surface-2)", children }: { pct: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - p) }} transition={{ type: "spring", stiffness: 50, damping: 15 }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** Time-of-day scene for the greeting hero. */
export function Scene({ phase }: { phase: "morning" | "afternoon" | "evening" | "night" }) {
  const id = useId().replace(/:/g, "");
  const sky = { morning: ["#F7CFA8", "#FBE9D6"], afternoon: ["#BFD7E0", "#F4EBDD"], evening: ["#E9A27F", "#F3CDB2"], night: ["#2D3550", "#55506B"] }[phase];
  const night = phase === "night";
  return (
    <svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient>
        <radialGradient id={`o${id}`}><stop offset="0" stopColor={night ? "#FFF6DA" : "#FFE2A8"} /><stop offset="1" stopColor={night ? "#E9DDB8" : "#E9A66B"} /></radialGradient>
      </defs>
      <rect width="400" height="180" fill={`url(#s${id})`} />
      {night && [[40, 30], [90, 60], [150, 22], [230, 44], [300, 18], [360, 52], [200, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 1.2 : 1.8} fill="#fff" opacity=".8" />)}
      <g className="animate-floaty"><circle cx={phase === "morning" ? 300 : phase === "afternoon" ? 250 : phase === "evening" ? 320 : 310} cy={phase === "afternoon" ? 48 : 76} r={night ? 20 : 30} fill={`url(#o${id})`} />
        {night && <circle cx="320" cy="70" r="18" fill={sky[0]} />}</g>
      {!night && <g fill="#fff" opacity=".7"><ellipse cx="80" cy="50" rx="30" ry="8" /><ellipse cx="100" cy="44" rx="18" ry="9" /><ellipse cx="200" cy="34" rx="22" ry="6" /></g>}
      <path d="M0 120 Q80 90 170 115 T400 100 V180 H0z" fill={night ? "#3C4560" : "#A9B8A2"} />
      <path d="M0 145 Q100 118 210 140 T400 132 V180 H0z" fill={night ? "#2A3049" : "#7E907A"} />
      <path d="M0 165 Q120 150 260 165 T400 160 V180 H0z" fill={night ? "#1F2438" : "#5E715E"} />
    </svg>
  );
}

/** A small Highland-calf friend for encouragement moments. */
export function Calf({ size = 90 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <path d="M22 44c-12-4-18-14-16-22 8 2 14 8 20 14M98 44c12-4 18-14 16-22-8 2-14 8-20 14" fill="none" stroke="#E9DCC5" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="18" cy="56" rx="12" ry="7" fill="#B8693F" transform="rotate(-20 18 56)" />
      <ellipse cx="102" cy="56" rx="12" ry="7" fill="#B8693F" transform="rotate(20 102 56)" />
      <path d="M30 50c0-20 14-30 30-30s30 10 30 30v26c0 18-13 30-30 30S30 94 30 76z" fill="#C97B4E" />
      <path d="M32 46c6-14 18-20 28-20s22 6 28 20c-6-4-10-2-14 2-4-6-10-8-14-2-4-6-10-4-14 0-4-4-8-4-14 0z" fill="#9E5631" />
      <path d="M36 40c4-12 14-18 24-18s20 6 24 18c-8-6-14 2-18 6-2-6-10-6-12 0-4-4-10-12-18-6z" fill="#B0623A" />
      <ellipse cx="60" cy="88" rx="20" ry="14" fill="#E8B49A" />
      <ellipse cx="53" cy="88" rx="3" ry="2.2" fill="#7A4630" /><ellipse cx="67" cy="88" rx="3" ry="2.2" fill="#7A4630" />
      <path d="M48 64c2 2 5 2 7 0M65 64c2 2 5 2 7 0" stroke="#3B2A20" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <circle cx="42" cy="74" r="4" fill="#E99B83" opacity=".6" /><circle cx="78" cy="74" r="4" fill="#E99B83" opacity=".6" />
    </svg>
  );
}

export function Sprig({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden fill="none">
      <path d="M40 76C40 50 42 30 56 10" stroke="var(--moss)" strokeWidth="2.5" strokeLinecap="round" />
      {[[46, 52, -30], [48, 38, 30], [52, 26, -30], [44, 62, 30]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="10" ry="5" fill="var(--sage)" opacity={0.9 - i * 0.12} transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </svg>
  );
}
