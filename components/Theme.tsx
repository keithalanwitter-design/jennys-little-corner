"use client";
import { useEffect } from "react";
import { useData } from "@/lib/store";
export default function Theme() {
  const { data } = useData();
  const t = data?.profile.theme;
  useEffect(() => {
    if (!t) return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", t === "dark" || (t === "system" && mq.matches));
    apply(); mq.addEventListener("change", apply); return () => mq.removeEventListener("change", apply);
  }, [t]);
  return null;
}
