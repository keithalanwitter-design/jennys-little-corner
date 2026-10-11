"use client";
import { useEffect, useState } from "react";
/** Tabs that deep-link: /move#mobility opens the Mobility tab. */
export function useHashTab<T extends string>(initial: T, tabs: readonly { id: T }[]) {
  const [tab, setTab] = useState<T>(initial);
  useEffect(() => {
    const read = () => { const h = decodeURIComponent(location.hash.slice(1)) as T; if (tabs.some((t) => t.id === h)) setTab(h); };
    read(); window.addEventListener("hashchange", read); return () => window.removeEventListener("hashchange", read);
  }, [tabs]);
  return [tab, setTab] as const;
}
