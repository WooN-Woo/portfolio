// BMO: geometri dosyası, görsel veya 3D model yok; her şey koddan üretiliyor.
// adarkeser.com'daki bmoScene bundle'ından çıkarıldı, okunur hale getirildi.
// Ölçüler, renkler ve animasyon değerleri orijinalle birebir aynıdır.
//
// Oda, ses ve arka plana göre kamera hizalama dahil değildir.
// Onların orijinali: original/bmo.pretty.js
//
// Kartuşlar: projects dizisi verilirse her proje için bir kartuş oluşur.
//   { name, shortName?, color, surface, face?, shot?: { src } }
//   bmo.insert(i) takar, bmo.eject(i) geri çıkarır (akış için bkz. index.html)
//   face ve shot görselleri aynı alan adından gelmeli ya da CORS izni olmalı,
//   yoksa tarayıcı canvas dokusunu WebGL'e yüklemeyi reddeder.
//
// Zoom orijinaldeki kamera yolunun aynısıdır, ama kartuşa bağlı değildir:
//   tıklama: onButton içinde bmo.zoomIn() çağır (bkz. index.html)
//   scroll:  bmo.setZoom(0-1 arası ilerleme) çağır (bkz. scroll.html)

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------- ölçüler
const BODY_W = 0.9;
const BODY_H = 1.33;
const BODY_D = 0.6;
const FRONT_Z = BODY_D / 2;
const BODY_BEVEL = 0.025;
const BODY_CORNER = 0.11;

const SCREEN = { w: 0.81 * BODY_W, h: 0.52, y: 0.987 };
const SLOT = { x: -0.127 * BODY_W, y: 0.642, w: 0.5 * BODY_W, h: 0.038 };
const SIDE = {
  holes: { y: 1.077, z: -0.05 },
  letters: [['B', 0.798], ['M', 0.608], ['O', 0.375]],
  z: -0.04,
};
const DECAL_INSET_X = 0.05;
const DECAL_INSET_Y = BODY_CORNER + 0.01;
const DECAL_SCALE = 400 / (BODY_D - 2 * DECAL_INSET_X);

const TURN_Y = 0.62; // BMO izleyiciye hafif yan durur
const FOV = 30;
const FACE_W = 640;
const FACE_H = 450;
const CART = { w: 0.4 * BODY_W, l: 0.46, t: 0.028, out: 0.06 };
const CART_LABEL = { w: 0.31, h: 0.349, px: [480, 540] };

// ---------------------------------------------------------------- renkler
const COLOR = {
  body: '#6faf9b',
  limbs: '#6ea3a9',
  navy: '#0d0897',
  decal: '#0e1a24',
  screenCenter: '#d9fee1',
  screenEdge: '#bfecca',
  faceInk: '#123b31',
  outline: '#0b1411',
};

const EASE = {
  linear: (t) => t,
  out: (t) => 1 - (1 - t) ** 3,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
};

const ZOOM_IN_MS = 1300;
const ZOOM_OUT_MS = 1000;

const vec3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- cel-shading
// 3 bantlı rampa: gölge %59, orta %83, ışık %100. Nearest filtre sayesinde
// geçişler yumuşamaz, çizgi film görünümünü veren şey budur.
let toonRamp = null;
function getToonRamp() {
  if (toonRamp) return toonRamp;
  const data = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    const t = (i + 0.5) / 64;
    data[i] = Math.round(255 * (t < 0.62 ? 0.59 : t < 0.86 ? 0.833 : 1));
  }
  toonRamp = new THREE.DataTexture(data, 64, 1, THREE.RedFormat);
  toonRamp.minFilter = THREE.NearestFilter;
  toonRamp.magFilter = THREE.NearestFilter;
  toonRamp.generateMipmaps = false;
  toonRamp.needsUpdate = true;
  return toonRamp;
}

export function toon(color, extra = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: getToonRamp(), ...extra });
}

// ---------------------------------------------------------------- kontur
// "Inverted hull": mesh normalleri yönünde şişirilip yalnızca arka yüzü
// çizilir, kenarda siyah çizgi olarak görünür.
const outlineColor = new THREE.Color(COLOR.outline);
const outlineMaterials = new Map();
function outlineMaterial(thickness) {
  if (!outlineMaterials.has(thickness)) {
    outlineMaterials.set(thickness, new THREE.ShaderMaterial({
      uniforms: { thickness: { value: thickness }, color: { value: outlineColor } },
      vertexShader: `uniform float thickness;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * thickness, 1.0);
        }`,
      fragmentShader: `uniform vec3 color;
        void main() { gl_FragColor = vec4(color, 1.0); }`,
      side: THREE.BackSide,
    }));
  }
  return outlineMaterials.get(thickness);
}

// Köşeler birleştirilip normaller yeniden hesaplanır. Yoksa sert kenarlarda
// şişirilen yüzeyler birbirinden ayrılır ve konturda delik oluşur.
const hullGeometries = new WeakMap();
function hullGeometry(geometry) {
  if (!hullGeometries.has(geometry)) {
    const copy = geometry.clone();
    for (const name of Object.keys(copy.attributes)) {
      if (name !== 'position') copy.deleteAttribute(name);
    }
    const merged = mergeVertices(copy);
    merged.computeVertexNormals();
    hullGeometries.set(geometry, merged);
  }
  return hullGeometries.get(geometry);
}

export function addOutline(object, thickness) {
  const meshes = [];
  object.traverse((o) => o.isMesh && !o.userData.hull && meshes.push(o));
  for (const mesh of meshes) {
    const hull = new THREE.Mesh(hullGeometry(mesh.geometry), outlineMaterial(thickness));
    hull.userData.hull = true;
    hull.raycast = () => {};
    mesh.add(hull);
  }
}

// ---------------------------------------------------------------- 2D şekiller
export function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function circleShape(r) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  return s;
}

