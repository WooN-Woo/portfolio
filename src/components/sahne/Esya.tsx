"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import { esyaSec } from "@/lib/esya";

/**
 * Masadaki eşyaları saran kabuk: üzerine gelince hafifçe kalkar,
 * tıklanınca notu açılır.
 */
export function Esya({
  anahtar,
  konum,
  children,
}: {
  anahtar: string;
  konum: [number, number, number];
  children: ReactNode;
}) {
  const ref = useRef<Group>(null);
  const [uzerinde, setUzerinde] = useState(false);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const hedef = konum[1] + (uzerinde ? 0.045 : 0);
    ref.current.position.y += (hedef - ref.current.position.y) * Math.min(1, delta * 10);
  });

  return (
    <group
      ref={ref}
      position={konum}
      onPointerOver={(olay) => {
        olay.stopPropagation();
        setUzerinde(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setUzerinde(false);
        document.body.style.cursor = "";
      }}
      onClick={(olay) => {
        olay.stopPropagation();
        esyaSec(anahtar);
      }}
    >
      {children}
    </group>
  );
}
