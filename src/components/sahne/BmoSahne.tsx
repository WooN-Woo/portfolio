"use client";

import { useEffect, useRef } from "react";
import { games, projects } from "@/content/site";
import { createBmo } from "./bmoCekirdek";
import { createDefter } from "./defter";

/**
 * Masa sahnesi.
 *
 * Arkada elle çizilmiş tek bir resim var; oda 3B kurulmuyor. Önünde iki
 * gerçek 3B nesne duruyor: masanın sol köşesinde BMO, yanında sehpaya
 * yaslanmış açık bir defter. Sayfa kaydırıldıkça defterin sayfaları
 * çevriliyor — her açılım bir proje.
 */

/** Geniş ekranda resmin altı/üstü kırpılır; kırpma masanın lehine kaysın. */
const DIKEY_HIZA = 0.74;

/** Kadraj: BMO sol köşede kalsın, defter ortaya denk gelsin. */
const EV_UZAKLIK = 1.25;
const EV_KAYDIRMA = { x: 0.28, y: 0 };

const sinirla = (deger: number) => Math.min(1, Math.max(0, deger));

/** Defterin sayfaları — oyunlar önce, sonra diğer çalışmalar. */
const SAYFALAR = [
  ...games.map((oyun) => ({
    ad: oyun.title,
    yil: oyun.year,
    ozet: oyun.tagline,
    kunye: [oyun.role, oyun.engine, oyun.status].filter(Boolean) as string[],
    etiketler: oyun.tags ?? [],
    gorsel: oyun.cover ?? oyun.images?.[0]?.src ?? null,
  })),
  ...projects.map((proje) => ({
    ad: proje.title,
    yil: proje.year,
    ozet: proje.summary,
    kunye: [proje.role, proje.status].filter(Boolean) as string[],
    etiketler: proje.stack ?? [],
    gorsel: proje.images?.[0]?.src ?? null,
  })),
];

export function BmoSahne() {
  const izRef = useRef<HTMLDivElement>(null);
  const tuvalRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const iz = izRef.current;
    const tuval = tuvalRef.current;
    if (!iz || !tuval) return;

    const bmo = createBmo(tuval, {
      evUzaklik: EV_UZAKLIK,
      evKaydirma: EV_KAYDIRMA,
    });

    const defter = createDefter({
      scene: bmo.scene,
      renderer: bmo.renderer,
      projeler: SAYFALAR,
    });

    const guncelle = () => {
      const kutu = iz.getBoundingClientRect();
      const yol = kutu.height - window.innerHeight;
      defter.setIlerleme(yol > 0 ? sinirla(-kutu.top / yol) : 0);
    };

    guncelle();
    window.addEventListener("scroll", guncelle, { passive: true });
    window.addEventListener("resize", guncelle);

    return () => {
      window.removeEventListener("scroll", guncelle);
      window.removeEventListener("resize", guncelle);
      defter.dispose();
      bmo.dispose();
    };
  }, []);

  return (
    <div
      className="bmo-iz"
      ref={izRef}
      style={{ height: `${SAYFALAR.length * 100}vh` }}
    >
      <div className="bmo-sahne">
        <div className="bmo-oda">
          <div
            className="bmo-oda-arka"
            style={{ backgroundPosition: `center ${DIKEY_HIZA * 100}%` }}
          />
          <canvas className="bmo-tuval" ref={tuvalRef} />
        </div>
      </div>
    </div>
  );
}
