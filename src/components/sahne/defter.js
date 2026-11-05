// Masadaki defter: küçük bir ahşap sehpaya yaslanmış, açık duran bir eskiz
// defteri. Her açılım bir proje; sayfalar kaydırmayla çevriliyor.
//
// Defter BMO ile aynı sahneye ekleniyor — ışık, gölge ve perspektif aynı
// olsun diye. Malzeme yardımcıları da BMO'nun çekirdeğinden geliyor, böylece
// iki nesne aynı çizgi film dilinde duruyor.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { addOutline, canvasTexture, toon } from './bmoCekirdek';

// ---------------------------------------------------------------- ölçüler
/** Açık defterin tek sayfası. */
export const SAYFA = { en: 1.05, boy: 1.35 };
/** Defterin dikeyden geriye yatma açısı — sayfalar karşıdan okunsun diye. */
const YATIKLIK = THREE.MathUtils.degToRad(27);
/** Sehpanın masadaki yeri. */
const YER = { x: 2.0, z: 0.1 };

// Sayfa dokusunun mantıksal ölçüsü. Çizim hep bu koordinatlarda yapılıyor;
// gerçek tuval DOKU_OLCEK kadar büyük/küçük oluyor. Telefonda doku belleğini
// düşürmek için küçültülüyor, yerleşim aynı kalıyor.
const DOKU = { en: 760, boy: 980 };
let DOKU_OLCEK = 1;

/** Tuvali mantıksal ölçüde çizmeye hazırlar. */
function tuvalHazirla(ctx) {
  ctx.setTransform(DOKU_OLCEK, 0, 0, DOKU_OLCEK, 0, 0);
}

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
  tuvalHazirla(ctx);
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

/** Temas gölgesi için yumuşak leke. */
function lekeTuvali() {
  const tuval = document.createElement('canvas');
  tuval.width = 256;
  tuval.height = 128;
  const ctx = tuval.getContext('2d');
  const gecis = ctx.createRadialGradient(128, 64, 6, 128, 64, 120);
  gecis.addColorStop(0, 'rgba(55, 24, 8, 0.85)');
  gecis.addColorStop(0.45, 'rgba(55, 24, 8, 0.45)');
  gecis.addColorStop(1, 'rgba(55, 24, 8, 0)');
  ctx.fillStyle = gecis;
  ctx.fillRect(0, 0, 256, 128);
  return tuval;
}