function triangleShape(side) {
  const h = (side * Math.sqrt(3)) / 2;
  const s = new THREE.Shape();
  s.moveTo(0, (h * 2) / 3);
  s.lineTo(-side / 2, -h / 3);
  s.lineTo(side / 2, -h / 3);
  s.closePath();
  return s;
}

function crossShape(size, thickness) {
  const a = size / 2;
  const b = thickness / 2;
  const s = new THREE.Shape();
  s.moveTo(-b, a);
  s.lineTo(b, a);
  s.lineTo(b, b);
  s.lineTo(a, b);
  s.lineTo(a, -b);
  s.lineTo(b, -b);
  s.lineTo(b, -a);
  s.lineTo(-b, -a);
  s.lineTo(-b, -b);
  s.lineTo(-a, -b);
  s.lineTo(-a, b);
  s.lineTo(-b, b);
  s.closePath();
  return s;
}

// ---------------------------------------------------------------- 3D yapı taşları
function bodyGeometry(w, h, d, corner, bevel) {
  const geometry = new THREE.ExtrudeGeometry(
    roundedRectShape(w - 2 * bevel, h - 2 * bevel, corner - bevel),
    {
      depth: d - 2 * bevel,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 24,
    },
  );
  geometry.translate(0, 0, -(d / 2 - bevel));
  return geometry;
}

export function extruded(shape, depth, bevel, material) {
  return new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 28,
    }),
    material,
  );
}

// ShapeGeometry'nin UV'si şeklin kendi koordinatlarıdır; canvas'ın ekrana
// tam oturması için 0-1 aralığına çekilir.
function screenGeometry(shape, w, h) {
  const geometry = new THREE.ShapeGeometry(shape, 12);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, position.getX(i) / w + 0.5, position.getY(i) / h + 0.5);
  }
  return geometry;
}

function limb(points, radius, material) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => vec3(...p)));
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 14, false), material));
  const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material);
  cap.position.copy(curve.getPoint(0));
  group.add(cap);
  return { group, end: curve.getPoint(1) };
}

export function canvasTexture(canvas, renderer) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

