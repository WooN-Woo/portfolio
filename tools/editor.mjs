/**
 * /duzenle panelinin kaydet düğmesini karşılayan küçük yerel sunucu.
 *
 * Sadece kendi bilgisayarında, sadece 127.0.0.1 üzerinde dinler — dışarıdan
 * erişilemez ve yayına alınan siteye dahil değildir. `npm run dev` bunu
 * Next sunucusuyla birlikte başlatır.
 */

import { createServer } from "node:http";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "..");
const ICERIK = join(KOK, "src", "content", "site.json");
const YEDEK_KLASOR = join(KOK, ".icerik-yedek");
const GORSEL_KLASOR = join(KOK, "public", "oyunlar");
const YEDEK_SAYISI = 20;
const PORT = Number(process.env.EDITOR_PORT ?? 4311);

const GORSEL_TURLERI = {
  png: "png",
  jpg: "jpg",
  jpeg: "jpg",
  webp: "webp",
  gif: "gif",
};

/** Panelden gelen içeriğin beklenen şekilde olduğunu doğrular. */
function dogrula(veri) {
  const hatalar = [];

  if (!veri || typeof veri !== "object") return ["İçerik okunamadı."];

  const dizi = (ad) => {
    if (!Array.isArray(veri[ad])) hatalar.push(`${ad} bir liste değil.`);
  };

  if (!veri.profile || typeof veri.profile !== "object") {
    hatalar.push("profile bölümü eksik.");
  } else {
    for (const alan of ["name", "role", "email", "headline", "intro"]) {
      if (typeof veri.profile[alan] !== "string") {
        hatalar.push(`profile.${alan} metin değil.`);
      }
    }
    if (!veri.profile.name.trim()) hatalar.push("Ad boş bırakılamaz.");
  }

  dizi("games");
  dizi("projects");
  dizi("experience");
  dizi("education");
  dizi("skills");

  if (Array.isArray(veri.games)) {
    veri.games.forEach((oyun, i) => {
      const sira = i + 1;
      if (!oyun || typeof oyun !== "object") {
        hatalar.push(`${sira}. oyun okunamadı.`);
        return;
      }
      if (!String(oyun.title ?? "").trim()) hatalar.push(`${sira}. oyunun adı boş.`);
      if (!String(oyun.slug ?? "").trim()) hatalar.push(`${sira}. oyunun kısa adı boş.`);
      if (!Array.isArray(oyun.detail)) hatalar.push(`${sira}. oyunda detail listesi yok.`);
      if (!Array.isArray(oyun.tags)) hatalar.push(`${sira}. oyunda tags listesi yok.`);
    });
  }

  if (Array.isArray(veri.projects)) {
    const slugler = new Set();
    veri.projects.forEach((proje, i) => {
      const sira = i + 1;
      if (!proje || typeof proje !== "object") {
        hatalar.push(`${sira}. proje okunamadı.`);
        return;
      }
      if (!String(proje.title ?? "").trim()) {
        hatalar.push(`${sira}. projenin adı boş.`);
      }
      const slug = String(proje.slug ?? "").trim();
      if (!slug) {
        hatalar.push(`${sira}. projenin kısa adı (slug) boş.`);
      } else if (slugler.has(slug)) {
        hatalar.push(`"${slug}" kısa adı iki projede birden kullanılmış.`);
      } else {
        slugler.add(slug);
      }
      if (!Array.isArray(proje.detail)) hatalar.push(`${sira}. projede detail listesi yok.`);
      if (!Array.isArray(proje.stack)) hatalar.push(`${sira}. projede stack listesi yok.`);
    });
  }

  return hatalar;
}

/** Kaydetmeden önce mevcut dosyanın bir kopyasını alır, eskileri temizler. */
async function yedekle() {
  await mkdir(YEDEK_KLASOR, { recursive: true });
  const { readFile } = await import("node:fs/promises");

  try {
    const mevcut = await readFile(ICERIK, "utf8");
    const damga = new Date().toISOString().replace(/[:.]/g, "-");
    await writeFile(join(YEDEK_KLASOR, `site-${damga}.json`), mevcut, "utf8");
  } catch {
    return; // ilk kayıt, yedeklenecek bir şey yok
  }

  const dosyalar = (await readdir(YEDEK_KLASOR)).filter((ad) => ad.endsWith(".json")).sort();
  for (const eski of dosyalar.slice(0, Math.max(0, dosyalar.length - YEDEK_SAYISI))) {
    await rm(join(YEDEK_KLASOR, eski), { force: true });
  }
}

