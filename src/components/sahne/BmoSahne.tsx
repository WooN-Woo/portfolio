"use client";

import { useEffect, useRef } from "react";
import { games, profile, projects, skills } from "@/content/site";
import { BMO_HEDEF_Y, createBmo } from "./bmoCekirdek";
import { SAYFA, createDefter } from "./defter";

/**
 * Masa sahnesi.
 *
 * Arkada elle çizilmiş tek bir resim var; oda 3B kurulmuyor. Önünde iki
 * gerçek 3B nesne duruyor: masanın sol köşesinde BMO, yanında sehpaya
 * yaslanmış açık bir defter.
 *
 * Kaydırma defterin sayfalarını çeviriyor; her açılım bir proje. Sol sayfada
 * o projenin kartuşu duruyor: tıklanınca uçup BMO'nun yuvasına giriyor,
 * kamera ekrana yaklaşıyor ve projenin sayfası ekranı kaplıyor.
 */

/** Geniş ekranda resmin altı/üstü kırpılır; kırpma masanın lehine kaysın. */
const DIKEY_HIZA = 0.74;

/** Yatay kadraj: BMO sol köşede kalsın, defter ortaya denk gelsin. */
const EV_UZAKLIK = 1.25;
const EV_KAYDIRMA = { x: 0.28, y: 0 };

/** Bu orandan darsa dikey (telefon) düzenine geçiliyor. */
const DIKEY_ESIK = 0.95;

const GORUS_ACISI = 30;
const YARIM_ACI_TAN = Math.tan((GORUS_ACISI / 2) * (Math.PI / 180));

/**
 * Kameranın bir dünya noktasını kadrajın ortasına alması için gereken
 * kaydırma. Çekirdek kaydırmayı görünen alanın oranı cinsinden istiyor.
 */
function kadrajHesapla(oran: number, uzaklik: number, hedef: { x: number; y: number }) {
  const mesafe = 4.6 * Math.max(1, 1 / oran) * uzaklik;
  const gorunenBoy = 2 * mesafe * YARIM_ACI_TAN;
  return {
    uzaklik,
    kaydirma: {
      x: hedef.x / (gorunenBoy * oran),
      y: (hedef.y - BMO_HEDEF_Y) / gorunenBoy,
    },
  };
}

/** Dikeyde tek sayfa ekrana sığacak kadar uzaklık. */
function dikeyUzaklik(oran: number) {
  const gorunenEn = SAYFA.en * 1.16;
  const gorunenBoy = gorunenEn / oran;
  const mesafe = gorunenBoy / (2 * YARIM_ACI_TAN);
  return mesafe / (4.6 * Math.max(1, 1 / oran));
}

const sinirla = (deger: number) => Math.min(1, Math.max(0, deger));

/** Defterin dış kapağı. */
const KAPAK = {
  ad: profile.name,
  unvan: profile.role,
  yardim: [
    "kaydır — sayfaları çevir",
    "kartuşa tıkla — projeyi aç",
    "B ya da Esc — geri dön",
  ],
};

/** İlk açılım: kim olduğum. */
const HAKKIMDA = {
  ad: "Hakkımda",
  yil: profile.location,
  ozet: profile.intro,
  kunye: [profile.email, profile.githubLabel],
  kartus: false,
  ustBaslik: "merhaba",
  girisYazisi: profile.headline,
  etiketler: skills[0]?.items.slice(0, 5) ?? [],
};

type Icerik = {
  ad: string;
  kisaAd: string;
  yil: string;
  ozet: string;
  kunye: string[];
  etiketler: string[];
  gorsel: string | null;
  baglanti: string | null;
  renk: string;
  yuzey: string;
};

const PALET = [
  ["#e8913a", "#2b2118"],
  ["#e4d440", "#23240f"],
  ["#d8455f", "#2a1218"],
  ["#6c4fc4", "#181230"],
  ["#49b6a6", "#0f2926"],
  ["#5a9bd8", "#101e2c"],
];

const ICERIK: Icerik[] = [
  ...games.map((oyun) => ({
    ad: oyun.title,
    kisaAd: oyun.title,
    yil: oyun.year,
    ozet: oyun.tagline,
    kunye: [oyun.role, oyun.engine, oyun.status].filter(Boolean) as string[],
    etiketler: oyun.tags ?? [],
    gorsel: oyun.cover || oyun.images?.[0]?.src || null,
    baglanti: oyun.links?.[0]?.href ?? null,
    renk: "",
    yuzey: "",
  })),
  ...projects.map((proje) => ({
    ad: proje.title,
    kisaAd: proje.title,
    yil: proje.year,
    ozet: proje.summary,
    kunye: [proje.role, proje.status].filter(Boolean) as string[],
    etiketler: proje.stack ?? [],
    gorsel: proje.images?.[0]?.src ?? null,
    baglanti: proje.links?.[0]?.href ?? null,
    renk: "",
    yuzey: "",
  })),
].map((icerik, sira) => ({
  ...icerik,
  renk: PALET[sira % PALET.length][0],
  yuzey: PALET[sira % PALET.length][1],
}));

