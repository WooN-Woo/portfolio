"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

/**
 * BMO — gövde, ekran, düğmeler ve bacaklar temel şekillerden kuruluyor.
 * Oranlar ve renkler buradaki sabitlerden geliyor, tek yerden ayarlanıyor.
 */

const RENK = {
  govde: "#6ec8a8",
  govdeKoyu: "#4fa98b",
  ekranCerceve: "#3f5f54",
  ekran: "#c9e6d4",
  yuz: "#22312b",
  dpad: "#2f4374",
  kirmizi: "#d94f45",
  mavi: "#3d6fc4",
  sari: "#edc443",
  yesil: "#5fb45a",
  bacak: "#5bb595",
};

/** Yuvarlak düğme. */
function Dugme({
  konum,
  renk,
  yaricap = 0.075,
}: {
  konum: [number, number, number];
  renk: string;
  yaricap?: number;
}) {
  return (
    <mesh position={konum} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[yaricap, yaricap, 0.055, 24]} />
      <meshStandardMaterial color={renk} roughness={0.35} />
    </mesh>
  );
}

/** Yön tuşu — iki dikdörtgenin üst üste binmesiyle artı şekli. */
function YonTusu({ konum }: { konum: [number, number, number] }) {
  return (
    <group position={konum}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.1, 0.05]} />
        <meshStandardMaterial color={RENK.dpad} roughness={0.4} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[0.1, 0.3, 0.05]} />
        <meshStandardMaterial color={RENK.dpad} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Ekrandaki yüz — iki göz ve bir ağız. */
function Yuz({ z }: { z: number }) {
  return (
    <group position={[0, 0.52, z]}>
      <mesh position={[-0.22, 0.06, 0]}>
        <circleGeometry args={[0.062, 24]} />
        <meshBasicMaterial color={RENK.yuz} />
      </mesh>
      <mesh position={[0.22, 0.06, 0]}>
        <circleGeometry args={[0.062, 24]} />
        <meshBasicMaterial color={RENK.yuz} />
      </mesh>
      <mesh position={[0, -0.14, 0]}>
        <boxGeometry args={[0.16, 0.035, 0.001]} />
        <meshBasicMaterial color={RENK.yuz} />
      </mesh>
    </group>
  );
}

export function Bmo({
  konum = [0, 0, 0] as [number, number, number],
  olcek = 1,
  donus = 0,
}: {
  konum?: [number, number, number];
  olcek?: number;
  donus?: number;
}) {
  const ref = useRef<Group>(null);

  // Hafif nefes alma hareketi — duran sahneyi canlı tutuyor
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = konum[1] + Math.sin(t * 1.1) * 0.012;
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.006;
  });

  const derinlik = 0.42;
  const onYuz = derinlik / 2;

  return (
    <group ref={ref} position={konum} scale={olcek} rotation={[0, donus, 0]}>
      {/* gövde */}
      <RoundedBox args={[1.5, 1.95, derinlik]} radius={0.17} smoothness={5} castShadow receiveShadow>
        <meshStandardMaterial color={RENK.govde} roughness={0.55} />
      </RoundedBox>

      {/* ekran çerçevesi */}
      <RoundedBox
        args={[1.14, 0.84, 0.06]}
        radius={0.07}
        smoothness={4}
        position={[0, 0.52, onYuz - 0.005]}
      >
        <meshStandardMaterial color={RENK.ekranCerceve} roughness={0.6} />
      </RoundedBox>

      {/* ekran yüzeyi */}
      <mesh position={[0, 0.52, onYuz + 0.028]}>
        <planeGeometry args={[1.0, 0.7]} />
        <meshStandardMaterial color={RENK.ekran} roughness={0.25} />
      </mesh>

      <Yuz z={onYuz + 0.03} />

      {/* yön tuşu ve düğmeler */}
      <YonTusu konum={[-0.46, -0.44, onYuz + 0.01]} />
      <Dugme konum={[0.42, -0.34, onYuz + 0.01]} renk={RENK.mavi} />
      <Dugme konum={[0.6, -0.5, onYuz + 0.01]} renk={RENK.kirmizi} />
      <Dugme konum={[0.24, -0.5, onYuz + 0.01]} renk={RENK.sari} yaricap={0.055} />
      <Dugme konum={[0.42, -0.66, onYuz + 0.01]} renk={RENK.yesil} yaricap={0.055} />

      {/* alt sıradaki küçük düğmeler */}
      <Dugme konum={[-0.18, -0.78, onYuz + 0.01]} renk={RENK.govdeKoyu} yaricap={0.04} />
      <Dugme konum={[-0.02, -0.78, onYuz + 0.01]} renk={RENK.govdeKoyu} yaricap={0.04} />

      {/* bacaklar */}
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, -1.05, 0.26]} rotation={[0.95, 0, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.17, 0.7, 20]} />
          <meshStandardMaterial color={RENK.bacak} roughness={0.6} />
        </mesh>
      ))}

      {/* kollar */}
      {[-0.86, 0.86].map((x) => (
        <mesh key={x} position={[x, -0.3, 0]} rotation={[0, 0, x < 0 ? 0.25 : -0.25]} castShadow>
          <capsuleGeometry args={[0.075, 0.5, 6, 14]} />
          <meshStandardMaterial color={RENK.bacak} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
