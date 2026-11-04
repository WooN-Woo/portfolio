"use client";

import { RoundedBox } from "@react-three/drei";

/** Masa yüzeyi ve üstündeki eşyalar. Hepsi temel şekillerden. */

const RENK = {
  masa: "#b98a5e",
  masaKoyu: "#9c7049",
  fincan: "#f0ece4",
  kahve: "#4a2f20",
  defter: "#e8e2d4",
  defterKapak: "#c4553f",
  kalem: "#f2b544",
  saksi: "#c9755a",
  yaprak: "#5f9e62",
  kulaklik: "#f2f0ec",
};

/** Kahve fincanı — gövde, kulp ve içindeki kahve. */
function Fincan({ konum }: { konum: [number, number, number] }) {
  return (
    <group position={konum}>
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
    </group>
  );
}

/** Not defteri — sitenin nasıl gezileceğini anlatan sayfa burada duracak. */
function Defter({ konum }: { konum: [number, number, number] }) {
  return (
    <group position={konum} rotation={[0, -0.35, 0]}>
      <RoundedBox args={[1.02, 0.035, 0.66]} radius={0.02} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={RENK.defterKapak} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.95, 0.6]} />
        <meshStandardMaterial color={RENK.defter} roughness={0.85} />
      </mesh>
      {/* sayfadaki satırlar */}
      {[0.22, 0.1, -0.02, -0.14].map((z, i) => (
        <mesh key={z} position={[-0.06, 0.027, z * 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[i === 0 ? 0.34 : 0.62, 0.016]} />
          <meshBasicMaterial color="#b9b2a2" />
        </mesh>
      ))}
    </group>
  );
}

function Kalem({ konum }: { konum: [number, number, number] }) {
  return (
    <mesh position={konum} rotation={[0, 0.6, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.016, 0.016, 0.4, 12]} />
      <meshStandardMaterial color={RENK.kalem} roughness={0.5} />
    </mesh>
  );
}

function Bitki({ konum }: { konum: [number, number, number] }) {
  return (
    <group position={konum}>
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


/** Kulaklık — masada yan yatıyor. */
function Kulaklik({ konum }: { konum: [number, number, number] }) {
  return (
    <group position={konum} rotation={[0, 0.5, 0]}>
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

export function Masa() {
  return (
    <group>
      {/* masa yüzeyi */}
      <mesh position={[0, -0.34, 0.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 7]} />
        <meshStandardMaterial color={RENK.masa} roughness={0.72} />
      </mesh>

      {/* masanın ön kenarı */}
      <mesh position={[0, -0.42, 2.5]} castShadow receiveShadow>
        <boxGeometry args={[16, 0.16, 0.5]} />
        <meshStandardMaterial color={RENK.masaKoyu} roughness={0.75} />
      </mesh>

      <Defter konum={[0.1, -0.33, 0.75]} />
      <Fincan konum={[1.15, -0.26, 0.55]} />
      <Kulaklik konum={[1.95, -0.3, 0.8]} />
      <Bitki konum={[2.35, -0.26, -0.25]} />
      <Kalem konum={[-0.55, -0.32, 1.35]} />
    </group>
  );
}
