"use client";

import { useEffect, useRef } from "react";
import { createBmo } from "./bmoCekirdek";

/**
 * Masa sahnesi.
 *
 * Arkada elle çizilmiş tek bir resim var; oda 3B kurulmuyor.
 * BMO ise gerçek 3B ve kendi saydam tuvalinde çiziliyor. Tuval, resmin
 * masa üstündeki boş köşesine denk gelen kutuya yerleştiriliyor —
 * böylece ekran hangi orana gelirse gelsin BMO masadan kaymıyor.
 */

/** Arka plan resminin ölçüsü. Resim değişirse burası da değişir. */
const RESIM = { en: 1672, boy: 941 };

/** Geniş ekranda resmin altı/üstü kırpılır; kırpma masanın lehine kaysın. */
const DIKEY_HIZA = 0.74;

/** BMO'nun resim üzerindeki kutusu (0–1 arası oranlar). */
const BMO_KUTU = { x: 0.095, y: 0.13, en: 0.39, boy: 0.71 };

export function BmoSahne() {
  const sarmalRef = useRef<HTMLDivElement>(null);
  const tuvalRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const tuval = tuvalRef.current;
    if (!tuval) return;

    // BMO'yu kutusuna oturt: resmin ekranda kapladığı alanı hesaplayıp
    // kutunun oranlarını piksele çeviriyoruz.
    const yerlestir = () => {
      const ekranEn = window.innerWidth;
      const ekranBoy = window.innerHeight;

      const olcek = Math.max(ekranEn / RESIM.en, ekranBoy / RESIM.boy);
      const resimEn = RESIM.en * olcek;
      const resimBoy = RESIM.boy * olcek;
      const sol = (ekranEn - resimEn) / 2;
      const ust = (ekranBoy - resimBoy) * DIKEY_HIZA;

      tuval.style.left = `${sol + BMO_KUTU.x * resimEn}px`;
      tuval.style.top = `${ust + BMO_KUTU.y * resimBoy}px`;
      tuval.style.width = `${BMO_KUTU.en * resimEn}px`;
      tuval.style.height = `${BMO_KUTU.boy * resimBoy}px`;
    };

    yerlestir();
    window.addEventListener("resize", yerlestir);

    const bmo = createBmo(tuval);

    return () => {
      window.removeEventListener("resize", yerlestir);
      bmo.dispose();
    };
  }, []);

  return (
    <div className="sahne" ref={sarmalRef}>
      <div
        className="sahne-resim"
        style={{ backgroundPosition: `center ${DIKEY_HIZA * 100}%` }}
      />
      <canvas className="bmo-tuval" ref={tuvalRef} />
    </div>
  );
}
