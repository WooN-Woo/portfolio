"use client";

/**
 * Sahnenin sesleri.
 *
 * İki tür var:
 *  - BMO'nun replikleri (`public/sesler/bmo/`). Çalarken sesin genliği
 *    ölçülüp BMO'nun ağzına veriliyor, yani konuşurken ağzı oynuyor.
 *  - Defterin sesleri. Dosya olarak gelmediği için burada üretiliyor:
 *    süzgeçten geçmiş kısa bir gürültü, yani kâğıt hışırtısı.
 *
 * Tarayıcılar ses bağlamını ancak kullanıcı bir şeye dokunduktan sonra
 * açtırıyor; bağlam ilk dokunuşta kuruluyor.
 */

export type SesGrubu =
  | "selam"
  | "oyna"
  | "sasir"
  | "sevin"
  | "tekrar"
  | "durtme"
  | "bikkin";

/** Replikler. Her gruptan rastgele biri çalıyor, üst üste aynısı gelmiyor. */
const GRUPLAR: Record<SesGrubu, string[]> = {
  selam: ["hello-its-me-bmo", "hello-there"],
  oyna: [
    "play-lets-play",
    "play-its-bmo-time",
    "play-made-this-for-you",
    "whee-1",
    "whee-2",
  ],
  sasir: ["surprised-oh", "surprised-whoa-1", "surprised-whoa-2"],
  sevin: [
    "happy-giggle-1",
    "happy-giggle-2",
    "happy-giggle-3",
    "happy-giggle-4",
    "happy-giggle-5",
  ],
  tekrar: ["again-that-was-fun", "again-play-again"],
  durtme: [
    "poked-my-face",
    "poked-that-tickles-1",
    "poked-that-tickles-2",
    "poked-why-are-you-poking",
  ],
  bikkin: ["annoyed-be-gentle", "annoyed-cut-that-out", "annoyed-knock-it-off"],
};

type DefterSesi = "sayfa" | "kapak";

const DEPO_ANAHTARI = "sahne-sesi";

let baglam: AudioContext | null = null;
let anaKazanc: GainNode | null = null;
let sessiz = false;
let gurultuTamponu: AudioBuffer | null = null;
let agizHedefi: ((seviye: number | null) => void) | null = null;
let calanReplik: AudioBufferSourceNode | null = null;

const tamponlar = new Map<string, AudioBuffer>();
const sonSecim = new Map<SesGrubu, string>();
const sonCalma = new Map<string, number>();
const dinleyiciler = new Set<(deger: boolean) => void>();

export function sessizMi() {
  return sessiz;
}

export function sessizDinle(geriCagri: (deger: boolean) => void) {
  dinleyiciler.add(geriCagri);
  return () => dinleyiciler.delete(geriCagri);
}

export function setSessiz(deger: boolean) {
  sessiz = deger;
  if (anaKazanc && baglam) {
    anaKazanc.gain.setTargetAtTime(deger ? 0 : 1, baglam.currentTime, 0.02);
  }
  if (deger) repligiKes();
  try {
    localStorage.setItem(DEPO_ANAHTARI, deger ? "kapali" : "acik");
  } catch {
    // gizli sekmede depolama kapalı olabilir, sesin çalışmasına engel değil
  }
  for (const dinleyici of dinleyiciler) dinleyici(deger);
}

/** Sayfa açılırken kullanıcının son tercihini okur. */
export function sesiHazirla(agiz?: (seviye: number | null) => void) {
  if (agiz) agizHedefi = agiz;
  try {
    sessiz = localStorage.getItem(DEPO_ANAHTARI) === "kapali";
  } catch {
    sessiz = false;
  }
  for (const dinleyici of dinleyiciler) dinleyici(sessiz);
}

export function agziBagla(agiz: (seviye: number | null) => void) {
  agizHedefi = agiz;
}

function baglamiAc() {
  if (baglam) {
    if (baglam.state === "suspended") void baglam.resume();
    return baglam;
  }
  const Yapici =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Yapici) return null;

  baglam = new Yapici();
  anaKazanc = baglam.createGain();
  anaKazanc.gain.value = sessiz ? 0 : 1;
  anaKazanc.connect(baglam.destination);
  return baglam;
}

/** İlk dokunuşta ses bağlamını açar. */
export function sesiUyandir() {
  baglamiAc();
}

async function tamponAl(ad: string) {
  const hazir = tamponlar.get(ad);
  if (hazir) return hazir;
  const ctx = baglamiAc();
  if (!ctx) return null;
  try {
    const cevap = await fetch(`/sesler/bmo/${ad}.mp3`);
    if (!cevap.ok) return null;
    const cozulen = await ctx.decodeAudioData(await cevap.arrayBuffer());
    tamponlar.set(ad, cozulen);
    return cozulen;
  } catch {
    return null;
  }
}

function repligiKes() {
  if (!calanReplik) return;
  try {
    calanReplik.stop();
  } catch {
    // zaten bitmişse sorun değil
  }
  calanReplik = null;
  agizHedefi?.(null);
}

