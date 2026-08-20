import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import { profile } from "@/content/site";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-mono-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description: profile.metaDescription,
  openGraph: {
    title: `${profile.name} — ${profile.role}`,
    description: profile.metaDescription,
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${archivo.variable} ${sourceSerif.variable} ${plexMono.variable}`}>
      <body>
        {/* JavaScript kapalıysa hareketler devre dışı kalır, içerik olduğu gibi görünür. */}
        <noscript>
          <style>{`.reveal,.giris,.hero-satir>span{opacity:1!important;transform:none!important}.work-item::after{transform:scaleX(1)!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