// ---------------------------------------------------------------- defter
export function createDefter({ scene, renderer, projeler, kapak, dokuOlcek = 1 }) {
  DOKU_OLCEK = dokuOlcek;
  const tuvalEn = Math.round(DOKU.en * DOKU_OLCEK);
  const tuvalBoy = Math.round(DOKU.boy * DOKU_OLCEK);
  const kok = new THREE.Group();
  kok.position.set(YER.x, 0, YER.z);
  kok.rotation.y = -0.16;
  scene.add(kok);

  // Defterin alt kenarının masadaki yeri. Sehpa da buna göre kuruluyor.
  //
  // Defter geriye yatık olduğu için en alçak noktası sayfanın alt kenarı
  // değil, kapağın alt-arka köşesi. O köşe kaidenin içine girmesin diye
  // taban yüksekliği kaidenin üstünden hesaplanıyor.
  const KAIDE_BOY = 0.09;
  const KAPAK_DERINLIK = 0.0725;
  const EN_ALCAK = (SAYFA.boy + 0.11) * 0.5 * Math.cos(YATIKLIK)
    + KAPAK_DERINLIK * Math.sin(YATIKLIK)
    - (SAYFA.boy * 0.5) * Math.cos(YATIKLIK);
  const TABAN_Y = KAIDE_BOY + EN_ALCAK + 0.008;
  const TABAN_Z = 0.12;
  /** Defter düzleminin normali — sehpa parçaları bu yön boyunca kaydırılıyor. */
  const normal = new THREE.Vector3(0, Math.sin(YATIKLIK), Math.cos(YATIKLIK));
  const merkezY = TABAN_Y + Math.cos(YATIKLIK) * SAYFA.boy * 0.5;
  const merkezZ = TABAN_Z - Math.sin(YATIKLIK) * SAYFA.boy * 0.5;

  const KITAP_EN = SAYFA.en * 2;

  /** Yumuşak köşeli ahşap parça. */
  function tahta(en, boy, derinlik, renk, yaricap = 0.03) {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(en, boy, derinlik, 3, yaricap),
      toon(renk),
    );
    addOutline(mesh, 0.013);
    return mesh;
  }

  // --- sehpa: masaya yatan kaide, ona yaslanan eğik tabla ve defteri tutan
  //     ince çıta. Hepsi yumuşak köşeli, kalas gibi durmasın diye.
  const sehpa = new THREE.Group();
  kok.add(sehpa);

  const kaide = tahta(KITAP_EN + 0.26, KAIDE_BOY, 0.6, RENK.sehpa, 0.035);
  kaide.position.set(0, KAIDE_BOY / 2, TABAN_Z - 0.22);
  sehpa.add(kaide);

  const tabla = tahta(KITAP_EN + 0.14, 0.055, SAYFA.boy * 0.92, RENK.sehpa, 0.025);
  tabla.rotation.x = Math.PI / 2 - YATIKLIK;
  tabla.position.set(0, merkezY - 0.05, merkezZ);
  // defterin arka yüzünün gerisinde kalmalı, yoksa sayfalara giriyor
  tabla.position.addScaledVector(normal, -0.125);
  sehpa.add(tabla);

  // Çıta defterin önünde duran bir ray. Sayfanın alt kenarını ÖRTMÜYOR:
  // çevrilen sayfa tam o yükseklikten geçiyor, birkaç milim bindirse bile
  // sayfa çıtanın içinden geçiyormuş gibi görünüyor. Bu yüzden üst ucu
  // sayfanın hemen altında bitiyor, alt ucu kaideye değiyor.
  const cita = tahta(KITAP_EN + 0.14, 0.09, 0.06, RENK.sehpaKoyu, 0.026);
  cita.rotation.x = -YATIKLIK;
  cita.position.set(0, TABAN_Y - 0.049, TABAN_Z);
  cita.position.addScaledVector(normal, 0.05);
  sehpa.add(cita);

  // arka destek: tablanın arkasında, yandan görünmeyecek kadar içeride
  const destek = tahta(0.13, 0.6, 0.1, RENK.sehpaKoyu, 0.03);
  destek.rotation.x = 0.44;
  destek.position.set(0, 0.29, merkezZ - 0.18);
  sehpa.add(destek);

  // --- defterin kendisi
  const kitap = new THREE.Group();
  kitap.rotation.x = -YATIKLIK;
  kitap.position.set(0, merkezY, merkezZ);
  kok.add(kitap);

  // Kapak iki yarım: defter kapalıyken sol yarım görünmüyor, çünkü kapalı
  // bir defterde her şey ciltten sağa yığılı durur.
  const YARIM_EN = SAYFA.en + 0.055;
  function kapakYarimi(yon) {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(YARIM_EN, SAYFA.boy + 0.11, 0.055, 3, 0.035),
      toon(RENK.kapak),
    );
    mesh.position.set((yon * YARIM_EN) / 2, 0, -0.045);
    kitap.add(mesh);
    addOutline(mesh, 0.016);
    return mesh;
  }
  const kapakSol = kapakYarimi(-1);
  const kapakSag = kapakYarimi(1);

  // kâğıt destesi: iki yanda kalınlık versin, kenarları görünsün
  function desteYarimi(yon) {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(SAYFA.en - 0.015, SAYFA.boy - 0.02, 0.04, 2, 0.012),
      toon(RENK.kagitKoyu),
    );
    // kutunun ön yüzü sayfa düzleminin arkasında kalmalı, yoksa sayfayı örter
    mesh.position.set((yon * SAYFA.en) / 2, 0, -0.032);
    kitap.add(mesh);
    addOutline(mesh, 0.01);
    return mesh;
  }
  const desteSol = desteYarimi(-1);
  const desteSag = desteYarimi(1);

  // cilt: ortada ince bir şerit
  const cilt = new THREE.Mesh(
    new RoundedBoxGeometry(0.085, SAYFA.boy + 0.11, 0.08, 2, 0.03),
    toon(RENK.kapakKoyu),
  );
  cilt.position.z = -0.035;
  kitap.add(cilt);

  // --- sayfalar
  const toplam = projeler.length;

  const acilimlar = projeler.map((proje, sira) => {
    const yap = () => {
      const tuval = document.createElement('canvas');
      tuval.width = tuvalEn;
      tuval.height = tuvalBoy;
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

    // Kartuşu olmayan açılım (hakkımda): yuva yerine düz yazı
    if (proje.kartus === false) {
      ctx.textBaseline = 'top';
      ctx.fillStyle = RENK.soluk;
      ctx.font = `400 30px ${el}`;
      ctx.fillText(proje.ustBaslik ?? '', kenar, 96);

      ctx.fillStyle = RENK.murekkep;
      ctx.font = `400 44px ${el}`;
      const alt = satirlar(ctx, proje.girisYazisi ?? '', kenar, 150, DOKU.en - kenar * 2, 56);

      ctx.fillStyle = RENK.soluk;
      ctx.font = `400 32px ${el}`;
      let satirY = alt + 40;
      for (const etiket of (proje.etiketler ?? []).slice(0, 6)) {
        if (satirY > DOKU.boy - 70) break;
        ctx.fillText(`— ${etiket}`, kenar, satirY);
        satirY += 42;
      }
      acilim.solDoku.needsUpdate = true;
      return;
    }
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

  /** Dış kapak: ad, unvan ve defterin nasıl gezileceği. */
  const kapakTuval = document.createElement('canvas');
  kapakTuval.width = tuvalEn;
  kapakTuval.height = tuvalBoy;
  const kapakDoku = canvasTexture(kapakTuval, renderer);

  function kapakCiz() {
    const ctx = kapakTuval.getContext('2d');
    const el = elYazisi();
    tuvalHazirla(ctx);
    ctx.clearRect(0, 0, DOKU.en, DOKU.boy);

    // deri kapak
    ctx.fillStyle = RENK.kapak;
    ctx.fillRect(0, 0, DOKU.en, DOKU.boy);
    const isik = ctx.createLinearGradient(0, 0, DOKU.en, DOKU.boy);
    isik.addColorStop(0, 'rgba(255, 228, 190, 0.16)');
    isik.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    isik.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
    ctx.fillStyle = isik;
    ctx.fillRect(0, 0, DOKU.en, DOKU.boy);

    // kenar boyunca kabartma çizgi
    ctx.strokeStyle = 'rgba(255, 226, 182, 0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(44, 44, DOKU.en - 88, DOKU.boy - 88);

    // isim plakası
    const plaka = { x: 96, y: 210, en: DOKU.en - 192, boy: 300 };
    ctx.fillStyle = '#f1e3c2';
    ctx.fillRect(plaka.x, plaka.y, plaka.en, plaka.boy);
    ctx.strokeStyle = 'rgba(60, 38, 20, 0.45)';
    ctx.lineWidth = 5;
    ctx.strokeRect(plaka.x, plaka.y, plaka.en, plaka.boy);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = RENK.murekkep;
    ctx.font = `400 74px ${el}`;
    satirlar(ctx, kapak.ad, plaka.x + plaka.en / 2, plaka.y + 52, plaka.en - 60, 78);

    ctx.fillStyle = RENK.soluk;
    ctx.font = `400 36px ${el}`;
    ctx.fillText(kapak.unvan, plaka.x + plaka.en / 2, plaka.y + 208);

    // nasıl gezilir
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f0ddb8';
    ctx.font = `400 34px ${el}`;
    let y = plaka.y + plaka.boy + 90;
    for (const satir of kapak.yardim) {
      ctx.fillText(satir, 110, y);
      y += 52;
    }

    kapakDoku.needsUpdate = true;
  }

  function hepsiniCiz() {
    kapakCiz();
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

  // Sehpanın masaya oturduğu yerdeki yumuşak leke. Yönlü ışığın gölgesi tek
  // başına yetmiyor: nesne masaya değdiği yerde koyulaşmazsa yapıştırılmış
  // gibi duruyor.
  const temasGolgesi = new THREE.Mesh(
    new THREE.PlaneGeometry(KITAP_EN + 0.55, 0.95),
    new THREE.MeshBasicMaterial({
      map: canvasTexture(lekeTuvali(), renderer),
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  temasGolgesi.rotation.x = -Math.PI / 2;
  temasGolgesi.position.set(0, 0.006, TABAN_Z - 0.16);
  temasGolgesi.renderOrder = 1;
  kok.add(temasGolgesi);

  // ---------------------------------------------------------------- akış
  // Durumlar: 0 = defter kapalı (dış kapak görünür), 1 = ilk açılım,
  // 2 = ikinci açılım... Aradaki değerlerde yaprak yarı çevrili durur.
  const DURUM_SAYISI = toplam + 1;
  const sinirla = (deger) => Math.min(1, Math.max(0, deger));
  let sonYaprak = -1;

  /** Yaprağın ön yüzü: ilk yaprak dış kapak, sonrakiler sağ sayfalar. */
  function yaprakOn(i) {
    return i === 0 ? kapakDoku : acilimlar[i - 1].sagDoku;
  }

  /**
   * ilerleme 0–1. Dönen değer kartuşun ne kadar yerleştiğini söylüyor:
   * acilim -1 ise defter kapalı ya da sayfa çevriliyor demektir.
   */
  function setIlerleme(ilerleme) {
    const adim = Math.min(DURUM_SAYISI - 1, Math.max(0, ilerleme * (DURUM_SAYISI - 1)));
    const i = Math.min(DURUM_SAYISI - 2, Math.floor(adim));
    const pay = adim - i;

    if (i !== sonYaprak) {
      sonYaprak = i;
      cevirenOn.material.map = yaprakOn(i);
      cevirenArka.material.map = acilimlar[i].solDoku;
      sagSayfa.material.map = acilimlar[i].sagDoku;
      if (i > 0) solSayfa.material.map = acilimlar[i - 1].solDoku;
    }

    // Defter kapalıyken sol yarım yok: kapalı bir defterde her şey ciltten
    // sağa yığılıdır. Kapak devrilmeye başlayınca sol yarım ortaya çıkar.
    const kapali = i === 0;
    solSayfa.visible = !kapali;
    desteSol.visible = !kapali;
    // Sol yarım, kapak devrilip üstüne oturduğu anda beliriyor. Daha erken
    // gelirse defter yarı açıkken bir de açılmış hâli görünüyor.
    kapakSol.visible = !kapali || pay > 0.9;
    // Kapalı defter yalnızca sağ yarımdan ibaret, sehpanın ortasında durur.
    // Kapak kalkmaya başlarken yerine kayıyor: hareket erken bitsin ki
    // açılma anında bir şey oynuyormuş gibi görünmesin.
    kitap.position.x = kapali
      ? (-YARIM_EN / 2) * (1 - Math.min(1, pay / 0.3))
      : 0;

    const aci = Math.PI * pay;
    bukumUygula(onGeo, aci);
    bukumUygula(arkaGeo, aci);

    // Kartuş sol sayfada duruyor; çevrilen yaprak onun üstünden geçiyor.
    // Ama kesişme sadece yaprağın kartuş gövdesinin hizasına indiği kısa
    // aralıkta oluyor: ölçüldü, pay 0.884 – 0.937. Yaprak bundan önce
    // kartuşun üstünde, sonra altında kalıyor.
    //
    // Bu yüzden kartuş dönüşün neredeyse tamamında duruyor. Sayfa soldan
    // sağa kalkarken de altından çıkan kartuş hemen görünüyor; eskiden
    // yaprak yarıyı geçene kadar bekliyordu.
    const BANT_BAS = 0.87;
    const BANT_SON = 0.95;
    const acilim = pay > BANT_SON ? i : i - 1;
    const yerlesme =
      pay < BANT_BAS
        ? 1 - sinirla((pay - (BANT_BAS - 0.03)) / 0.03)
        : sinirla((pay - BANT_SON) / 0.03);

    return { acilim, yerlesme, yaprak: i, pay };
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

  /**
   * Bir sayfanın dünya koordinatındaki ortası. Telefonda kamera tek sayfaya
   * odaklandığı için gerekiyor. taraf: -1 sol sayfa, +1 sağ sayfa.
   */
  function sayfaMerkezi(taraf) {
    kitap.updateWorldMatrix(true, false);
    return kitap.localToWorld(new THREE.Vector3((taraf * SAYFA.en) / 2, 0, 0.02));
  }

  /** Telefon düzeninde defter sahneden kalkıyor. */
  function setGorunur(deger) {
    kok.visible = deger;
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

  return {
    setIlerleme,
    kartusYeri,
    sayfaMerkezi,
    setGorunur,
    acilimSayisi: toplam,
    durumSayisi: DURUM_SAYISI,
    dispose,
  };
}