/**
 * BMO konuşur. Çalan sesin genliği her karede ölçülüp ağzına veriliyor.
 * Araya yeni bir replik girerse öncekini kesiyor, üst üste binmiyor.
 */
export async function konus(grup: SesGrubu) {
  const ctx = baglamiAc();
  if (!ctx || sessiz) return;

  const secenekler = GRUPLAR[grup];
  const onceki = sonSecim.get(grup);
  const kalanlar = secenekler.length > 1 ? secenekler.filter((a) => a !== onceki) : secenekler;
  const ad = kalanlar[Math.floor(Math.random() * kalanlar.length)];
  sonSecim.set(grup, ad);

  const tampon = await tamponAl(ad);
  if (!tampon || sessiz) return;

  repligiKes();

  const kaynak = ctx.createBufferSource();
  kaynak.buffer = tampon;

  const olcer = ctx.createAnalyser();
  olcer.fftSize = 256;
  const ornekler = new Uint8Array(olcer.fftSize);

  kaynak.connect(olcer).connect(anaKazanc!);
  calanReplik = kaynak;

  let sayac = 0;
  const olc = () => {
    if (calanReplik !== kaynak) return;
    olcer.getByteTimeDomainData(ornekler);
    let toplam = 0;
    for (const deger of ornekler) {
      const sapma = (deger - 128) / 128;
      toplam += sapma * sapma;
    }
    const seviye = Math.sqrt(toplam / ornekler.length);
    agizHedefi?.(Math.min(1, seviye * 3.2));
    sayac = requestAnimationFrame(olc);
  };
  sayac = requestAnimationFrame(olc);

  kaynak.onended = () => {
    cancelAnimationFrame(sayac);
    if (calanReplik === kaynak) {
      calanReplik = null;
      agizHedefi?.(null);
    }
  };

  kaynak.start();
}

// --------------------------------------------------------------- defter
function gurultu(ctx: AudioContext) {
  if (gurultuTamponu) return gurultuTamponu;
  const uzunluk = Math.floor(ctx.sampleRate * 0.6);
  const tampon = ctx.createBuffer(1, uzunluk, ctx.sampleRate);
  const veri = tampon.getChannelData(0);
  for (let i = 0; i < uzunluk; i += 1) veri[i] = Math.random() * 2 - 1;
  gurultuTamponu = tampon;
  return tampon;
}

/**
 * Kâğıt hışırtısı. Süzgecin frekansı yükselirken ses "savruluyor";
 * sayfa çevirmenin karakteri buradan geliyor.
 */
function hisirti(
  ctx: AudioContext,
  { sure, bas, son, siddet }: { sure: number; bas: number; son: number; siddet: number },
) {
  const kaynak = ctx.createBufferSource();
  kaynak.buffer = gurultu(ctx);
  kaynak.playbackRate.value = 0.9 + Math.random() * 0.2;

  const suzgec = ctx.createBiquadFilter();
  suzgec.type = "bandpass";
  suzgec.Q.value = 0.8;
  suzgec.frequency.setValueAtTime(bas, ctx.currentTime);
  suzgec.frequency.exponentialRampToValueAtTime(son, ctx.currentTime + sure);

  const kazanc = ctx.createGain();
  kazanc.gain.setValueAtTime(0, ctx.currentTime);
  kazanc.gain.linearRampToValueAtTime(siddet, ctx.currentTime + 0.02);
  kazanc.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + sure);

  kaynak.connect(suzgec).connect(kazanc).connect(anaKazanc!);
  kaynak.start();
  kaynak.stop(ctx.currentTime + sure + 0.05);
}

/** Kapağın masaya değen tok vuruşu. */
function tokVurus(ctx: AudioContext, siddet: number) {
  const osilator = ctx.createOscillator();
  osilator.type = "sine";
  osilator.frequency.setValueAtTime(130, ctx.currentTime);
  osilator.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);

  const kazanc = ctx.createGain();
  kazanc.gain.setValueAtTime(siddet, ctx.currentTime);
  kazanc.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);

  osilator.connect(kazanc).connect(anaKazanc!);
  osilator.start();
  osilator.stop(ctx.currentTime + 0.16);
}

/** Aynı ses art arda tetiklenirse araya en az bu kadar süre giriyor. */
const BEKLEME: Record<DefterSesi, number> = { sayfa: 150, kapak: 280 };

export function cal(ad: DefterSesi) {
  const ctx = baglamiAc();
  if (!ctx || sessiz) return;

  const simdi = performance.now();
  if (simdi - (sonCalma.get(ad) ?? -Infinity) < BEKLEME[ad]) return;
  sonCalma.set(ad, simdi);

  if (ad === "sayfa") {
    hisirti(ctx, { sure: 0.26, bas: 900, son: 3200, siddet: 0.09 });
    return;
  }
  hisirti(ctx, { sure: 0.42, bas: 500, son: 1600, siddet: 0.075 });
  tokVurus(ctx, 0.05);
}
