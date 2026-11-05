// Masadaki defter: küçük bir ahşap sehpaya yaslanmış, açık duran bir eskiz
// defteri. Her açılım bir proje; sayfalar kaydırmayla çevriliyor.
//
// Defter BMO ile aynı sahneye ekleniyor — ışık, gölge ve perspektif aynı
// olsun diye. Malzeme yardımcıları da BMO'nun çekirdeğinden geliyor, böylece
// iki nesne aynı çizgi film dilinde duruyor.

import * as THREE from 'three';
import { addOutline, canvasTexture, toon } from './bmoCekirdek';

// ---------------------------------------------------------------- ölçüler
/** Açık defterin tek sayfası. */
const SAYFA = { en: 1.05, boy: 1.35 };
/** Defterin dikeyden geriye yatma açısı — sayfalar karşıdan okunsun diye. */
const YATIKLIK = THREE.MathUtils.degToRad(27);
/** Sehpanın masadaki yeri. */
const YER = { x: 2.0, z: 0.1 };

const DOKU = { en: 760, boy: 980 };

const RENK = {
  kapak: '#8a5330',
  kapakKoyu: '#6b3f24',
  sehpa: '#a06b42',
  sehpaKoyu: '#7d5130',
  kagit: '#f4e7c6',
  kagitKoyu: '#e3d2a9',
  murekkep: '#3a3124',
  soluk: '#8a7a5c',
  kalem: '#9c8a68',
};

/** Defterin el yazısı. Yazı tipi CSS değişkeninden okunuyor. */
function elYazisi() {
  if (typeof document === 'undefined') return 'Georgia, serif';
  const deger = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-el')
    .trim();
  return deger || 'Georgia, serif';
}

// ---------------------------------------------------------------- sayfa çizimi
/** kenar: 'sol' sayfanın cilt payı sağda, 'sag' sayfanınki solda. */
function kagitZemin(ctx, kenar) {
  ctx.clearRect(0, 0, DOKU.en, DOKU.boy);
  ctx.fillStyle = RENK.kagit;
  ctx.fillRect(0, 0, DOKU.en, DOKU.boy);

  // cilt payı: sayfanın içe bakan kenarı kıvrıldığı için koyulaşır
  const derinlik = DOKU.en * 0.2;
  const golge =
    kenar === 'sol'
      ? ctx.createLinearGradient(DOKU.en, 0, DOKU.en - derinlik, 0)
      : ctx.createLinearGradient(0, 0, derinlik, 0);
  golge.addColorStop(0, 'rgba(120, 95, 50, 0.32)');
  golge.addColorStop(1, 'rgba(120, 95, 50, 0)');
  ctx.fillStyle = golge;
  ctx.fillRect(kenar === 'sol' ? DOKU.en - derinlik : 0, 0, derinlik, DOKU.boy);

  // hafif çizgili defter dokusu
  ctx.strokeStyle = 'rgba(150, 125, 80, 0.14)';
  ctx.lineWidth = 2;
  for (let y = 150; y < DOKU.boy - 60; y += 46) {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(DOKU.en - 60, y);
    ctx.stroke();
  }
}

function satirlar(ctx, metin, x, y, genislik, satirBoy) {
  const kelimeler = String(metin ?? '').split(' ');
  let satir = '';
  let imlecY = y;
  for (const kelime of kelimeler) {
    const deneme = satir ? `${satir} ${kelime}` : kelime;
    if (ctx.measureText(deneme).width > genislik && satir) {
      ctx.fillText(satir, x, imlecY);
      satir = kelime;
      imlecY += satirBoy;
    } else {
      satir = deneme;
    }
  }
  if (satir) ctx.fillText(satir, x, imlecY);
  return imlecY + satirBoy;
}

/** Elle çizilmiş gibi, hafif eğri çizgi. */
function karalamaCizgi(ctx, x1, y, x2) {
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.quadraticCurveTo((x1 + x2) / 2, y + 9, x2, y - 3);
  ctx.stroke();
}

