"use client";

import { useTexture } from "@react-three/drei";
import { SRGBColorSpace } from "three";

/**
 * Elle boyanmış masa sahnesi.
 *
 * Oda 3B kurulmuyor — tek bir resim sahnenin arkasına geriliyor.
 * BMO bu düzlemin önünde durduğu için kamera yaklaştıkça aralarında
 * kendiliğinden derinlik farkı oluşuyor.
 */
export function Arkaplan({
  en,
  boy,
  kaydir = 0,
}: {
  en: number;
  boy: number;
  kaydir?: number;
}) {
  const doku = useTexture("/sahne/masa.jpg");
  doku.colorSpace = SRGBColorSpace;
  doku.anisotropy = 8;

  return (
    <mesh position={[0, kaydir, 0]}>
      <planeGeometry args={[en, boy]} />
      <meshBasicMaterial map={doku} toneMapped={false} />
    </mesh>
  );
}
