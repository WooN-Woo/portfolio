"use client";

import { RoundedBox } from "@react-three/drei";

/**
 * Masanın arkasındaki oda: duvar, raflar, pencereler ve ışık dizisi.
 * Derinlik hissini ve sıcaklığı büyük ölçüde bu katman veriyor.
 */

const RENK = {
  duvar: "#8a6244",
  duvarKoyu: "#6f4d35",
  raf: "#a67a52",
  pencere: "#cfe7f2",
  pencereCerceve: "#7a5538",
  ampul: "#ffd98a",
  kitap: ["#b4573f", "#4a7a6a", "#c08a3e", "#6a5a8a", "#7a9a54"],
};

function Pencere({ konum }: { konum: [number, number, number] }) {
  return (
    <group position={konum}>
      {/* gökyüzü */}
      <mesh>
        <planeGeometry args={[1.5, 1.8]} />
        <meshBasicMaterial color={RENK.pencere} />
      </mesh>
      {/* çerçeve */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.07, 1.8, 0.07]} />
        <meshStandardMaterial color={RENK.pencereCerceve} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[1.5, 0.07, 0.07]} />
        <meshStandardMaterial color={RENK.pencereCerceve} roughness={0.8} />
      </mesh>
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0, 0.03]}>
          <boxGeometry args={[0.1, 1.9, 0.1]} />
          <meshStandardMaterial color={RENK.pencereCerceve} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Raf({ konum, genislik }: { konum: [number, number, number]; genislik: number }) {
  return (
    <group position={konum}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[genislik, 0.1, 0.45]} />
        <meshStandardMaterial color={RENK.raf} roughness={0.8} />
      </mesh>
      {/* kitaplar */}
      {Array.from({ length: 7 }).map((_, i) => {
        const yukseklik = 0.34 + ((i * 7) % 3) * 0.05;
        return (
          <mesh
            key={i}
            position={[-genislik / 2 + 0.22 + i * 0.17, yukseklik / 2 + 0.05, 0]}
            rotation={[0, 0, i === 4 ? 0.16 : 0]}
            castShadow
          >
            <boxGeometry args={[0.1, yukseklik, 0.3]} />
            <meshStandardMaterial
              color={RENK.kitap[i % RENK.kitap.length]}
              roughness={0.85}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Tavandan sarkan ışık dizisi. */
function IsikDizisi({ y, z }: { y: number; z: number }) {
  const adet = 11;
  return (
    <group position={[0, y, z]}>
      {Array.from({ length: adet }).map((_, i) => {
        const x = -5 + (i * 10) / (adet - 1);
        const sarkma = Math.sin((i / (adet - 1)) * Math.PI) * 0.28;
        return (
          <group key={i} position={[x, -sarkma, 0]}>
            <mesh>
              <sphereGeometry args={[0.075, 14, 12]} />
              <meshStandardMaterial
                color={RENK.ampul}
                emissive={RENK.ampul}
                emissiveIntensity={1.6}
                roughness={0.3}
              />
            </mesh>
            <pointLight color="#ffc978" intensity={0.5} distance={3.5} decay={2} />
          </group>
        );
      })}
    </group>
  );
}

export function Oda() {
  return (
    <group>
      {/* arka duvar */}
      <mesh position={[0, 1.2, -4.2]} receiveShadow>
        <planeGeometry args={[22, 10]} />
        <meshStandardMaterial color={RENK.duvar} roughness={0.95} />
      </mesh>

      {/* yan duvarlar — kadrajı kapatıp iç mekân hissi veriyor */}
      <mesh position={[-7, 1.2, -1]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 10]} />
        <meshStandardMaterial color={RENK.duvarKoyu} roughness={0.95} />
      </mesh>
      <mesh position={[7, 1.2, -1]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 10]} />
        <meshStandardMaterial color={RENK.duvarKoyu} roughness={0.95} />
      </mesh>

      <Pencere konum={[-3.9, 1.15, -4.15]} />
      <Pencere konum={[3.9, 1.15, -4.15]} />

      <Raf konum={[0, 1.95, -4.0]} genislik={3.1} />
      <Raf konum={[0, 0.85, -4.0]} genislik={3.1} />

      <IsikDizisi y={3.0} z={-3.6} />
    </group>
  );
}
