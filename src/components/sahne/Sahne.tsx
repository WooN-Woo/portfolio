"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { Bmo } from "./Bmo";
import { Masa } from "./Masa";

/** Masa sahnesi. Şimdilik kamera sabit; scroll koreografisi sonraki adımda. */
export function Sahne() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 1.1, 6.2], fov: 38 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#efe6d8"]} />
      <fog attach="fog" args={["#efe6d8", 9, 18]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[3.5, 5, 4]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 2, -2]} intensity={0.4} color="#ffd9a8" />

      <Masa />
      <Bmo konum={[0, -0.18, 0]} />

      <ContactShadows position={[0, -1.39, 0]} opacity={0.4} scale={14} blur={2.4} far={3} />
      <Environment preset="apartment" />
    </Canvas>
  );
}
