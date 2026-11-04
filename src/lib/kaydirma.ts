"use client";

import { useEffect, useState } from "react";

/**
 * Sayfanın ne kadar kaydırıldığı (0–1).
 *
 * Değer bir nesnenin içinde tutuluyor: 3B sahne her karede buradan okuyor,
 * böylece kaydırma sırasında React'i yeniden çizmeye zorlamıyoruz.
 */
export const ilerleme = { deger: 0 };

function hesapla() {
  const alan = document.documentElement.scrollHeight - window.innerHeight;
  ilerleme.deger = alan > 0 ? Math.min(1, Math.max(0, window.scrollY / alan)) : 0;
}

/** Kaydırmayı dinler. Arayüzde de göstermek isteyen bileşenler değeri alır. */
export function useKaydirma(arayuzeYansit = false) {
  const [deger, setDeger] = useState(0);

  useEffect(() => {
    let bekleyen = false;

    const guncelle = () => {
      hesapla();
      if (arayuzeYansit && !bekleyen) {
        bekleyen = true;
        requestAnimationFrame(() => {
          setDeger(ilerleme.deger);
          bekleyen = false;
        });
      }
    };

    guncelle();
    window.addEventListener("scroll", guncelle, { passive: true });
    window.addEventListener("resize", guncelle);
    return () => {
      window.removeEventListener("scroll", guncelle);
      window.removeEventListener("resize", guncelle);
    };
  }, [arayuzeYansit]);

  return deger;
}

/** Yumuşak geçiş eğrisi — başta ve sonda yavaşlar. */
export function yumusat(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Bir aralığı 0–1'e sıkıştırır. */
export function aralik(t: number, bas: number, bit: number) {
  return Math.min(1, Math.max(0, (t - bas) / (bit - bas)));
}
