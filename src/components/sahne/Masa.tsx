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
};

/** Kahve fincanı — gövde, kulp ve içindeki kahve. */
function Fincan({ konum }: { konum: [number, number, number] }) {
  return (
    <group position={konum}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.17, 0.34, 28]} />
        <meshStandardMaterial color={RENK.fincan} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.02, 28]} />
        <meshStandardMaterial color={RENK.kahve} roughness={0.2} />
      </mesh>
      <mesh position={[0.23, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.1, 0.028, 12, 28]} />
        <meshStandardMaterial color={RENK.fincan} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** Not defteri — sitenin nasıl gezileceğini anlatan sayfa burada duracak. */
function Defter({ konum }: { konum: [number, number, number] }) {
  return (
    <group position={konum} rotation={[0, -0.35, 0]}>
      <RoundedBox args={[1.1, 0.05, 0.8]} radius={0.02} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={RENK.defterKapak} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.0, 0.7]} />
        <meshStandardMaterial color={RENK.defter} roughness={0.85} />
      </mesh>
      {/* sayfadaki satırlar */}
      {[0.22, 0.1, -0.02, -0.14].map((z, i) => (
        <mesh key={z} position={[-0.06, 0.037, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[i === 0 ? 0.4 : 0.72, 0.022]} />
          <meshBasicMaterial color="#b9b2a2" />
        </mesh>
      ))}
    </group>
  );
}

function Kalem({ konum }: { konum: [number, number, number] }) {
  return (
    <mesh position={konum} rotation={[0, 0.6, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.028, 0.028, 0.7, 12]} />
      <meshStandardMaterial color={RENK.kalem} roughness={0.5} />
    </mesh>
  );
}

function Bitki({ konum }: { konum: [number, number, number] }) {
  return (
    <group position={konum}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.17, 0.32, 20]} />
        <meshStandardMaterial color={RENK.saksi} roughness={0.7} />
      </mesh>
      {[
        [0, 0.34, 0, 0],
        [0.12, 0.28, 0.06, 0.5],
        [-0.11, 0.3, -0.05, -0.6],
      ].map(([x, y, z, egim], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[egim, 0, egim * 0.6]} castShadow>
          <sphereGeometry args={[0.17, 14, 12]} />
          <meshStandardMaterial color={RENK.yaprak} roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

export function Masa() {
  return (
    <group>
      {/* masa yüzeyi */}
      <mesh position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color={RENK.masa} roughness={0.8} />
      </mesh>

      {/* masanın ön kenarı */}
      <mesh position={[0, -1.52, 3.4]} castShadow receiveShadow>
        <boxGeometry args={[18, 0.24, 0.6]} />
        <meshStandardMaterial color={RENK.masaKoyu} roughness={0.8} />
      </mesh>

      <Fincan konum={[2.0, -1.23, 1.0]} />
      <Defter konum={[-2.1, -1.37, 0.9]} />
      <Kalem konum={[-1.5, -1.36, 1.7]} />
      <Bitki konum={[-2.8, -1.24, -0.9]} />
    </group>
  );
}
