import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Header } from "@/components/header";
import { LogoMark, Wordmark } from "@/components/logo";
import { getLang } from "@/lib/auth";
import { dict } from "@/lib/i18n";
import "./globals.css";

const sans = Geist({ variable: "--font-sans-family", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono-family", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Teranga Dev", template: "%s · Teranga Dev" },
  description: "The help network for African developers, in English and French. La plateforme d'entraide des développeurs africains.",
};

export const viewport: Viewport = { themeColor: "#08090c" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  const t = dict(lang);
  return (
    <html lang={lang} className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">{children}</main>
        <footer className="mt-16 border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted">
            <div className="flex items-center gap-2.5">
              <LogoMark size={22} />
              <Wordmark />
              <span className="hidden sm:inline">— {t.tagline}</span>
            </div>
            <nav className="flex items-center gap-5">
              <Link href="/questions" className="hover:text-text">{t.nav.questions}</Link>
              <Link href="/leaderboard" className="hover:text-text">{t.nav.leaderboard}</Link>
              <span className="kbd">CADEV 2026</span>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