// ---------------------------------------------------------------- canvas dokular
// Yan yüz: hoparlör delikleri ve dikey "BMO" yazısı.
function drawSideDecal() {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = Math.round((BODY_H - 2 * DECAL_INSET_Y) * DECAL_SCALE);
  const ctx = canvas.getContext('2d');
  const toX = (z) => (z + (BODY_D - 2 * DECAL_INSET_X) / 2) * DECAL_SCALE;
  const toY = (y) => (BODY_H - DECAL_INSET_Y - y) * DECAL_SCALE;

  ctx.fillStyle = COLOR.decal;
  const holes = [[-1, -1], [1, -1], [-2, 0], [0, 0], [2, 0], [-1, 1], [1, 1]];
  for (const [col, row] of holes) {
    ctx.beginPath();
    ctx.arc(
      toX(SIDE.holes.z) + col * 0.066 * DECAL_SCALE,
      toY(SIDE.holes.y) + row * 0.07 * DECAL_SCALE,
      0.022 * DECAL_SCALE,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.font = `bold ${Math.round(0.29 * DECAL_SCALE)}px "Arial Rounded MT Bold", "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const [letter, y] of SIDE.letters) {
    ctx.save();
    ctx.translate(toX(SIDE.z), toY(y));
    ctx.rotate(Math.PI / 2);
    ctx.fillText(letter, 0, 0);
    ctx.restore();
  }
  return canvas;
}

// Zemindeki yumuşak temas gölgesi.
function drawContactShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(0,0,0,0.7)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.25)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return canvas;
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundedRectPath(ctx, x, y, w, h, r) {
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

// Etiket rengi açıksa koyu, koyuysa beyaz yazı
function readableInk(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#14130f' : '#ffffff';
}

// Kartuş etiketi: ekran görüntüsü, proje ikonu ve piksel fontla ad.
function drawCartLabel(project, icon, shot) {
  const [w, h] = CART_LABEL.px;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = project.color;
  ctx.fillRect(0, 0, w, h);

  const art = { x: 22, y: 22, w: w - 44, h: 352 };
  ctx.save();
  ctx.beginPath();
  roundedRectPath(ctx, art.x, art.y, art.w, art.h, 16);
  ctx.clip();
  ctx.fillStyle = project.surface;
  ctx.fillRect(art.x, art.y, art.w, art.h);
  if (shot) {
    const scale = Math.max(art.w / shot.width, art.h / shot.height);
    const sw = art.w / scale;
    const sh = art.h / scale;
    ctx.drawImage(shot, (shot.width - sw) / 2, (shot.height - sh) * 0.35, sw, sh, art.x, art.y, art.w, art.h);
  }
  const fade = ctx.createLinearGradient(0, art.y, 0, art.y + art.h);
  fade.addColorStop(0.6, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = fade;
  ctx.fillRect(art.x, art.y, art.w, art.h);
  ctx.restore();

  const rowY = art.y + art.h + 18;
  if (icon) {
    ctx.save();
    ctx.beginPath();
    roundedRectPath(ctx, 22, rowY, 120, 120, 27);
    ctx.clip();
    ctx.fillStyle = project.surface;
    ctx.fillRect(22, rowY, 120, 120);
    ctx.drawImage(icon, 22, rowY, 120, 120);
    ctx.restore();
  }

  // Ad sığana kadar font küçülür
  const name = (project.shortName ?? project.name).toUpperCase();
  let fontSize = 30;
  ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  while (ctx.measureText(name).width > w - 190 && fontSize > 14) {
    fontSize -= 2;
    ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  }
  ctx.fillStyle = readableInk(project.color);
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 164, rowY + 62);

  // Plastik parlaması
  const shine = ctx.createLinearGradient(0, 0, w, h);
  shine.addColorStop(0, 'rgba(255,255,255,0.2)');
  shine.addColorStop(0.45, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, w, h);
  return canvas;
}

// ---------------------------------------------------------------- ana fonksiyon
export async function createBmo(
  canvas,
  {
    projects = /** @type {any[]} */ ([]),
    onPick = /** @type {((index: number) => void) | undefined} */ (undefined),
    onHover = /** @type {((index: number | null) => void) | undefined} */ (undefined),
    onButton = /** @type {((name: string) => void) | undefined} */ (undefined),
    // Bu projeye özel ek (orijinalde yok): BMO tuvalin tam ortasında değil,
    // arka plandaki masanın köşesinde dursun diye kameranın ev konumu
    // kaydırılıyor. Kaydırma görünen alanın oranı cinsinden, böylece ekran
    // oranı değişince BMO masadan kaymıyor. Zoom ilerledikçe kaydırma
    // kendiliğinden sıfırlanır, çünkü kamera ekranın tam karşısına gider.
    evUzaklik = 1,
    evKaydirma = { x: 0, y: 0 },
    // Kartuşların yerini dışarısı belirliyorsa (defterin sayfasına
    // oturtuluyorlar) çekirdeğin kendi yerleşimi devre dışı kalır.
    disKartusYerlesimi = false,
    // Sahnede BMO'dan başka nesne de var (defter, sehpa). Gölge kamerasının
    // kapsadığı alan onları da içersin diye dışarıdan verilebiliyor.
    golgeAlani = 3,
    // Gölgeyi aydınlatmadan ayırmak için. Orijinalde gölgeyi güneş atıyor ve
    // ışık önden geldiği için gölge arkaya düşüyor; boyalı odada ışık
    // pencereden, yani arkadan geliyor. Burası doluysa güneş yalnızca
    // aydınlatır, gölgeyi şiddeti sıfır olan ayrı bir ışık atar.
    golgeIsigi = /** @type {{x: number, y: number, z: number} | null} */ (null),
    temasGolgesiOpaklik = 0.55,
  } = {},
) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0, 0);

  // Etiketler bir kez çizildiği için font ve görseller önce yüklenir
  await Promise.all([
    document.fonts?.load('20px "Press Start 2P"').catch(() => {}),
    document.fonts?.ready,
  ]);
  const [icons, shots] = await Promise.all([
    Promise.all(projects.map((p) => loadImage(p.face))),
    Promise.all(projects.map((p) => loadImage(p.shot?.src))),
  ]);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 60);

  const sun = new THREE.DirectionalLight('#ffffff', Math.PI * 1.2);
  sun.position.set(1.79, 5.06, 2.68);
  sun.castShadow = !golgeIsigi;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -golgeAlani;
  sun.shadow.camera.right = golgeAlani;
  sun.shadow.camera.top = golgeAlani * 0.87;
  sun.shadow.camera.bottom = -golgeAlani * 0.87;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 12;
  sun.shadow.bias = -4e-4;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // Yalnızca gölge atan ışık. Şiddeti sıfır olduğu için sahneyi
  // aydınlatmaz, ama gölge haritası yine de bu yönden hesaplanır.
  if (golgeIsigi) {
    const golgeKaynagi = new THREE.DirectionalLight('#ffffff', 0);
    golgeKaynagi.position.set(golgeIsigi.x, golgeIsigi.y, golgeIsigi.z);
    golgeKaynagi.castShadow = true;
    golgeKaynagi.shadow.mapSize.set(2048, 2048);
    golgeKaynagi.shadow.camera.left = -golgeAlani;
    golgeKaynagi.shadow.camera.right = golgeAlani;
    golgeKaynagi.shadow.camera.top = golgeAlani * 0.87;
    golgeKaynagi.shadow.camera.bottom = -golgeAlani * 0.87;
    golgeKaynagi.shadow.camera.near = 1;
    golgeKaynagi.shadow.camera.far = 14;
    golgeKaynagi.shadow.bias = -4e-4;
    golgeKaynagi.shadow.normalBias = 0.02;
    scene.add(golgeKaynagi);
  }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.26 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const root = new THREE.Group();
  root.rotation.y = TURN_Y;
  scene.add(root);
  const body = new THREE.Group();
  root.add(body);

  // Gövde
  const shell = new THREE.Mesh(
    bodyGeometry(BODY_W, BODY_H, BODY_D, BODY_CORNER, BODY_BEVEL),
    toon(COLOR.body),
  );
  shell.position.y = BODY_H / 2;
  body.add(shell);
  addOutline(shell, 0.014);

  // Ekran çerçevesi
  const bezel = extruded(
    roundedRectShape(SCREEN.w + 0.024, SCREEN.h + 0.024, 0.03),
    0.001,
    0.002,
    toon('#13201c'),
  );
  bezel.position.set(0, SCREEN.y, FRONT_Z - 0.001);
  body.add(bezel);

  // Ekran: yüz her karede değil, yalnızca değiştiğinde 2D canvas'a çizilir
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = FACE_W;
  faceCanvas.height = FACE_H;
  const faceCtx = faceCanvas.getContext('2d');
  const faceTexture = canvasTexture(faceCanvas, renderer);
  const screen = new THREE.Mesh(
    screenGeometry(roundedRectShape(SCREEN.w, SCREEN.h, 0.024), SCREEN.w, SCREEN.h),
    new THREE.MeshBasicMaterial({ map: faceTexture, toneMapped: false }),
  );
  screen.position.set(0, SCREEN.y, FRONT_Z + 0.0035);
  screen.userData.button = 'screen';
  body.add(screen);

  // Kartuş yuvası
  const slot = new THREE.Mesh(
    new RoundedBoxGeometry(SLOT.w, SLOT.h, 0.012, 2, 0.006),
    new THREE.MeshStandardMaterial({ color: '#152f29', roughness: 0.9 }),
  );
  slot.position.set(SLOT.x, SLOT.y, FRONT_Z - 0.004);
  body.add(slot);

  // Düğmeler
  const buttons = [];
  const place = (mesh, x, y, z, name) => {
    mesh.position.set(x, y, z);
    mesh.userData.z = z;
    addOutline(mesh, 0.006);
    if (name) {
      mesh.userData.button = name;
      buttons.push(mesh);
    }
    body.add(mesh);
    return mesh;
  };

  place(extruded(circleShape(0.023 * BODY_W), 0.004, 0.005, toon(COLOR.navy)), 0.347 * BODY_W, SLOT.y, FRONT_Z, 'blue');
  place(extruded(crossShape(0.19 * BODY_W, 0.063 * BODY_W), 0.008, 0.007, toon('#f5da53')), -0.244 * BODY_W, 0.371, FRONT_Z, 'dpad');
  place(extruded(triangleShape(0.13 * BODY_W), 0.004, 0.006, toon('#68d1ea')), 0.105 * BODY_W, 0.379, FRONT_Z, 'triangle');
  // Yeşil ve kırmızı düğmelerin altında koyu birer halka var
  place(extruded(circleShape(0.062 * BODY_W), 0.001, 0.002, toon('#2f7d36')), 0.358 * BODY_W, 0.346, FRONT_Z - 0.001);
  place(extruded(circleShape(0.054 * BODY_W), 0.008, 0.007, toon('#71f454')), 0.358 * BODY_W, 0.346, FRONT_Z, 'b');
  place(extruded(circleShape(0.097 * BODY_W), 0.001, 0.002, toon('#a3283a')), 0.145 * BODY_W, 0.209, FRONT_Z - 0.001);
  place(extruded(circleShape(0.088 * BODY_W), 0.01, 0.008, toon('#e63257')), 0.145 * BODY_W, 0.209, FRONT_Z, 'a');
  const pill = () => extruded(roundedRectShape(0.13 * BODY_W, 0.031, 0.015), 0.002, 0.004, toon(COLOR.navy));
  place(pill(), -0.33 * BODY_W, 0.163, FRONT_Z, 'pill');
  place(pill(), -0.16 * BODY_W, 0.163, FRONT_Z, 'pill');

  // Yan yüzdeki yazı ve delikler
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(BODY_D - 2 * DECAL_INSET_X, BODY_H - 2 * DECAL_INSET_Y),
    toon('#ffffff', {
      map: canvasTexture(drawSideDecal(), renderer),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  decal.position.set(-BODY_W / 2 - 0.0015, BODY_H / 2, 0);
  decal.rotation.y = -Math.PI / 2;
  body.add(decal);

  // Kollar ve bacaklar: 4 noktalı spline üzerinde tüp, ucunda basık küre.
  // side -1 sol, +1 sağ tarafı oluşturur; x'in işareti aynalamayı sağlar.
  const limbMaterial = toon(COLOR.limbs);
  const shoulderY = SIDE.letters.find(([letter]) => letter === 'O')[1];
  for (const side of [-1, 1]) {
    const arm = limb(
      [
        [side * (BODY_W / 2 - 0.01), shoulderY, SIDE.z],
        [side * (BODY_W / 2 + 0.06), shoulderY - 0.03, SIDE.z + 0.03],
        [side * (BODY_W / 2 + 0.1), shoulderY * 0.5, SIDE.z + 0.12],
        [side * (BODY_W / 2 + 0.09), 0.035, SIDE.z + 0.28],
      ],
      0.024,
      limbMaterial,
    );
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 18, 14), limbMaterial);
    hand.scale.set(1, 0.5, 1.25);
    hand.position.copy(arm.end).add(vec3(0, -0.012, 0.02));
    arm.group.add(hand);
    addOutline(arm.group, 0.009);
    root.add(arm.group);

    const leg = limb(
      [
        [side * 0.2, 0.045, FRONT_Z - 0.1],
        [side * 0.21, 0.03, FRONT_Z + 0.15],
        [side * 0.24, 0.03, FRONT_Z + 0.45],
        [side * 0.26, 0.07, FRONT_Z + 0.55],
      ],
      0.026,
      limbMaterial,
    );
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.034, 18, 14), limbMaterial);
    foot.scale.set(1, 1.35, 0.9);
    foot.position.copy(leg.end);
    leg.group.add(foot);
    addOutline(leg.group, 0.009);
    root.add(leg.group);
  }

  // BMO'yu çevreleyen kutunun köşeleri: kartuşlar buna göre dizilir
  root.rotation.y = 0;
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  root.rotation.y = TURN_Y;
  scene.updateMatrixWorld(true);
  const bodyCorners = [];
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        bodyCorners.push(vec3(x, y, z).applyMatrix4(root.matrixWorld));
      }
    }
  }

  // Temas gölgesi
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.5),
    new THREE.MeshBasicMaterial({
      map: canvasTexture(drawContactShadow(), renderer),
      transparent: true,
      opacity: temasGolgesiOpaklik,
      depthWrite: false,
    }),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.003, 0.18);
  root.add(contactShadow);

  root.traverse((o) => {
    if (o.isMesh && !o.userData.hull && o !== contactShadow && o !== screen && o !== decal) {
      o.castShadow = true;
    }
  });

  // ------------------------------------------------------------- yüz
  const face = {
    mode: 'face', // face | boot (kartuş takılıyken açılış ekranı)
    mood: 'idle', // idle | happy | surprised | look
    blink: 0,
    talking: false,
    talk: 0,
    talkTarget: null,
    look: { x: 0, y: 0 },
    app: null,
    icon: null,
    pop: 0,
    chars: 0,
    flash: 0,
    dirty: true,
  };
  let moodTimer = 0;

  function setMood(mood, ms) {
    clearTimeout(moodTimer);
    face.mood = mood;
    face.dirty = true;
    if (ms) moodTimer = setTimeout(() => setMood('idle'), ms);
  }

  function drawFace() {
    const ctx = faceCtx;
    const w = FACE_W;
    const h = FACE_H;

    const glow = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.7);
    glow.addColorStop(0, COLOR.screenCenter);
    glow.addColorStop(1, COLOR.screenEdge);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = COLOR.faceInk;
    ctx.strokeStyle = COLOR.faceInk;
    ctx.lineCap = 'round';

    if (face.mode === 'face') drawExpression(ctx, w, h);
    else if (face.app) drawBootScreen(ctx, w, h);

    // LCD tarama çizgileri
    ctx.fillStyle = 'rgba(18, 59, 49, 0.06)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1.5);

    // Kartuş oturduğu anda ekran beyaz parlayıp açılır
    if (face.flash > 0) {
      ctx.fillStyle = `rgba(240, 255, 249, ${face.flash})`;
      ctx.fillRect(0, 0, w, h);
    }

    faceTexture.needsUpdate = true;
    face.dirty = false;
  }

  // Açılış ekranı: ikon büyüyerek gelir, ad harf harf yazılır
  function drawBootScreen(ctx, w, h) {
    const size = 156 * (0.9 + 0.1 * face.pop);
    const x = w / 2 - size / 2;
    const y = h * 0.4 - size / 2;
    ctx.globalAlpha = face.pop;
    ctx.save();
    ctx.beginPath();
    roundedRectPath(ctx, x, y, size, size, size * 0.22);
    ctx.clip();
    ctx.fillStyle = face.app.surface;
    ctx.fillRect(x, y, size, size);
    if (face.icon) ctx.drawImage(face.icon, x, y, size, size);
    ctx.restore();
    ctx.globalAlpha = 1;

    const name = (face.app.shortName ?? face.app.name).toUpperCase();
    ctx.font = '26px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name.slice(0, face.chars), w / 2, h * 0.82);
  }

  function drawExpression(ctx, w, h) {
    const offsetX = face.look.x * 16;
    const offsetY = face.look.y * 10 + (face.mood === 'look' ? 26 : 0);

    // Gözler
    const eyeY = h * 0.32;
    const eyeRx = w * 0.03;
    const eyeRy = h * 0.06;
    for (const eyeX of [w * 0.28, w * 0.72]) {
      ctx.beginPath();
      if (face.mood === 'happy') {
        ctx.lineWidth = h * 0.026;
        ctx.arc(eyeX + offsetX, eyeY + offsetY + eyeRy * 0.5, eyeRx * 1.5, Math.PI * 1.12, Math.PI * 1.88);
        ctx.stroke();
      } else {
        const grow = face.mood === 'surprised' ? 1.25 : 1;
        ctx.ellipse(
          eyeX + offsetX,
          eyeY + offsetY,
          eyeRx * grow,
          eyeRy * grow * Math.max(0.08, 1 - face.blink),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    // Ağız
    ctx.lineWidth = h * 0.024;
    ctx.beginPath();
    const mouthX = w / 2 + offsetX * 0.6;
    const talk = face.talk;
    if (face.mood === 'surprised' || face.mood === 'look') {
      const rx = w * 0.03 * (1 + 0.3 * talk);
      const ry = h * 0.05 * (1 + 0.8 * talk);
      ctx.ellipse(mouthX, h * 0.56 + offsetY * 0.6, rx, ry, 0, 0, Math.PI * 2);
    } else if (face.talking) {
      const halfWidth = w * (0.085 + 0.015 * talk);
      const y = h * 0.5 + offsetY * 0.6;
      ctx.lineJoin = 'round';
      ctx.moveTo(mouthX - halfWidth, y);
      ctx.lineTo(mouthX + halfWidth, y);
      ctx.ellipse(mouthX, y, halfWidth, h * (0.035 + 0.115 * talk), 0, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
    } else {
      // Gülümseme: genişlik ve derinlikten hesaplanan dairesel yay
      const halfWidth = w * 0.135;
      const depth = h * 0.1;
      const angle = 2 * Math.atan(depth / halfWidth);
      const radius = halfWidth / Math.sin(angle);
      const y = h * 0.485 + offsetY * 0.6;
      ctx.arc(mouthX, y - radius * Math.cos(angle), radius, Math.PI / 2 - angle, Math.PI / 2 + angle);
    }
    ctx.stroke();
  }

  // ------------------------------------------------------------- kartuşlar
  const cartMeshes = [];
  const carts = projects.map((project, index) => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new RoundedBoxGeometry(CART.w, CART.l, CART.t, 2, 0.012), toon('#33332f')));

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(CART_LABEL.w, CART_LABEL.h),
      new THREE.MeshBasicMaterial({
        map: canvasTexture(drawCartLabel(project, icons[index], shots[index]), renderer),
      }),
    );
    label.position.set(0, 0.035, CART.t / 2 + 0.001);
    group.add(label);

    // Alttaki tutma çizgileri
    for (let i = 0; i < 3; i++) {
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.008, 0.004), toon('#272725'));
      ridge.position.set(0, -0.165 - i * 0.022, CART.t / 2 + 0.001);
      group.add(ridge);
    }

    // Alt kenar projenin renginde
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(CART.w - 0.04, CART.t - 0.01), toon(project.color));
    edge.rotation.x = Math.PI / 2;
    edge.position.y = -CART.l / 2 - 0.001;
    group.add(edge);

    addOutline(group.children[0], 0.008);
    group.traverse((o) => {
      if (!o.isMesh || o.userData.hull) return;
      o.castShadow = true;
      o.userData.cart = index;
      cartMeshes.push(o);
    });
    scene.add(group);

    return {
      group,
      label,
      rest: { position: vec3(), tilt: new THREE.Quaternion(), face: new THREE.Quaternion(), scale: 1 },
      hover: 0,
      flying: false,
      seed: index * 1.7,
    };
  });

  let hovered = null;
  let highlighted = null;

  function setHover(index) {
    if (index === hovered) return;
    hovered = index;
    onHover?.(index);
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : ms));

  const bezier = (a, b, c, t, out) =>
    out.set(
      (1 - t) ** 2 * a.x + 2 * (1 - t) * t * b.x + t * t * c.x,
      (1 - t) ** 2 * a.y + 2 * (1 - t) * t * b.y + t * t * c.y,
      (1 - t) ** 2 * a.z + 2 * (1 - t) * t * b.z + t * t * c.z,
    );

  // mouth: yuvanın önü, seat: kartuşun oturduğu yer, flat: yatay duruşu
  function slotPoints() {
    return {
      mouth: body.localToWorld(vec3(SLOT.x, SLOT.y, FRONT_Z + CART.l / 2 + 0.16)),
      seat: body.localToWorld(vec3(SLOT.x, SLOT.y, FRONT_Z - CART.l / 2 + CART.out)),
      flat: root.quaternion
        .clone()
        .multiply(new THREE.Quaternion().setFromAxisAngle(vec3(1, 0, 0), -Math.PI / 2)),
    };
  }

  // Kartuş kavis çizerek yuvanın önüne uçar, kısa bir duraksayıp içeri girer,
  // ekran parlar ve projenin açılış ekranı gelir.
  async function insertCart(index) {
    const project = projects[index];
    const cart = carts[index];
    const { group } = cart;
    cart.flying = true;
    cart.label.material.color.setScalar(1);
    setHover(null);
    setMood('look');

    const start = group.position.clone();
    const startQuaternion = group.quaternion.clone();
    const startScale = group.scale.x;
    const { mouth, seat, flat } = slotPoints();
    const peak = start.clone().lerp(mouth, 0.5).add(vec3(0, 0.45, 0));

    await tween(860, EASE.inOut, (t) => {
      bezier(start, peak, mouth, t, group.position);
      group.quaternion.slerpQuaternions(startQuaternion, flat, t);
      group.scale.setScalar(startScale + (1 - startScale) * t);
    });
    await wait(80);
    await tween(340, EASE.inOut, (t) => group.position.lerpVectors(mouth, seat, t));

    clearTimeout(moodTimer);
    Object.assign(face, {
      mode: 'boot',
      mood: 'idle',
      app: project,
      icon: icons[index],
      pop: 0,
      chars: 0,
      flash: 1,
      dirty: true,
    });
    await tween(160, EASE.linear, (t) => {
      face.flash = 1 - t;
      face.dirty = true;
    });

    const name = project.shortName ?? project.name;
    await Promise.all([
      tween(340, EASE.out, (t) => {
        face.pop = t;
        face.dirty = true;
      }),
      tween(name.length * 55, EASE.linear, (t) => {
        face.chars = Math.round(t * name.length);
        face.dirty = true;
      }),
    ]);
    await wait(260);
  }

  async function ejectCart(index) {
    const cart = carts[index];
    const { group } = cart;
    Object.assign(face, { mode: 'face', app: null, icon: null, dirty: true });
    setMood('happy', 900);

    const { mouth } = slotPoints();
    const seated = group.position.clone();
    await tween(300, EASE.out, (t) => group.position.lerpVectors(seated, mouth, t));

    const home = cart.rest.position;
    const peak = mouth.clone().lerp(home, 0.5).add(vec3(0, 0.45, 0));
    const startQuaternion = group.quaternion.clone();
    await tween(760, EASE.inOut, (t) => {
      bezier(mouth, peak, home, t, group.position);
      group.quaternion.slerpQuaternions(startQuaternion, cart.rest.tilt, t);
      group.scale.setScalar(1 + (cart.rest.scale - 1) * t);
    });
    cart.hover = 0;
    cart.flying = false;
  }

  // Yatay ekranda BMO'nun iki yanında sütun, dikey ekranda üstte sıra.
  // Beş kartuşta Adar'ın dizilimine denk gelir, sayı değişince kendini ayarlar.
  function columnSlots(size, box) {
    const count = carts.length;
    const midY = (box.minY + box.maxY) / 2;
    const leftCount = Math.ceil(count / 2);
    const column = (n, edgeX, direction, turn) =>
      Array.from({ length: n }, (_, i) => {
        const step = n === 2 ? 1.15 : 0.95;
        const bulge = i % 2 ? (n === 2 ? 0.3 : 0.95) : 0;
        return {
          x: edgeX + direction * bulge * size,
          y: midY + (i - (n - 1) / 2) * step * size,
          turn,
        };
      });
    return [
      ...column(leftCount, box.minX - size * 0.55, -1, 0.2),
      ...column(count - leftCount, box.maxX + size * 0.55, 1, -0.2),
    ];
  }

  function rowSlots(size, box, w) {
    const count = carts.length;
    const y = Math.max(size * 0.55, box.minY / 2);
    const gap = Math.min(size * 0.72, (w * 0.92 - size * 0.78) / Math.max(1, count - 1));
    return carts.map((_, i) => {
      const offset = i - (count - 1) / 2;
      return {
        x: w / 2 + offset * gap,
        y: y + Math.abs(offset) * size * 0.06,
        roll: -offset * 0.08,
        turn: 0,
        back: Math.abs(offset) * 0.05,
      };
    });
  }

  const layoutCamera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 60);
  const layoutHelper = new THREE.Object3D();

  // Yerleşim piksel olarak hesaplanır, sonra kameradan aynı derinliğe geri
  // yansıtılır. Böylece kartuşlar her ekranda aynı boyda görünür.
  function layoutCarts(w, h, distance) {
    if (!carts.length || disKartusYerlesimi) return;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    layoutCamera.aspect = w / h;
    layoutCamera.position.copy(homePosition);
    layoutCamera.lookAt(target);
    layoutCamera.updateProjectionMatrix();
    layoutCamera.updateMatrixWorld(true);

    const points = bodyCorners.map((corner) => {
      const p = corner.clone().project(layoutCamera);
      return { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h };
    });
    const box = {
      minX: Math.min(...points.map((p) => p.x)),
      maxX: Math.max(...points.map((p) => p.x)),
      minY: Math.min(...points.map((p) => p.y)),
      maxY: Math.max(...points.map((p) => p.y)),
    };

    const crowding = Math.min(1, 6 / carts.length);
    const portrait = w / h < 0.95;
    const size = portrait
      ? clamp(Math.min(box.minY * 0.8, w * 0.32), 70, 150) * crowding
      : clamp((box.maxY - box.minY) * 0.5, 90, 170) * crowding;
    const slots = portrait ? rowSlots(size, box, w) : columnSlots(size, box);

    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const viewAxis = target.clone().sub(layoutCamera.position).normalize();
    const axisY = vec3(0, 1, 0);
    const axisZ = vec3(0, 0, 1);

    carts.forEach((cart, i) => {
      const slot = slots[i];
      const x = clamp(slot.x, size * 0.45, w - size * 0.45);
      const y = clamp(slot.y, size * 0.55, h - size * 0.55);
      const depth = distance * 0.8 + (slot.back ?? 0);
      const ray = vec3((x / w) * 2 - 1, -(y / h) * 2 + 1, 0.5)
        .unproject(layoutCamera)
        .sub(layoutCamera.position)
        .normalize();

      cart.rest.position.copy(layoutCamera.position).addScaledVector(ray, depth / ray.dot(viewAxis));
      cart.rest.scale = (size * ((2 * depth * tanHalfFov) / h)) / CART.l;

      layoutHelper.position.copy(cart.rest.position);
      layoutHelper.lookAt(layoutCamera.position);
      cart.rest.face.copy(layoutHelper.quaternion);
      cart.rest.tilt
        .copy(layoutHelper.quaternion)
        .multiply(new THREE.Quaternion().setFromAxisAngle(axisY, slot.turn))
        .multiply(new THREE.Quaternion().setFromAxisAngle(axisZ, slot.roll ?? 0));
    });
  }

  // ------------------------------------------------------------- tween
  const tweens = new Set();
  function tween(ms, ease, update) {
    if (reducedMotion || ms <= 0) {
      update(1);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      tweens.add({ start: performance.now(), ms, ease, update, resolve });
    });
  }

  // ------------------------------------------------------------- kamera
  const target = vec3(0, BODY_H * 0.45, 0);
  const viewDirection = vec3(0, Math.tan(THREE.MathUtils.degToRad(15)), 1).normalize();
  const homePosition = vec3();
  const homeTarget = vec3();
  const lookPoint = vec3();
  const zoom = { progress: 0, run: 0 }; // 0: BMO'nun tamamı, 1: yalnızca ekran
  let paused = false;

  // Kamera BMO'nun baktığı yönde, ekran görüntüyü tamamen kaplayacak kadar
  // yakına gelir. Geniş ve dar pencerede kırpılan kenar değişir, boşluk kalmaz.
  function screenView() {
    const center = body.localToWorld(vec3(0, SCREEN.y, FRONT_Z + 0.0035));
    const facing = vec3(0, 0, 1).applyQuaternion(root.quaternion);
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const distance = (Math.min(SCREEN.h, SCREEN.w / camera.aspect) / (2 * tanHalfFov)) * 0.985;
    return { position: center.clone().addScaledVector(facing, distance), target: center };
  }

  // Kamera düz gitmez, yolun ortasında hafifçe yükselip ekrana iner.
  function applyZoom() {
    const t = EASE.inOut(zoom.progress);
    const end = screenView();
    camera.position.lerpVectors(homePosition, end.position, t);
    camera.position.y += Math.sin(Math.PI * t) * 0.12;
    lookPoint.lerpVectors(homeTarget, end.target, t);
    camera.lookAt(lookPoint);
  }

  // Yarıda kesilirse bulunduğu yerden devam eder, kalan yol kadar sürer.
  function flyTo(to, ms) {
    const run = ++zoom.run;
    const from = zoom.progress;
    return tween(ms * Math.abs(to - from), EASE.linear, (p) => {
      if (run !== zoom.run) return;
      zoom.progress = from + (to - from) * p;
      applyZoom();
    });
  }

  function resize() {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Dar ekranda kollar taşmasın diye uzaklaşır
    const distance = 4.6 * Math.max(1, 1 / camera.aspect) * evUzaklik;
    const gorunenBoy = 2 * distance * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    homeTarget
      .copy(target)
      .add(vec3(evKaydirma.x * gorunenBoy * camera.aspect, evKaydirma.y * gorunenBoy, 0));
    homePosition.copy(homeTarget).addScaledVector(viewDirection, distance);
    layoutCarts(w, h, distance);
    applyZoom();
    camera.updateProjectionMatrix();
    // Duraklatılmışken yeniden boyutlanırsa görüntü bozuk kalmasın
    if (paused) renderer.render(scene, camera);
  }

  // ------------------------------------------------------------- etkileşim
  const raycaster = new THREE.Raycaster();
  const clickable = [...buttons, screen, ...cartMeshes];
  const cartOf = (mesh) => (mesh && mesh.userData.cart !== undefined ? mesh.userData.cart : null);
  const pointer = { x: 0, y: 0 };
  let pressed = null;

  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = raycaster.intersectObjects(clickable, false)[0]?.object ?? null;
    const cart = cartOf(hit);
    return cart !== null && carts[cart].flying ? null : hit;
  }

  function press(mesh, down) {
    if (mesh === screen) return;
    const from = mesh.position.z;
    const to = mesh.userData.z - (down ? 0.01 : 0);
    tween(down ? 70 : 160, EASE.out, (t) => {
      mesh.position.z = from + (to - from) * t;
    });
  }

  function onPointerDown(event) {
    if (zoom.progress > 0) return;
    const mesh = pick(event);
    if (!mesh) return;
    pressed = mesh;
    if (cartOf(mesh) === null) press(mesh, true);
  }

  function onPointerUp(event) {
    if (!pressed) return;
    const mesh = pressed;
    pressed = null;
    const cart = cartOf(mesh);
    if (cart !== null) {
      if (cartOf(pick(event)) === cart) onPick?.(cart);
      return;
    }
    press(mesh, false);
    if (pick(event) !== mesh || face.mode !== 'face') return;
    const name = mesh.userData.button;
    const startled = name === 'screen' || name === 'b' || name === 'triangle';
    setMood(startled ? 'surprised' : 'happy', startled ? 900 : 1000);
    onButton?.(name);
  }

  // Gözler sayfanın neresinde olursa olsun imleci takip eder
  function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    if (zoom.progress > 0 || event.target !== canvas) {
      if (event.pointerType === 'mouse') setHover(null);
      return;
    }
    const hit = pick(event);
    canvas.style.cursor = hit ? 'pointer' : '';
    if (event.pointerType === 'mouse') setHover(cartOf(hit));
  }

  function onPointerLeave() {
    setHover(null);
  }

  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // ------------------------------------------------------------- döngü
  let nextBlink = performance.now() + 2500;
  let blinkStart = -1;
  let last = performance.now();
  let frame = 0;

  function loop(now) {
    frame = requestAnimationFrame(loop);
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    for (const t of tweens) {
      const p = Math.min(1, (now - t.start) / t.ms);
      t.update(t.ease(p));
      if (p >= 1) {
        tweens.delete(t);
        t.resolve();
      }
    }

    if (!reducedMotion) {
      // Göz kırpma: 170 ms, 2.6-5.2 saniyede bir
      if (now > nextBlink && blinkStart < 0) blinkStart = now;
      if (blinkStart >= 0) {
        const p = (now - blinkStart) / 170;
        face.blink = p < 0.5 ? p * 2 : Math.max(0, 2 - p * 2);
        if (face.mode === 'face') face.dirty = true;
        if (p >= 1) {
          blinkStart = -1;
          face.blink = 0;
          nextBlink = now + 2600 + Math.random() * 2600;
        }
      }

      // Bakış imlece yumuşak yaklaşır
      const k = Math.min(1, dt * 6);
      const x = face.look.x + (pointer.x - face.look.x) * k;
      const y = face.look.y + (pointer.y - face.look.y) * k;
      if (Math.abs(x - face.look.x) + Math.abs(y - face.look.y) > 0.002 && face.mode === 'face') {
        face.dirty = true;
      }
      face.look.x = x;
      face.look.y = y;

      // Ağız hızlı açılır, daha yavaş kapanır
      const level = face.talkTarget;
      const talking = level !== null;
      const goal = level ?? 0;
      const talk = face.talk + (goal - face.talk) * Math.min(1, dt * (goal > face.talk ? 30 : 15));
      if ((talking !== face.talking || Math.abs(talk - face.talk) > 0.005) && face.mode === 'face') {
        face.dirty = true;
      }
      face.talking = talking;
      face.talk = talk < 0.005 ? 0 : talk;
    }

    // Beklerken süzülme, üstüne gelince kalkıp izleyiciye dönme
    const time = now / 1000;
    carts.forEach((cart, i) => {
      if (cart.flying) return;
      const active = i === hovered || i === highlighted ? 1 : 0;
      cart.hover += (active - cart.hover) * Math.min(1, dt * 10);
      const bob = reducedMotion ? 0 : Math.sin(time * 1.3 + cart.seed) * 0.022;
      cart.group.position.copy(cart.rest.position);
      cart.group.position.y += bob + cart.hover * 0.07;
      cart.group.quaternion.slerpQuaternions(cart.rest.tilt, cart.rest.face, cart.hover * 0.7);
      if (!reducedMotion) cart.group.rotateY(Math.sin(time * 0.8 + cart.seed) * 0.04 * (1 - cart.hover));
      cart.group.scale.setScalar(cart.rest.scale * (1 + cart.hover * 0.07));
      cart.label.material.color.setScalar(1 + cart.hover * 0.18);
    });

    if (face.dirty) drawFace();
    if (!paused) renderer.render(scene, camera);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  drawFace();
  frame = requestAnimationFrame(loop);

  return {
    // Bu projeye özel ek: defter de aynı sahneye ekleniyor, böylece ışık,
    // gölge ve perspektif BMO ile birebir aynı oluyor.
    scene,
    camera,
    renderer,
    // Kartuşların yerini dışarıdan belirleyebilmek için (defterin sayfasına
    // oturtuluyorlar). rest.position/tilt/face/scale yazılır, çizim döngüsü
    // her karede buradan okur.
    carts,
    setMood,
    // 0-1 arası ses seviyesi konuşturur, null ağzı kapatır. Sitede bu değer
    // çalan sesin genliğinden geliyor.
    setTalk(level) {
      face.talkTarget = level;
    },
    // Tıklama gibi tek seferlik tetikleyiciler için. Kamera varınca biter.
    zoomIn() {
      return flyTo(1, ZOOM_IN_MS);
    },
    zoomOut() {
      paused = false;
      return flyTo(0, ZOOM_OUT_MS);
    },
    // Scroll için: 0 BMO'nun tamamı, 1 yalnızca ekran.
    setZoom(progress) {
      zoom.run++;
      zoom.progress = Math.min(1, Math.max(0, progress));
      applyZoom();
    },
    // Ekranı HTML katmanı kapladığında boşuna çizim yapılmasın diye.
    setPaused(value) {
      paused = value;
    },
    insert: insertCart,
    eject: ejectCart,
    // Klavyeyle seçilen kartuşu öne çıkarır, null kaldırır.
    setHighlight(index) {
      highlighted = index;
    },
    dispose() {
      cancelAnimationFrame(frame);
      clearTimeout(moodTimer);
      observer.disconnect();
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      tweens.clear();
      scene.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry.dispose();
        for (const material of [o.material].flat()) {
          material.map?.dispose();
          material.dispose();
        }
      });
      renderer.dispose();
    },
  };
}