function basliklar(istek) {
  const kaynak = istek.headers.origin ?? "";
  const yerel = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(kaynak);
  return {
    "Access-Control-Allow-Origin": yerel ? kaynak : "http://localhost:3000",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

/** Gövdeyi sınırlı boyutta okur; sınır aşılırsa null döner. */
async function govdeyiOku(istek, enFazla) {
  const parcalar = [];
  let boyut = 0;

  for await (const parca of istek) {
    boyut += parca.length;
    if (boyut > enFazla) {
      istek.destroy();
      return null;
    }
    parcalar.push(parca);
  }

  return Buffer.concat(parcalar).toString("utf8");
}

/** Kapak görselini public/oyunlar altına yazar. */
async function gorselKaydet(gelen) {
  const uzanti = String(gelen.ad ?? "").split(".").pop()?.toLowerCase() ?? "";
  const tur = GORSEL_TURLERI[uzanti];

  if (!tur) {
    return { hata: "Yalnızca png, jpg, webp ve gif dosyaları yüklenebilir." };
  }

  const ikili = Buffer.from(String(gelen.veri ?? ""), "base64");

  if (!ikili.length) return { hata: "Dosya okunamadı." };
  if (ikili.length > 6_000_000) return { hata: "Görsel 6 MB'tan büyük olamaz." };

  const temizAd =
    String(gelen.ad ?? "kapak")
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "kapak";

  const dosyaAdi = `${temizAd}-${Date.now()}.${tur}`;

  await mkdir(GORSEL_KLASOR, { recursive: true });
  await writeFile(join(GORSEL_KLASOR, dosyaAdi), ikili);

  console.log(`  ✓ görsel eklendi — ${dosyaAdi}`);
  return { yol: `/oyunlar/${dosyaAdi}` };
}

const sunucu = createServer(async (istek, cevap) => {
  const ortak = basliklar(istek);

  if (istek.method === "OPTIONS") {
    cevap.writeHead(204, ortak).end();
    return;
  }

  if (istek.method === "GET" && istek.url === "/durum") {
    cevap.writeHead(200, ortak).end(JSON.stringify({ hazir: true }));
    return;
  }

  if (istek.method === "POST" && istek.url === "/gorsel") {
    try {
      const govde = await govdeyiOku(istek, 9_000_000);
      if (govde === null) {
        cevap.writeHead(413, ortak).end(JSON.stringify({ hata: "Dosya fazla büyük." }));
        return;
      }

      const sonuc = await gorselKaydet(JSON.parse(govde));
      cevap.writeHead(sonuc.hata ? 400 : 200, ortak).end(JSON.stringify(sonuc));
    } catch (sorun) {
      console.error("  ✗ görsel eklenemedi:", sorun);
      cevap.writeHead(500, ortak).end(JSON.stringify({ hata: "Görsel eklenemedi." }));
    }
    return;
  }

  if (istek.method !== "POST" || istek.url !== "/kaydet") {
    cevap.writeHead(404, ortak).end(JSON.stringify({ hata: "Bulunamadı." }));
    return;
  }

  try {
    const govde = await govdeyiOku(istek, 2_000_000);

    if (govde === null) {
      cevap.writeHead(413, ortak).end(JSON.stringify({ hata: "İçerik fazla büyük." }));
      return;
    }

    const veri = JSON.parse(govde);
    const hatalar = dogrula(veri);

    if (hatalar.length) {
      cevap.writeHead(400, ortak).end(JSON.stringify({ hata: hatalar.join(" ") }));
      return;
    }

    await yedekle();
    await writeFile(ICERIK, `${JSON.stringify(veri, null, 2)}\n`, "utf8");

    console.log(`  ✓ içerik kaydedildi — ${new Date().toLocaleTimeString("tr-TR")}`);
    cevap.writeHead(200, ortak).end(JSON.stringify({ tamam: true }));
  } catch (sorun) {
    console.error("  ✗ kaydedilemedi:", sorun);
    cevap.writeHead(500, ortak).end(JSON.stringify({ hata: String(sorun?.message ?? sorun) }));
  }
});

sunucu.listen(PORT, "127.0.0.1", () => {
  console.log(`  düzenleme aracı hazır — 127.0.0.1:${PORT}`);
});
