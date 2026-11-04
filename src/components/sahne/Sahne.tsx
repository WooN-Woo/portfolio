"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { Bmo } from "./Bmo";
import { Masa } from "./Masa";
import { Oda } from "./Oda";
import { Kamera } from "./Kamera";
import { Esya } from "./Esya";

/**
 * Masa sahnesi. Kamera masa hizasında, karşıdan bakıyor —
 * oturup masaya bakıyormuş hissi için.
 */
export function Sahne() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.42, 3.5], fov: 42 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#6f4d35"]} />

      {/* ana sıcak ışık — pencereden giriyormuş gibi yandan */}
      <directionalLight
        position={[-4, 3.5, 2.5]}
        intensity={1.45}
        color="#ffdfb0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      {/* karşı taraftan yumuşak dolgu */}
      <directionalLight position={[3.5, 2, 2]} intensity={0.45} color="#cfe3ff" />
      <ambientLight intensity={0.42} color="#ffeccf" />

      <Kamera />

      <Oda />
      <Masa />
      <Esya anahtar="bmo" konum={[-1.42, -0.12, 0.35]}>
        <Bmo olcek={0.42} donus={0.38} />
      </Esya>

      <ContactShadows position={[0, -0.33, 0.6]} opacity={0.5} scale={9} blur={2.2} far={2} />
      <Environment preset="apartment" />
    </Canvas>
  );
}
