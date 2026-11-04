"use client";

import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import { CanvasTexture } from "three";
import { Esya } from "./Esya";
import { Buhar } from "./Buhar";

/** Masa yüzeyi ve üstündeki eşyalar. Hepsi temel şekillerden. */

const RENK = {
  masa: "#b98a5e",
  masaKoyu: "#9c7049",
  fincan: "#f0ece4",
  kahve: "#4a2f20",
  defterKapak: "#c4553f",
  kalem: "#f2b544",
  saksi: "#c9755a",
  yaprak: "#5f9e62",
  kulaklik: "#f2f0ec",
};

/** Defterin açık sayfası — sitenin nasıl gezileceğini anlatıyor. */
function sayfaDokusu() {
  const tuval = document.createElement("canvas");
  tuval.width = 1024;
  tuval.height = 640;
  const c = tuval.getContext("2d");
  if (!c) return null;

  c.fillStyle = "#ece6d8";
  c.fillRect(0, 0, 1024, 640);

  // sayfa çizgileri
  c.strokeStyle = "rgba(90,110,120,0.16)";
  c.lineWidth = 2;
  for (let y = 120; y < 640; y += 54) {
    c.beginPath();
    c.moveTo(60, y);
    c.lineTo(964, y);
    c.stroke();
  }

  // orta kıvrım
  c.fillStyle = "rgba(0,0,0,0.07)";
  c.fillRect(506, 0, 12, 640);

  c.fillStyle = "#2f4a40";
  c.font = "bold 46px Georgia, serif";
  c.fillText("Nasıl gezilir", 60, 86);

  c.font = "30px Georgia, serif";
  c.fillStyle = "#3d5349";
  const satirlar = [
    "↓  Aşağı kaydır — BMO'nun",
    "    ekranına yaklaşırsın.",
    "",
    "○  Masadaki eşyalara tıkla,",
    "    kısa notlar açılır.",
    "",
    "▭  Sağ üstteki pil, sayfanın",
    "    ne kadarını gezdiğini gösterir.",
  ];
  satirlar.forEach((s, i) => c.fillText(s, 60, 168 + i * 54));

  const doku = new CanvasTexture(tuval);
  doku.anisotropy = 4;
  return doku;
}

function Fincan() {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.095, 0.19, 28]} />
        <meshStandardMaterial color={RENK.fincan} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.088, 0]}>
        <cylinderGeometry args={[0.092, 0.092, 0.012, 28]} />
        <meshStandardMaterial color={RENK.kahve} roughness={0.2} />
      </mesh>
      <mesh position={[0.128, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.055, 0.016, 12, 28]} />
        <meshStandardMaterial color={RENK.fincan} roughness={0.35} />
      </mesh>
      <Buhar konum={[0, 0.12, 0]} />
    </group>
  );
}

function Defter() {
  const doku = useMemo(() => (typeof document === "undefined" ? null : sayfaDokusu()), []);

  return (
    <group rotation={[0, -0.3, 0]}>
      <RoundedBox args={[1.02, 0.035, 0.66]} radius={0.02} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={RENK.defterKapak} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.96, 0.6]} />
        {doku ? (
          <meshStandardMaterial map={doku} roughness={0.9} />
        ) : (
          <meshStandardMaterial color="#ece6d8" roughness={0.9} />
        )}
      </mesh>
    </group>
  );
}

function Kulaklik() {
  return (
    <group rotation={[0, 0.5, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.2, 0.028, 10, 24, Math.PI]} />
        <meshStandardMaterial color={RENK.kulaklik} roughness={0.4} />
      </mesh>
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.07, 20]} />
          <meshStandardMaterial color={RENK.kulaklik} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function Bitki() {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.095, 0.18, 20]} />
        <meshStandardMaterial color={RENK.saksi} roughness={0.7} />
      </mesh>
      {[
        [0, 0.19, 0, 0],
        [0.07, 0.16, 0.035, 0.5],
        [-0.065, 0.17, -0.03, -0.6],
      ].map(([x, y, z, egim], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[egim, 0, egim * 0.6]} castShadow>
          <sphereGeometry args={[0.1, 14, 12]} />
          <meshStandardMaterial color={RENK.yaprak} roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

export function Masa() {
  return (
    <group>
      <mesh position={[0, -0.34, 0.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 7]} />
        <meshStandardMaterial color={RENK.masa} roughness={0.72} />
      </mesh>

      <mesh position={[0, -0.42, 2.5]} castShadow receiveShadow>
        <boxGeometry args={[16, 0.16, 0.5]} />
        <meshStandardMaterial color={RENK.masaKoyu} roughness={0.75} />
      </mesh>

      <Esya anahtar="defter" konum={[0.1, -0.33, 0.75]}>
        <Defter />
      </Esya>
      <Esya anahtar="kahve" konum={[1.15, -0.26, 0.55]}>
        <Fincan />
      </Esya>
      <Esya anahtar="kulaklik" konum={[1.95, -0.3, 0.8]}>
        <Kulaklik />
      </Esya>
      <Esya anahtar="bitki" konum={[2.35, -0.26, -0.25]}>
        <Bitki />
      </Esya>

      <mesh position={[-0.55, -0.32, 1.35]} rotation={[0, 0.6, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.4, 12]} />
        <meshStandardMaterial color={RENK.kalem} roughness={0.5} />
      </mesh>
    </group>
  );
}
