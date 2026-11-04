"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { ilerleme, yumusat } from "@/lib/kaydirma";

/**
 * Kamerayı kaydırmaya göre masadan BMO'nun ekranına yaklaştırır.
 * Başlangıç ve bitiş noktaları buradaki sabitler; sahneyi ayarlarken
 * değiştirilecek yer burası.
 */

const BASLANGIC = new Vector3(0, 0.42, 3.5);
const BITIS = new Vector3(-1.18, 0.1, 0.95);

const BAKIS_BAS = new Vector3(-0.2, 0.05, 0.3);
const BAKIS_BIT = new Vector3(-1.383, 0.098, 0.443);

export function Kamera() {
  const { camera } = useThree();
  const konum = useRef(BASLANGIC.clone());
  const bakis = useRef(BAKIS_BAS.clone());

  useFrame((_, delta) => {
    const t = yumusat(ilerleme.deger);

    const hedefKonum = BASLANGIC.clone().lerp(BITIS, t);
    const hedefBakis = BAKIS_BAS.clone().lerp(BAKIS_BIT, t);

    // yumuşak takip — ani kaydırmada kamera sıçramasın
    const yumusakluk = Math.min(1, delta * 6);
    konum.current.lerp(hedefKonum, yumusakluk);
    bakis.current.lerp(hedefBakis, yumusakluk);

    camera.position.copy(konum.current);
    camera.lookAt(bakis.current);
  });

  return null;
}
