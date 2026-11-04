"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { aralik, ilerleme, yumusat } from "@/lib/kaydirma";

/**
 * Kamera koreografisi.
 *
 * Kamera dönmüyor, sadece ileri gidip yana kayıyor. Dönmemesinin sebebi:
 * arkadaki sahne düz bir resim — kamera açılanırsa resmin perspektifi bozulur.
 * İleri gitmek ise BMO'yu arkadaki resimden daha hızlı büyütüyor, derinlik
 * hissi buradan çıkıyor.
 */

export const BASLANGIC_Z = 5;

/** BMO'nun ekranı kadraja oturduğu mesafe. */
const YAKIN_Z = 1.75;

/** Farenin sahneyi ne kadar oynatacağı. */
const FARE_ETKISI = 0.05;

export function Kamera({
  hedef,
  hedefOlcek,
}: {
  hedef: [number, number, number];
  hedefOlcek: number;
}) {
  const { camera } = useThree();
  const simdiki = useRef(new Vector3(0, 0, BASLANGIC_Z));
  const fare = useRef({ x: 0, y: 0 });

  useFrame(({ pointer }, delta) => {
    // fare hafif gecikmeyle takip etsin
    fare.current.x += (pointer.x - fare.current.x) * Math.min(1, delta * 3);
    fare.current.y += (pointer.y - fare.current.y) * Math.min(1, delta * 3);

    const t = yumusat(aralik(ilerleme.deger, 0, 0.6));

    // BMO'nun ekranının ortası — yaklaşırken kadrajın merkezi burası
    const ekranY = hedef[1] + hedefOlcek * 0.15;

    const hedefKonum = new Vector3(
      hedef[0] * t + fare.current.x * FARE_ETKISI,
      ekranY * t + fare.current.y * FARE_ETKISI * 0.6,
      BASLANGIC_Z + (YAKIN_Z - BASLANGIC_Z) * t,
    );

    // yumuşak takip — ani kaydırmada kamera sıçramasın
    simdiki.current.lerp(hedefKonum, Math.min(1, delta * 7));
    camera.position.copy(simdiki.current);
  });

  return null;
}
