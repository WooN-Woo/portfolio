"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { NoToneMapping } from "three";
import { Suspense, useMemo } from "react";
import { Arkaplan } from "./Arkaplan";
import { Bmo } from "./Bmo";
import { Golge } from "./Golge";
import { Kamera, BASLANGIC_Z } from "./Kamera";

/**
 * Masa sahnesi.
 *
 * Kurgu: arkada tek bir boyalı resim, önünde tek gerçek 3B nesne (BMO).
 * Kamera kaydırmayla BMO'ya doğru ilerliyor; BMO resmin önünde durduğu
 * için arkadaki sahneden daha hızlı büyüyor — derinlik buradan geliyor.
 */

/** Arka plan resminin en/boy oranı. Resim değişirse burası da değişmeli. */
const RESIM_ORANI = 1672 / 941;

/** BMO'nun resim üzerindeki yeri (0–1 arası, sol üstten). */
const BMO_YERI = { x: 0.275, y: 0.535 };

/** BMO gövdesinin genişliği, resim genişliğinin oranı olarak. */
const BMO_GENISLIK = 0.135;

const GORUS_ACISI = 30;

/**
 * Geniş ekranda resmin altı ve üstü kırpılıyor. Bu değer kırpmayı masanın
 * lehine kaydırıyor: 0 = ortala, 1 = masanın alt kenarı her zaman görünsün.
 */
const ALT_ANKOR = 0.8;

function Dunya() {
  const en = useThree((s) => s.size.width);
  const boy = useThree((s) => s.size.height);

  const duzlem = useMemo(() => {
    // Kameranın başlangıç mesafesinde ekranı tam dolduran düzlem ölçüsü
    const gorunenBoy = 2 * Math.tan((GORUS_ACISI * Math.PI) / 180 / 2) * BASLANGIC_Z;
    const gorunenEn = gorunenBoy * (en / boy);

    // "cover": resim ekranı her zaman doldursun, boşluk kalmasın
    const olcek = Math.max(gorunenEn / RESIM_ORANI, gorunenBoy);
    const fazla = Math.max(0, olcek - gorunenBoy);
    return {
      en: RESIM_ORANI * olcek,
      boy: olcek,
      // düzlemi yukarı kaydır: kırpma üstten olsun, masa kadrajda kalsın
      kaydir: (fazla / 2) * ALT_ANKOR,
    };
  }, [en, boy]);

  const bmo = useMemo(() => {
    const olcek = BMO_GENISLIK * duzlem.en;
    return {
      konum: [
        (BMO_YERI.x - 0.5) * duzlem.en,
        (0.5 - BMO_YERI.y) * duzlem.boy + duzlem.kaydir,
        olcek * 0.22,
      ] as [number, number, number],
      olcek,
    };
  }, [duzlem]);

  return (
    <>
      <Kamera hedef={bmo.konum} hedefOlcek={bmo.olcek} />

      <ambientLight intensity={0.78} color="#fff1dc" />
      {/* soldaki pencereden gelen ışık */}
      <directionalLight position={[-3, 2.2, 4]} intensity={1.25} color="#ffe6bd" />
      {/* karşıdan yumuşak dolgu */}
      <directionalLight position={[3, 0.5, 2]} intensity={0.35} color="#cfe6ff" />

      <Suspense fallback={null}>
        <Arkaplan en={duzlem.en} boy={duzlem.boy} kaydir={duzlem.kaydir} />
      </Suspense>

      <Golge konum={bmo.konum} olcek={bmo.olcek} />
      <Bmo konum={bmo.konum} olcek={bmo.olcek} donus={0.7} egim={-0.07} />
    </>
  );
}

export function Sahne() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, BASLANGIC_Z], fov: GORUS_ACISI }}
      gl={{ antialias: true, toneMapping: NoToneMapping }}
    >
      <color attach="background" args={["#2b1d14"]} />
      <Dunya />
    </Canvas>
  );
}
