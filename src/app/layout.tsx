import type { Metadata } from "next";
import {
  Archivo,
  IBM_Plex_Mono,
  Patrick_Hand,
  Press_Start_2P,
  Source_Serif_4,
  VT323,
} from "next/font/google";
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

// Defterin sayfalarındaki el yazısı. Yazılar 3B dokuya çiziliyor, bu yüzden
// font adı CSS değişkeninden okunup canvas'a veriliyor.
const patrickHand = Patrick_Hand({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-el",
  display: "swap",
});

// BMO'nun ekranındaki yazılar — piksel başlık ve LCD gövde
const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-piksel",
  display: "swap",
});

const vt323 = VT323({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-lcd",
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
    <html lang="tr" className={`${archivo.variable} ${sourceSerif.variable} ${plexMono.variable} ${patrickHand.variable} ${pressStart.variable} ${vt323.variable}`}>
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
