"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, Group, Mesh } from "three";

/** Fincandan yükselen buhar — birkaç yumuşak leke yukarı süzülüp siliniyor. */

function bulutDokusu() {
  const tuval = document.createElement("canvas");
  tuval.width = tuval.height = 64;
  const c = tuval.getContext("2d");
  if (c) {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(tuval);
}

const ADET = 7;

export function Buhar({ konum }: { konum: [number, number, number] }) {
  const grup = useRef<Group>(null);
  const doku = useMemo(() => (typeof document === "undefined" ? null : bulutDokusu()), []);

  useFrame(({ clock }) => {
    if (!grup.current) return;
    const t = clock.getElapsedTime();

    grup.current.children.forEach((cocuk, i) => {
      const parca = cocuk as Mesh;
      const faz = (t * 0.32 + i / ADET) % 1;

      parca.position.y = faz * 0.55;
      parca.position.x = Math.sin(faz * 5 + i) * 0.045 * faz;
      const olcek = 0.07 + faz * 0.16;
      parca.scale.setScalar(olcek);

      const mat = parca.material as { opacity: number };
      mat.opacity = Math.sin(faz * Math.PI) * 0.5;
    });
  });

  if (!doku) return null;

  return (
    <group ref={grup} position={konum}>
      {Array.from({ length: ADET }).map((_, i) => (
        <mesh key={i}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={doku} transparent depthWrite={false} opacity={0} />
        </mesh>
      ))}
    </group>
  );
}