/** Görseli olmayan projeler için kartuş etiketi üretir. */
function yedekGorsel(renk: string, yuzey: string, harf: string, en: number, boy: number) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${en}" height="${boy}">` +
    `<rect width="100%" height="100%" fill="${yuzey}"/>` +
    `<circle cx="50%" cy="46%" r="${Math.min(en, boy) * 0.28}" fill="${renk}"/>` +
    `<text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="Helvetica,Arial,sans-serif" font-size="${Math.min(en, boy) * 0.3}" ` +
    `font-weight="700" fill="${yuzey}">${harf}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Defterin açılımları: önce hakkımda, sonra projeler. */
const SAYFALAR = [
  HAKKIMDA,
  ...ICERIK.map((icerik) => ({
    ad: icerik.ad,
    yil: icerik.yil,
    ozet: icerik.ozet,
    kunye: icerik.kunye,
    etiketler: icerik.etiketler,
  })),
];

export function BmoSahne() {
  const izRef = useRef<HTMLDivElement>(null);
  const tuvalRef = useRef<HTMLCanvasElement>(null);
  const tvRef = useRef<HTMLDivElement>(null);
  const gorselRef = useRef<HTMLImageElement>(null);
  const adRef = useRef<HTMLHeadingElement>(null);
  const ozetRef = useRef<HTMLParagraphElement>(null);
  const kunyeRef = useRef<HTMLUListElement>(null);
  const gitRef = useRef<HTMLButtonElement>(null);
  const geriRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const iz = izRef.current;
    const tuval = tuvalRef.current;
    const tv = tvRef.current;
    if (!iz || !tuval || !tv) return;

    let bmo: Awaited<ReturnType<typeof createBmo>> | null = null;
    let defter: ReturnType<typeof createDefter> | null = null;
    let birakildi = false;

    /** idle | takiliyor | ekran | kapaniyor */
    let durum = "idle";
    let acik: number | null = null;

    const bekle = (ms: number) => new Promise((coz) => setTimeout(coz, ms));

    /**
     * Kartuşu açık sayfanın yuvasına oturtur. Sayfa çevrilirken kartuş
     * küçülerek kayboluyor: sabit boyda kalsaydı çevrilen sayfanın içinden
     * geçer, sonra da birden belirirdi.
     */
    const kartuslariYerlestir = (proje: number, yerlesme: number) => {
      if (!bmo || !defter) return;
      const yer = defter.kartusYeri();
      const buyume = yerlesme * yerlesme * (3 - 2 * yerlesme);
      bmo.carts.forEach((cart, sira) => {
        if (cart.flying) return;
        const etkin = sira === proje && durum === "idle" && buyume > 0.02;
        cart.group.visible = etkin;
        if (!etkin) {
          // Görünmeyen kartuş kadrajın dışına alınıyor ki tıklamaya takılmasın
          cart.rest.position.set(0, -50, 0);
          return;
        }
        cart.rest.position.copy(yer.konum);
        cart.rest.tilt.copy(yer.yon);
        cart.rest.face.copy(yer.yon);
        cart.rest.scale = yer.olcek * buyume;
      });
    };

    /**
     * Kaydırma durakları.
     *
     * Yatayda bir durak bir açılım (0 = kapalı defter). Dikey telefonda iki
     * sayfa yan yana sığmıyor, sığdırmak için uzaklaşınca da yazı okunmaz
     * hâle geliyor: orada her açılım iki durak, kamera tek sayfaya odaklanıp
     * kaydırmayla sayfalar arasında geziniyor.
     *
     * Kullanıcı kaydırmayı bırakıp bu süre kadar dokunmazsa en yakın durağa
     * oturuyor. Kısa olursa kullanıcı daha okurken sayfa kendiliğinden kayar.
     */
    const HIZALAMA_BEKLEME = 2000;
    const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hizalamaZamani = 0;
    let sonDikey: boolean | null = null;

    const ekranOrani = () => window.innerWidth / window.innerHeight;
    const dikeyMi = () => ekranOrani() < DIKEY_ESIK;
    const durakSayisi = () =>
      dikeyMi() ? 1 + 2 * SAYFALAR.length : SAYFALAR.length + 1;

    const izYuksekligiAyarla = () => {
      iz.style.height = `${durakSayisi() * (dikeyMi() ? 85 : 100)}vh`;
    };

    const hizala = () => {
      if (durum !== "idle") return;
      const yol = iz.offsetHeight - window.innerHeight;
      if (yol <= 0) return;
      const ust = iz.getBoundingClientRect().top + window.scrollY;
      const ilerleme = sinirla((window.scrollY - ust) / yol);
      const adet = durakSayisi() - 1;
      const adim = Math.round(ilerleme * adet);
      const hedef = ust + (adim / adet) * yol;
      if (Math.abs(window.scrollY - hedef) < 2) return;
      window.scrollTo({ top: hedef, behavior: azHareket ? "auto" : "smooth" });
    };

    const guncelle = () => {
      if (!defter || !bmo) return;
      const kutu = iz.getBoundingClientRect();
      const yol = kutu.height - window.innerHeight;
      const ilerleme = yol > 0 ? sinirla(-kutu.top / yol) : 0;
      const dikey = dikeyMi();
      const adim = ilerleme * (durakSayisi() - 1);

      if (!dikey) {
        if (sonDikey !== false) {
          bmo.setEvKadraj({ uzaklik: EV_UZAKLIK, kaydirma: EV_KAYDIRMA });
          sonDikey = false;
        }
        const sayfa = defter.setIlerleme(adim / (defter.durumSayisi - 1));
        // Açılım 0 "hakkımda", kartuşlar ondan sonra başlıyor
        kartuslariYerlestir(sayfa.acilim - 1, sayfa.yerlesme);
      } else {
        sonDikey = true;

        // Durak dizilişi: 0 kapak, sonra her açılım için önce kartuş
        // sayfası sonra bilgi sayfası. Defterin kendi durumu yalnızca
        // bilgi sayfasından sonraki durakta ilerliyor.
        let defterDurum: number;
        let yan: number;
        if (adim <= 1) {
          defterDurum = adim;
          yan = adim;
        } else {
          const t = adim - 1;
          const acilim = Math.floor(t / 2);
          const kalan = t - acilim * 2;
          defterDurum = 1 + acilim + Math.max(0, kalan - 1);
          yan = kalan <= 1 ? kalan : 2 - kalan;
        }
        defter.setIlerleme(defterDurum / (defter.durumSayisi - 1));

        const sol = defter.sayfaMerkezi(-1);
        const sag = defter.sayfaMerkezi(1);
        const bas = adim <= 1 ? sag : sol;
        const son = adim <= 1 ? sol : sag;
        const pay = adim <= 1 ? adim : yan;
        const oran = ekranOrani();
        bmo.setEvKadraj(
          kadrajHesapla(oran, dikeyUzaklik(oran), {
            x: bas.x + (son.x - bas.x) * pay,
            y: bas.y + (son.y - bas.y) * pay,
          }),
        );

        // Kartuş yalnızca kartuş sayfası durağında (tek sayılı duraklar)
        const solDurak = Math.max(1, 1 + 2 * Math.round((adim - 1) / 2));
        const yerlesme = 1 - Math.min(1, Math.abs(adim - solDurak) / 0.3);
        kartuslariYerlestir((solDurak - 1) / 2 - 1, yerlesme);
      }

      window.clearTimeout(hizalamaZamani);
      hizalamaZamani = window.setTimeout(hizala, HIZALAMA_BEKLEME);
    };

    const ekraniGoster = (icerik: Icerik) => {
      if (adRef.current) adRef.current.textContent = icerik.kisaAd;
      if (ozetRef.current) ozetRef.current.textContent = icerik.ozet;
      if (gorselRef.current) {
        gorselRef.current.src =
          icerik.gorsel ?? yedekGorsel(icerik.renk, icerik.yuzey, icerik.ad[0], 900, 1200);
        gorselRef.current.alt = `${icerik.ad} görseli`;
      }
      if (kunyeRef.current) {
        kunyeRef.current.replaceChildren(
          ...icerik.kunye.map((satir) => {
            const oge = document.createElement("li");
            oge.textContent = satir;
            return oge;
          }),
        );
      }
      if (gitRef.current) gitRef.current.hidden = !icerik.baglanti;
      tv.dataset.cikiyor = "false";
      tv.hidden = false;
      // Ekran açıkken arkada sayfa çevrilmesin
      document.body.style.overflow = "hidden";
      geriRef.current?.focus({ preventScroll: true });
    };

    const ac = async (sira: number) => {
      if (!bmo || durum !== "idle") return;
      durum = "takiliyor";
      acik = sira;
      await bmo.insert(sira);
      await bmo.zoomIn();
      ekraniGoster(ICERIK[sira]);
      durum = "ekran";
      await bekle(400);
      if (durum === "ekran") bmo.setPaused(true);
    };

    const kapat = async () => {
      if (!bmo || durum !== "ekran") return;
      durum = "kapaniyor";
      bmo.setPaused(false);
      tv.dataset.cikiyor = "true";
      await bekle(240);
      tv.hidden = true;
      document.body.style.overflow = "";
      await bmo.zoomOut();
      if (acik !== null) await bmo.eject(acik);
      acik = null;
      durum = "idle";
      guncelle();
    };

    const projeyeGit = () => {
      if (acik === null) return;
      const baglanti = ICERIK[acik].baglanti;
      if (baglanti) window.open(baglanti, "_blank", "noopener,noreferrer");
    };

    const tusa = (olay: KeyboardEvent) => {
      if (olay.key === "Escape" || olay.key.toLowerCase() === "b") kapat();
      if (olay.key.toLowerCase() === "a") projeyeGit();
    };

    const mobil =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;

    izYuksekligiAyarla();

    (async () => {
      const kurulan = await createBmo(tuval, {
        // Telefonda piksel oranı ve gölge çözünürlüğü kısılıyor
        pikselOrani: mobil ? 1.75 : 2,
        golgeCozunurluk: mobil ? 1024 : 2048,
        evUzaklik: EV_UZAKLIK,
        evKaydirma: EV_KAYDIRMA,
        disKartusYerlesimi: true,
        golgeAlani: 4.8,
        // Gölge masanın üstünde kalsın, ön kenarından sarkmasın
        zemin: { en: 9, boy: 2.7, x: 1.2, z: -0.35 },
        // Odadaki ışık pencereden, yani arkadan geliyor: gölge öne düşsün
        golgeIsigi: { x: 1.6, y: 5.6, z: -2.2 },
        temasGolgesiOpaklik: 0.62,
        projects: ICERIK.map((icerik) => ({
          name: icerik.ad,
          shortName: icerik.kisaAd,
          color: icerik.renk,
          surface: icerik.yuzey,
          face: icerik.gorsel ?? yedekGorsel(icerik.renk, icerik.yuzey, icerik.ad[0], 240, 240),
        })),
        onPick: (sira: number) => {
          void ac(sira);
        },
      });
      if (birakildi) {
        kurulan.dispose();
        return;
      }
      bmo = kurulan;
      defter = createDefter({
        scene: kurulan.scene,
        renderer: kurulan.renderer,
        kapak: KAPAK,
        projeler: SAYFALAR,
      });
      guncelle();
    })();

    window.addEventListener("scroll", guncelle, { passive: true });
    const yenidenBoyutla = () => {
      izYuksekligiAyarla();
      guncelle();
    };
    window.addEventListener("resize", yenidenBoyutla);
    window.addEventListener("keydown", tusa);
    const geriDugme = geriRef.current;
    const gitDugme = gitRef.current;
    geriDugme?.addEventListener("click", kapat);
    gitDugme?.addEventListener("click", projeyeGit);

    return () => {
      birakildi = true;
      window.removeEventListener("scroll", guncelle);
      window.removeEventListener("resize", yenidenBoyutla);
      window.removeEventListener("keydown", tusa);
      window.clearTimeout(hizalamaZamani);
      geriDugme?.removeEventListener("click", kapat);
      gitDugme?.removeEventListener("click", projeyeGit);
      document.body.style.overflow = "";
      defter?.dispose();
      bmo?.dispose();
    };
  }, []);

  return (
    <>
      <div className="bmo-iz" ref={izRef}>
        <div className="bmo-sahne">
          <div className="bmo-oda">
            <div
              className="bmo-oda-arka"
              style={{ backgroundPosition: `center ${DIKEY_HIZA * 100}%` }}
            />
            <canvas className="bmo-tuval" ref={tuvalRef} />
          </div>
        </div>
      </div>

      <div
        className="bmo-tv"
        ref={tvRef}
        role="dialog"
        aria-modal="true"
        aria-label="BMO'nun ekranı"
        hidden
      >
        <div className="bmo-tv-ic">
          <figure className="bmo-tv-gorsel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={gorselRef} alt="" />
          </figure>
          <div className="bmo-tv-bilgi">
            <h2 className="bmo-tv-ad" ref={adRef} />
            <p className="bmo-tv-ozet" ref={ozetRef} />
            <ul className="bmo-tv-kunye" ref={kunyeRef} />
            <div className="bmo-tv-dugmeler">
              <button className="bmo-tv-dugme bmo-tv-a" ref={gitRef} type="button">
                <span aria-hidden="true">A</span>Projeye git
              </button>
              <button className="bmo-tv-dugme bmo-tv-b" ref={geriRef} type="button">
                <span aria-hidden="true">B</span>Geri
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
