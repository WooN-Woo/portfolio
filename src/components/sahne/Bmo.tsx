"use client";

import { Outlines, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  CatmullRomCurve3,
  CanvasTexture,
  Shape,
  Vector3,
  type Group,
  type Mesh,
} from "three";
import { toonGecis } from "./toon";

/**
 * BMO — yere oturmuş hâlde.
 *
 * Ölçü birimi: gövde genişliği = 1. Bütün parçalar bu orana göre yerleşiyor,
 * sahne de BMO'yu tek bir ölçekle büyütüyor.
 *
 * Malzeme çizgi film gölgesi + piksel kalınlığında dış kontur kullanıyor;
 * arkadaki elle çizilmiş sahneyle aynı dili konuşsun diye.
 */

const RENK = {
  govde: "#7fc8b6",
  kontur: "#22403c",
  ekranCerceve: "#74b9a6",
  ekran: "#c3e8d4",
  yuz: "#22403c",
  yuva: "#2c4f48",
  sari: "#f2c53d",
  mavi: "#4a84cf",
  maviKoyu: "#2f4f9e",
  yesil: "#5cb45c",
  kirmizi: "#dd4f45",
  uzuv: "#86ccba",
};

/** Kontur kalınlığı piksel cinsinden — kamera yaklaşınca incelmesin diye. */
const KONTUR = 3;

/** Gövde ölçüleri (genişlik 1 kabul edilerek). */
const GOVDE = { en: 1, boy: 1.38, derinlik: 0.62 };
const ON = GOVDE.derinlik / 2;
const ALT = -GOVDE.boy / 2;

function Toon({ renk }: { renk: string }) {
  return <meshToonMaterial color={renk} gradientMap={toonGecis()} />;
}

/** Kontur çizgisi. */
function Kontur({ kalinlik = KONTUR }: { kalinlik?: number }) {
  return <Outlines thickness={kalinlik} color={RENK.kontur} />;
}

/** Yuvarlak düğme. */
function Dugme({
  konum,
  renk,
  yaricap,
}: {
  konum: [number, number, number];
  renk: string;
  yaricap: number;
}) {
  return (
    <mesh position={konum} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[yaricap, yaricap, 0.035, 24]} />
      <Toon renk={renk} />
      <Kontur kalinlik={2} />
    </mesh>
  );
}

/** Sarı artı — yön tuşu. */
function YonTusu({ konum }: { konum: [number, number, number] }) {
  return (
    <group position={konum}>
      <mesh>
        <boxGeometry args={[0.21, 0.075, 0.035]} />
        <Toon renk={RENK.sari} />
        <Kontur kalinlik={2} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.075, 0.21, 0.035]} />
        <Toon renk={RENK.sari} />
        <Kontur kalinlik={2} />
      </mesh>
    </group>
  );
}

/** Mavi üçgen düğme. */
function Ucgen({ konum }: { konum: [number, number, number] }) {
  const sekil = useMemo(() => {
    const s = new Shape();
    const r = 0.08;
    s.moveTo(0, r);
    s.lineTo(r * 0.9, -r * 0.7);
    s.lineTo(-r * 0.9, -r * 0.7);
    s.closePath();
    return s;
  }, []);

  return (
    <mesh position={konum}>
      <extrudeGeometry args={[sekil, { depth: 0.035, bevelEnabled: false }]} />
      <Toon renk={RENK.mavi} />
      <Kontur kalinlik={2} />
    </mesh>
  );
}

/** Yan paneldeki hoparlör delikleri. */
function Hoparlor() {
  const noktalar = useMemo(() => {
    const liste: [number, number][] = [];
    for (let satir = 0; satir < 5; satir += 1) {
      for (let sutun = 0; sutun < 3; sutun += 1) {
        liste.push([0.14 - sutun * 0.07, 0.42 - satir * 0.062]);
      }
    }
    return liste;
  }, []);

  return (
    <group position={[-GOVDE.en / 2 - 0.004, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
      {noktalar.map(([z, y]) => (
        <mesh key={`${z}-${y}`} position={[z, y, 0]}>
          <circleGeometry args={[0.016, 10]} />
          <meshBasicMaterial color={RENK.yuva} />
        </mesh>
      ))}
    </group>
  );
}

/** Yan paneldeki dikey "BMO" yazısı. */
function YanYazi() {
  const doku = useMemo(() => {
    const tuval = document.createElement("canvas");
    tuval.width = 256;
    tuval.height = 256;
    const ctx = tuval.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 256, 256);
      ctx.translate(128, 128);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "#2c4f48";
      ctx.font = "bold 92px Helvetica, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("BMO", 0, 0);
    }
    const d = new CanvasTexture(tuval);
    d.needsUpdate = true;
    return d;
  }, []);

  return (
    <mesh
      position={[-GOVDE.en / 2 - 0.005, -0.12, 0.02]}
      rotation={[0, -Math.PI / 2, 0]}
    >
      <planeGeometry args={[0.42, 0.42]} />
      <meshBasicMaterial map={doku} transparent />
    </mesh>
  );
}

