import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import SW from "@/components/SW";

export const metadata: Metadata = {
  title: "Jenny's Little Corner",
  description: "A little space just for you.",
  appleWebApp: { capable: true, title: "Little Corner", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#fbf6ef", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <main className="mx-auto max-w-md px-4 pb-28 pt-6">{children}</main>
        <Nav />
        <SW />
      </body>
    </html>
  );
}
