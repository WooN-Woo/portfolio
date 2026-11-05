"use client";

import { useEffect, useRef } from "react";
import { games, projects } from "@/content/site";
import { createBmo } from "./bmoCekirdek";
import { createDefter } from "./defter";

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

/** Kadraj: BMO sol köşede kalsın, defter ortaya denk gelsin. */
const EV_UZAKLIK = 1.25;
const EV_KAYDIRMA = { x: 0.28, y: 0 };

/** Sayfa bu kadar yerleşmişse kartuş görünür olur. */
const YERLESME_PAYI = 0.14;

const sinirla = (deger: number) => Math.min(1, Math.max(0, deger));

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

    const kartuslariYerlestir = (aktif: number) => {
      if (!bmo || !defter) return;
      const yer = defter.kartusYeri();
      bmo.carts.forEach((cart, sira) => {
        if (cart.flying) return;
        const gorunur = sira === aktif && durum === "idle";
        cart.group.visible = gorunur;
        if (!gorunur) {
          // Görünmeyen kartuş kadrajın dışına alınıyor ki tıklamaya da takılmasın
          cart.rest.position.set(0, -50, 0);
          return;
        }
        cart.rest.position.copy(yer.konum);
        cart.rest.tilt.copy(yer.yon);
        cart.rest.face.copy(yer.yon);
        cart.rest.scale = yer.olcek;
      });
    };

    const guncelle = () => {
      if (!defter) return;
      const kutu = iz.getBoundingClientRect();
      const yol = kutu.height - window.innerHeight;
      const ilerleme = yol > 0 ? sinirla(-kutu.top / yol) : 0;
      defter.setIlerleme(ilerleme);

      const nokta = ilerleme * (defter.acilimSayisi - 1);
      const yakin = Math.round(nokta);
      kartuslariYerlestir(Math.abs(nokta - yakin) < YERLESME_PAYI ? yakin : -1);
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

    (async () => {
      const kurulan = await createBmo(tuval, {
        evUzaklik: EV_UZAKLIK,
        evKaydirma: EV_KAYDIRMA,
        disKartusYerlesimi: true,
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
        projeler: ICERIK.map((icerik) => ({
          ad: icerik.ad,
          yil: icerik.yil,
          ozet: icerik.ozet,
          kunye: icerik.kunye,
          etiketler: icerik.etiketler,
        })),
      });
      guncelle();
    })();

    window.addEventListener("scroll", guncelle, { passive: true });
    window.addEventListener("resize", guncelle);
    window.addEventListener("keydown", tusa);
    const geriDugme = geriRef.current;
    const gitDugme = gitRef.current;
    geriDugme?.addEventListener("click", kapat);
    gitDugme?.addEventListener("click", projeyeGit);

    return () => {
      birakildi = true;
      window.removeEventListener("scroll", guncelle);
      window.removeEventListener("resize", guncelle);
      window.removeEventListener("keydown", tusa);
      geriDugme?.removeEventListener("click", kapat);
      gitDugme?.removeEventListener("click", projeyeGit);
      document.body.style.overflow = "";
      defter?.dispose();
      bmo?.dispose();
    };
  }, []);

  return (
    <>
      <div
        className="bmo-iz"
        ref={izRef}
        style={{ height: `${ICERIK.length * 100}vh` }}
      >
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
