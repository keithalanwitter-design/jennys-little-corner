import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { BASE } from "@/lib/base";
import Nav from "@/components/Nav";
import SW from "@/components/SW";
import Theme from "@/components/Theme";
import SyncBoot from "@/components/SyncBoot";
import Toaster from "@/components/Toaster";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["SOFT", "opsz"] });
const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Jenny's Little Corner",
  description: "A little space just for you: nourish, move, unwind.",
  manifest: `${BASE}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: "Little Corner", statusBarStyle: "default" },
  icons: { icon: `${BASE}/icon.svg`, apple: `${BASE}/apple-touch-icon.png` },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8f4ec" }, { media: "(prefers-color-scheme: dark)", color: "#1d1a17" }], width: "device-width", initialScale: 1, viewportFit: "cover" };

const themeScript = `try{var d=JSON.parse(localStorage.getItem('jlc-data-v1')||'{}');var t=(d.profile&&d.profile.theme)||'system';if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-dvh antialiased">
        <div className="relative z-10 lg:flex">
          <Nav />
          <main className="mx-auto w-full max-w-md px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:max-w-2xl lg:max-w-5xl lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
        </div>
        <SW /><Theme /><SyncBoot /><Toaster />
      </body>
    </html>
  );
}