/** Görseli olmayan projeler için sayfaya karalama. */
function karalama(ctx, cerceve) {
  ctx.save();
  ctx.strokeStyle = RENK.kalem;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const { x, y, en, boy } = cerceve;
  const taban = y + boy * 0.72;

  // dağlar
  ctx.beginPath();
  ctx.moveTo(x + en * 0.08, taban);
  ctx.lineTo(x + en * 0.3, y + boy * 0.3);
  ctx.lineTo(x + en * 0.46, taban);
  ctx.moveTo(x + en * 0.38, taban);
  ctx.lineTo(x + en * 0.62, y + boy * 0.22);
  ctx.lineTo(x + en * 0.88, taban);
  ctx.stroke();

  // zemin
  ctx.beginPath();
  ctx.moveTo(x + en * 0.05, taban);
  ctx.lineTo(x + en * 0.95, taban);
  ctx.stroke();

  // küçük bayrak
  ctx.beginPath();
  ctx.moveTo(x + en * 0.72, taban);
  ctx.lineTo(x + en * 0.72, taban - boy * 0.18);
  ctx.lineTo(x + en * 0.84, taban - boy * 0.13);
  ctx.lineTo(x + en * 0.72, taban - boy * 0.08);
  ctx.stroke();

  ctx.restore();
}

