"use client";

import { useEffect, useRef } from "react";
import { createBmo } from "./bmoCekirdek";
import { TvEkran } from "./TvEkran";

/**
 * Masa sahnesi ve BMO'nun ekranına giriş.
 *
 * Kurgu: arkada elle çizilmiş tek bir resim, önünde gerçek 3B BMO.
 * Sayfa kaydıkça kamera BMO'nun ekranına doğru uçuyor. Oda düz bir resim
 * olduğu için kamerayla birlikte hareket edemez — o yüzden zoom başlar
 * başlamaz sönüyor. Yol bitince ekranın yerini gerçek HTML katmanı alıyor,
 * böylece yazılar net ve seçilebilir kalıyor.
 */

/** Geniş ekranda resmin altı/üstü kırpılır; kırpma masanın lehine kaysın. */
const DIKEY_HIZA = 0.74;

/** BMO'nun kadrajdaki yeri — masanın boş köşesine denk gelsin diye. */
const EV_UZAKLIK = 1.05;
const EV_KAYDIRMA = { x: 0.19, y: 0.12 };

/** Oda hangi noktada tamamen sönsün (0–1 arası kaydırma ilerlemesi). */
const ODA_SONME = 0.33;

/** HTML ekran katmanının devreye girdiği nokta. */
const TV_BASLANGIC = 0.92;

const sinirla = (deger: number) => Math.min(1, Math.max(0, deger));

export function BmoSahne() {
  const izRef = useRef<HTMLDivElement>(null);
  const tuvalRef = useRef<HTMLCanvasElement>(null);
  const arkaRef = useRef<HTMLDivElement>(null);
  const tvRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const iz = izRef.current;
    const tuval = tuvalRef.current;
    const arka = arkaRef.current;
    const tv = tvRef.current;
    if (!iz || !tuval || !arka || !tv) return;

    const bmo = createBmo(tuval, {
      evUzaklik: EV_UZAKLIK,
      evKaydirma: EV_KAYDIRMA,
    });

    const guncelle = () => {
      const kutu = iz.getBoundingClientRect();
      const yol = kutu.height - window.innerHeight;
      const ilerleme = yol > 0 ? sinirla(-kutu.top / yol) : 0;

      bmo.setZoom(ilerleme);
      arka.style.opacity = String(1 - sinirla(ilerleme / ODA_SONME));

      const tvGorunur = sinirla((ilerleme - TV_BASLANGIC) / (1 - TV_BASLANGIC));
      tv.style.opacity = String(tvGorunur);
      tv.style.visibility = tvGorunur > 0 ? "visible" : "hidden";
      tv.style.pointerEvents = tvGorunur > 0.9 ? "auto" : "none";
      // Ekran tamamen kapandığında 3B çizimi durdur, boşuna işlem olmasın
      bmo.setPaused(tvGorunur === 1);
    };

    guncelle();
    window.addEventListener("scroll", guncelle, { passive: true });
    window.addEventListener("resize", guncelle);

    return () => {
      window.removeEventListener("scroll", guncelle);
      window.removeEventListener("resize", guncelle);
      bmo.dispose();
    };
  }, []);

  return (
    <div className="bmo-iz" ref={izRef}>
      <div className="bmo-sahne">
        <div className="bmo-oda">
          <div
            className="bmo-oda-arka"
            ref={arkaRef}
            style={{ backgroundPosition: `center ${DIKEY_HIZA * 100}%` }}
          />
          <canvas className="bmo-tuval" ref={tuvalRef} />
        </div>

        <div className="bmo-tv" ref={tvRef}>
          <div className="bmo-tv-ic">
            <TvEkran />
          </div>
        </div>
      </div>
    </div>
  );
}
