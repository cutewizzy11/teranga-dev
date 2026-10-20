import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLang } from "@/lib/auth";
import { Header } from "@/components/header";
import { dict } from "@/lib/i18n";
import "./globals.css";

const sans = Geist({ variable: "--font-sans-family", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono-family", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Teranga Dev", template: "%s · Teranga Dev" },
  description: "La plateforme d'entraide des développeurs africains, en français et en anglais. The help network for African developers.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#14110e" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  const t = dict(lang);
  return (
    <html lang={lang} className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-border py-6 text-center text-sm text-muted">
          {t.brand} — {t.tagline}
        </footer>
      </body>
    </html>
  );
}