// ---------------------------------------------------------------- defter
export function createDefter({ scene, renderer, projeler }) {
  const kok = new THREE.Group();
  kok.position.set(YER.x, 0, YER.z);
  kok.rotation.y = -0.16;
  scene.add(kok);

  // --- sehpa
  const sehpa = new THREE.Group();
  kok.add(sehpa);

  // Tabla defterle aynı düzlemde: ince ekseni (y) defterin yüzey normaline
  // bakacak şekilde döndürülüyor, sonra o normal boyunca biraz geri itiliyor.
  const normal = new THREE.Vector3(0, Math.sin(YATIKLIK), Math.cos(YATIKLIK));
  const merkezY = 0.1 + Math.cos(YATIKLIK) * SAYFA.boy * 0.5;
  const merkezZ = 0.07 - Math.sin(YATIKLIK) * SAYFA.boy * 0.5;

  const tabla = new THREE.Mesh(
    new THREE.BoxGeometry(SAYFA.en * 2.3, 0.05, SAYFA.boy * 1.08),
    toon(RENK.sehpa),
  );
  tabla.rotation.x = Math.PI / 2 - YATIKLIK;
  tabla.position.set(0, merkezY, merkezZ);
  tabla.position.addScaledVector(normal, -0.08);
  sehpa.add(tabla);
  addOutline(tabla, 0.014);

  const cita = new THREE.Mesh(
    new THREE.BoxGeometry(SAYFA.en * 2.3, 0.11, 0.1),
    toon(RENK.sehpaKoyu),
  );
  cita.position.set(0, 0.055, 0.14);
  sehpa.add(cita);
  addOutline(cita, 0.014);

  const ayak = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.78, 0.08), toon(RENK.sehpaKoyu));
  ayak.position.set(0, 0.34, -0.46);
  ayak.rotation.x = 0.3;
  sehpa.add(ayak);
  addOutline(ayak, 0.014);

  // --- defterin kendisi
  const kitap = new THREE.Group();
  kitap.rotation.x = -YATIKLIK;
  kitap.position.set(0, merkezY, merkezZ);
  kok.add(kitap);

  const kapak = new THREE.Mesh(
    new THREE.BoxGeometry(SAYFA.en * 2 + 0.1, SAYFA.boy + 0.1, 0.05),
    toon(RENK.kapak),
  );
  kapak.position.z = -0.035;
  kitap.add(kapak);
  addOutline(kapak, 0.016);

  const sirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, SAYFA.boy + 0.1, 0.06),
    toon(RENK.kapakKoyu),
  );
  sirt.position.z = -0.03;
  kitap.add(sirt);

  // --- sayfalar
  const toplam = projeler.length;

  const acilimlar = projeler.map((proje, sira) => {
    const yap = () => {
      const tuval = document.createElement('canvas');
      tuval.width = DOKU.en;
      tuval.height = DOKU.boy;
      return { tuval, ctx: tuval.getContext('2d') };
    };
    const sol = yap();
    const sag = yap();
    return {
      proje,
      sira,
      sol,
      sag,
      resim: null,
      solDoku: canvasTexture(sol.tuval, renderer),
      sagDoku: canvasTexture(sag.tuval, renderer),
    };
  });

  /** Sol sayfa: kartuşun durduğu yer. Kartuşun kendisi 3B, sayfanın önünde. */
  function solCiz(acilim) {
    const { ctx } = acilim.sol;
    const { proje } = acilim;
    const el = elYazisi();
    kagitZemin(ctx, 'sol');

    const kenar = 72;
    const yuva = { x: kenar + 40, y: 190, en: DOKU.en - kenar * 2 - 80, boy: DOKU.boy - 480 };

    ctx.textBaseline = 'top';
    ctx.fillStyle = RENK.soluk;
    ctx.font = `400 30px ${el}`;
    ctx.fillText('kartuşu BMO\u2019ya tak', kenar, 96);

    // kartuşun oturduğu yuva: elle çizilmiş kesik çerçeve
    ctx.save();
    ctx.strokeStyle = RENK.kalem;
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 12]);
    ctx.strokeRect(yuva.x, yuva.y, yuva.en, yuva.boy);
    ctx.restore();

    // yuvanın altında kartuşun gölgesi için hafif leke
    const leke = ctx.createRadialGradient(
      yuva.x + yuva.en / 2, yuva.y + yuva.boy, 10,
      yuva.x + yuva.en / 2, yuva.y + yuva.boy, yuva.en * 0.55,
    );
    leke.addColorStop(0, 'rgba(120, 95, 50, 0.22)');
    leke.addColorStop(1, 'rgba(120, 95, 50, 0)');
    ctx.fillStyle = leke;
    ctx.fillRect(yuva.x - 40, yuva.y + yuva.boy - 60, yuva.en + 80, 120);

    ctx.fillStyle = RENK.murekkep;
    ctx.font = `400 30px ${el}`;
    let y = yuva.y + yuva.boy + 54;
    for (const etiket of (proje.etiketler ?? []).slice(0, 4)) {
      if (y > DOKU.boy - 70) break;
      ctx.fillText(`— ${etiket}`, kenar, y);
      y += 40;
    }

    acilim.solDoku.needsUpdate = true;
  }

  /** Sağ sayfa: proje adı, özeti ve künyesi. */
  function sagCiz(acilim) {
    const { ctx } = acilim.sag;
    const { proje } = acilim;
    const el = elYazisi();
    kagitZemin(ctx, 'sag');

    const kenar = 76;
    const genislik = DOKU.en - kenar * 2;
    ctx.textBaseline = 'top';

    ctx.fillStyle = RENK.soluk;
    ctx.font = `400 30px ${el}`;
    ctx.fillText(proje.yil, kenar, 96);

    ctx.fillStyle = RENK.murekkep;
    ctx.font = `400 78px ${el}`;
    const basAlt = satirlar(ctx, proje.ad, kenar, 140, genislik, 80);

    ctx.strokeStyle = RENK.murekkep;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    karalamaCizgi(ctx, kenar, basAlt + 4, DOKU.en - kenar);

    ctx.fillStyle = RENK.murekkep;
    ctx.font = `400 38px ${el}`;
    const ozetAlt = satirlar(ctx, proje.ozet, kenar, basAlt + 50, genislik, 48);

    ctx.fillStyle = RENK.soluk;
    ctx.font = `400 32px ${el}`;
    let y = ozetAlt + 34;
    for (const satir of proje.kunye ?? []) {
      ctx.fillText(satir, kenar, y);
      y += 42;
    }

    ctx.fillStyle = RENK.soluk;
    ctx.font = `400 28px ${el}`;
    ctx.fillText(`${acilim.sira + 1} / ${toplam}`, DOKU.en - kenar - 70, DOKU.boy - 80);

    acilim.sagDoku.needsUpdate = true;
  }

  function hepsiniCiz() {
    for (const acilim of acilimlar) {
      solCiz(acilim);
      sagCiz(acilim);
    }
  }

  hepsiniCiz();

  // Yazı tipi sonradan yüklenirse sayfalar yeniden çizilir
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(hepsiniCiz);
  }

  /** Hareketsiz sayfa yüzeyi. kenar = -1 sol sayfa, +1 sağ sayfa. */
  function sayfaYuzeyi(kenar, doku) {
    const geo = new THREE.PlaneGeometry(SAYFA.en, SAYFA.boy);
    geo.translate((kenar * SAYFA.en) / 2, 0, 0);
    return new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ map: doku, toneMapped: false }),
    );
  }

  const solSayfa = sayfaYuzeyi(-1, acilimlar[0].solDoku);
  solSayfa.position.z = 0.001;
  kitap.add(solSayfa);

  const sagSayfa = sayfaYuzeyi(1, acilimlar[0].sagDoku);
  sagSayfa.position.z = 0.001;
  kitap.add(sagSayfa);

  // --- çevrilen sayfa
  // Düz bir düzlemi döndürmek tahta gibi duruyordu; onun yerine sayfa
  // cilt payından ucuna doğru bükülüyor: uç kısım geride kalıp hafifçe
  // kabarıyor, gerçek bir sayfa gibi.
  const BOLME = 28;
  /** Sayfanın ne kadar kıvrılacağı (radyan). */
  const BUKUM = 0.55;

  function cevrilenGeometri(aynaUv) {
    const geo = new THREE.PlaneGeometry(SAYFA.en, SAYFA.boy, BOLME, 1);
    geo.translate(SAYFA.en / 2, 0, 0);
    if (aynaUv) {
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i += 1) uv.setX(i, 1 - uv.getX(i));
      uv.needsUpdate = true;
    }
    geo.userData.taban = Float32Array.from(geo.attributes.position.array);
    return geo;
  }

  function bukumUygula(geo, aci) {
    const konum = geo.attributes.position;
    const taban = geo.userData.taban;
    for (let i = 0; i < konum.count; i += 1) {
      const uzaklik = taban[i * 3];
      const oran = uzaklik / SAYFA.en;
      const yon = aci + BUKUM * Math.sin(Math.PI * oran) * Math.sin(aci);
      konum.setX(i, uzaklik * Math.cos(yon));
      konum.setZ(i, uzaklik * Math.sin(yon));
    }
    konum.needsUpdate = true;
    geo.computeBoundingSphere();
  }

  const onGeo = cevrilenGeometri(false);
  const arkaGeo = cevrilenGeometri(true);

  const cevirenOn = new THREE.Mesh(
    onGeo,
    new THREE.MeshBasicMaterial({
      map: acilimlar[0].sagDoku,
      toneMapped: false,
      side: THREE.FrontSide,
    }),
  );
  const cevirenArka = new THREE.Mesh(
    arkaGeo,
    new THREE.MeshBasicMaterial({
      map: acilimlar[0].solDoku,
      toneMapped: false,
      side: THREE.BackSide,
    }),
  );
  cevirenOn.position.z = 0.004;
  cevirenArka.position.z = 0.004;
  kitap.add(cevirenOn);
  kitap.add(cevirenArka);

  for (const parca of [solSayfa, sagSayfa, cevirenOn, cevirenArka]) {
    parca.renderOrder = 2;
  }

  kok.traverse((o) => {
    if (o.isMesh && !o.userData.hull) o.castShadow = true;
  });

  // ---------------------------------------------------------------- akış
  let sonIndeks = -1;

  /**
   * ilerleme 0–1 arası: 0 ilk açılım, 1 son açılım. Ara değerlerde sayfa
   * yarı çevrilmiş durur, yani kaydırmayı birebir takip eder.
   */
  function setIlerleme(ilerleme) {
    if (toplam < 2) return;
    const nokta = Math.min(toplam - 1, Math.max(0, ilerleme * (toplam - 1)));
    const indeks = Math.min(toplam - 2, Math.floor(nokta));
    const pay = nokta - indeks;

    // Dokuyu değiştirirken malzemeye needsUpdate verilmiyor: aynı türde bir
    // doku takıldığı için gölgelendirici yeniden derlenmiyor, takılma olmuyor.
    if (indeks !== sonIndeks) {
      sonIndeks = indeks;
      solSayfa.material.map = acilimlar[indeks].solDoku;
      sagSayfa.material.map = acilimlar[indeks + 1].sagDoku;
      cevirenOn.material.map = acilimlar[indeks].sagDoku;
      cevirenArka.material.map = acilimlar[indeks + 1].solDoku;
    }

    const aci = Math.PI * pay;
    bukumUygula(onGeo, aci);
    bukumUygula(arkaGeo, aci);
  }

  setIlerleme(0);

  /**
   * Sol sayfadaki kartuş yuvasının dünya koordinatındaki yeri.
   * Kartuşlar BMO'nun çekirdeğinde sahneye doğrudan ekleniyor, bu yüzden
   * yerleri yerel değil dünya uzayında veriliyor.
   */
  const YUVA = { x: -SAYFA.en * 0.5, y: 0.1, z: 0.05 };
  const KARTUS_OLCEK = 1.15;

  function kartusYeri() {
    kitap.updateWorldMatrix(true, false);
    return {
      konum: kitap.localToWorld(new THREE.Vector3(YUVA.x, YUVA.y, YUVA.z)),
      yon: kitap.getWorldQuaternion(new THREE.Quaternion()),
      olcek: KARTUS_OLCEK,
    };
  }

  function dispose() {
    scene.remove(kok);
    kok.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      for (const malzeme of [o.material].flat()) {
        malzeme.map?.dispose();
        malzeme.dispose();
      }
    });
  }

  return { setIlerleme, kartusYeri, acilimSayisi: toplam, dispose };
}
