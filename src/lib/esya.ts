"use client";

import { useSyncExternalStore } from "react";

/** Masadaki eşyalara tıklanınca açılan notlar. */
export type EsyaNotu = {
  baslik: string;
  metin: string;
};

export const ESYA_NOTLARI: Record<string, EsyaNotu> = {
  kahve: {
    baslik: "Kahve",
    metin:
      "Günde üç tane. İlki kod yazmadan önce, ikincisi bir şey çalışmayınca, üçüncüsü çalışınca.",
  },
  kulaklik: {
    baslik: "Kulaklık",
    metin:
      "Çalışırken hep takılı. Mekanik üzerinde uğraşırken sözsüz bir şeyler, bug ararken sessizlik.",
  },
  bitki: {
    baslik: "Bitki",
    metin: "Masadaki tek canlı. Sulamayı unutmamaya çalışıyorum.",
  },
  defter: {
    baslik: "Defter",
    metin:
      "Bir mekaniği koda dökmeden önce buraya çiziyorum. Sitenin planı da burada duruyor.",
  },
  bmo: {
    baslik: "BMO",
    metin: "Aşağı kaydır — ekranına girelim.",
  },
};

let secili: string | null = null;
const dinleyiciler = new Set<() => void>();

function yayinla() {
  for (const d of dinleyiciler) d();
}

export function esyaSec(anahtar: string | null) {
  secili = anahtar;
  yayinla();
}

function abone(d: () => void) {
  dinleyiciler.add(d);
  return () => dinleyiciler.delete(d);
}

const oku = () => secili;

/** Seçili eşyayı döner. Sunucuda hep boş. */
export function useSeciliEsya() {
  return useSyncExternalStore(abone, oku, () => null);
}
