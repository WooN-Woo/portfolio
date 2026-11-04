"use client";

import { useMemo } from "react";
import { CanvasTexture } from "three";

/**
 * BMO'nun masaya düşen gölgesi.
 *
 * Gerçek gölge hesaplanmıyor: arkadaki masa düz bir resim, üstüne düşen
 * gerçek gölge yanlış açıda durur. Onun yerine yumuşak bir leke resmin
 * hemen önüne konuyor — gözle aynı işi görüyor, bedava.
 */
function lekeDokusu() {
  const tuval = document.createElement("canvas");
  tuval.width = 128;
  tuval.height = 128;
  const ctx = tuval.getContext("2d");
  if (ctx) {
    const gecis = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gecis.addColorStop(0, "rgba(96, 40, 16, 0.85)");
    gecis.addColorStop(0.45, "rgba(96, 40, 16, 0.5)");
    gecis.addColorStop(1, "rgba(96, 40, 16, 0)");
    ctx.fillStyle = gecis;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new CanvasTexture(tuval);
}

export function Golge({
  konum,
  olcek,
}: {
  konum: [number, number, number];
  olcek: number;
}) {
  const doku = useMemo(() => lekeDokusu(), []);

  return (
    <mesh
      position={[konum[0] - olcek * 0.05, konum[1] - olcek * 0.74, konum[2] + olcek * 0.02]}
      scale={[olcek * 2.1, olcek * 0.6, 1]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={doku} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