/** Ekrandaki yüz — arada bir göz kırpıyor. */
function Yuz({ merkez, z }: { merkez: [number, number]; z: number }) {
  const sol = useRef<Mesh>(null);
  const sag = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dongu = t % 4.8;
    const kirpma = dongu < 0.14 ? Math.abs(Math.sin(dongu * (Math.PI / 0.14))) : 0;
    const olcekY = 1 - kirpma * 0.95;
    sol.current?.scale.set(1, olcekY, 1);
    sag.current?.scale.set(1, olcekY, 1);
  });

  return (
    <group position={[merkez[0], merkez[1], z]}>
      <mesh ref={sol} position={[-0.15, 0.07, 0]}>
        <circleGeometry args={[0.042, 20]} />
        <meshBasicMaterial color={RENK.yuz} />
      </mesh>
      <mesh ref={sag} position={[0.15, 0.07, 0]}>
        <circleGeometry args={[0.042, 20]} />
        <meshBasicMaterial color={RENK.yuz} />
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.1, 0.014, 8, 28, Math.PI]} />
        <meshBasicMaterial color={RENK.yuz} />
      </mesh>
    </group>
  );
}

/** İnce, kıvrımlı uzuv — kol ve bacaklar bundan. */
function Uzuv({
  noktalar,
  yaricap,
  ucYaricap,
}: {
  noktalar: [number, number, number][];
  yaricap: number;
  ucYaricap: number;
}) {
  const egri = useMemo(
    () => new CatmullRomCurve3(noktalar.map((n) => new Vector3(...n))),
    [noktalar],
  );
  const uc = noktalar[noktalar.length - 1];

  return (
    <group>
      <mesh>
        <tubeGeometry args={[egri, 24, yaricap, 10, false]} />
        <Toon renk={RENK.uzuv} />
        <Kontur kalinlik={2.5} />
      </mesh>
      <mesh position={uc}>
        <sphereGeometry args={[ucYaricap, 16, 12]} />
        <Toon renk={RENK.uzuv} />
        <Kontur kalinlik={2.5} />
      </mesh>
    </group>
  );
}

export function Bmo({
  konum = [0, 0, 0] as [number, number, number],
  olcek = 1,
  donus = 0,
  egim = 0,
}: {
  konum?: [number, number, number];
  olcek?: number;
  /** Y ekseninde dönüş — yan paneli ne kadar göstereceği. */
  donus?: number;
  /** Hafif yana yatma. */
  egim?: number;
}) {
  const ref = useRef<Group>(null);

  // hafif nefes alma — duran sahneyi canlı tutuyor
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = konum[1] + Math.sin(t * 1.05) * 0.004 * olcek;
    ref.current.rotation.z = egim + Math.sin(t * 0.6) * 0.004;
  });

  return (
    <group ref={ref} position={konum} scale={olcek} rotation={[0, donus, egim]}>
      {/* gövde */}
      <RoundedBox
        args={[GOVDE.en, GOVDE.boy, GOVDE.derinlik]}
        radius={0.085}
        smoothness={6}
      >
        <Toon renk={RENK.govde} />
        <Kontur kalinlik={KONTUR + 1} />
      </RoundedBox>

      {/* ekran çerçevesi */}
      <RoundedBox
        args={[0.78, 0.6, 0.05]}
        radius={0.06}
        smoothness={5}
        position={[0.03, 0.26, ON - 0.012]}
      >
        <Toon renk={RENK.ekranCerceve} />
        <Kontur kalinlik={KONTUR} />
      </RoundedBox>

      {/* ekran yüzeyi */}
      <mesh position={[0.03, 0.26, ON + 0.016]}>
        <planeGeometry args={[0.72, 0.54]} />
        <meshBasicMaterial color={RENK.ekran} />
      </mesh>

      <Yuz merkez={[0.03, 0.24]} z={ON + 0.019} />

      {/* kartuş yuvası */}
      <mesh position={[0.015, -0.14, ON + 0.002]}>
        <boxGeometry args={[0.61, 0.045, 0.02]} />
        <meshBasicMaterial color={RENK.yuva} />
      </mesh>

      {/* düğmeler */}
      <YonTusu konum={[-0.16, -0.4, ON + 0.01]} />
      <Ucgen konum={[0.14, -0.33, ON + 0.01]} />
      <Dugme konum={[0.36, -0.33, ON + 0.01]} renk={RENK.yesil} yaricap={0.068} />
      <Dugme konum={[0.17, -0.55, ON + 0.01]} renk={RENK.kirmizi} yaricap={0.095} />
      <Dugme konum={[0.34, -0.055, ON + 0.01]} renk={RENK.maviKoyu} yaricap={0.032} />

      {/* altta iki mavi çizgi */}
      {[-0.29, -0.08].map((x) => (
        <mesh key={x} position={[x, -0.62, ON + 0.004]}>
          <boxGeometry args={[0.105, 0.042, 0.02]} />
          <Toon renk={RENK.maviKoyu} />
        </mesh>
      ))}

      <Hoparlor />
      <YanYazi />

      {/* bacaklar — oturur pozda öne doğru uzanıyor */}
      {[-1, 1].map((yon) => (
        <Uzuv
          key={`bacak-${yon}`}
          noktalar={[
            [yon * 0.22, ALT + 0.06, 0.1],
            [yon * 0.27, ALT - 0.1, 0.4],
            [yon * 0.3, ALT - 0.16, 0.72],
          ]}
          yaricap={0.038}
          ucYaricap={0.078}
        />
      ))}

      {/* kollar — yanlardan aşağı sarkıp yere değiyor */}
      {[-1, 1].map((yon) => (
        <Uzuv
          key={`kol-${yon}`}
          noktalar={[
            [yon * 0.44, -0.26, 0.16],
            [yon * 0.62, -0.52, 0.26],
            [yon * 0.7, ALT - 0.14, 0.34],
          ]}
          yaricap={0.032}
          ucYaricap={0.062}
        />
      ))}
    </group>
  );
}
