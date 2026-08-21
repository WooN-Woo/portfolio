"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ExperienceItem,
  Game,
  Project,
  SiteContent,
  SkillGroup,
} from "@/content/site";

const PORT = process.env.NEXT_PUBLIC_EDITOR_PORT ?? "4311";
const SUNUCU = `http://127.0.0.1:${PORT}`;

const SEKMELER = [
  { id: "profil", ad: "Profil" },
  { id: "oyunlar", ad: "Oyunlar" },
  { id: "projeler", ad: "Projeler" },
  { id: "deneyim", ad: "Deneyim" },
  { id: "egitim", ad: "Eğitim" },
  { id: "yetkinlik", ad: "Yetkinlikler" },
] as const;

type Sekme = (typeof SEKMELER)[number]["id"];
type Durum = { tip: "bos" | "calisiyor" | "tamam" | "hata"; mesaj?: string };

const TR_HARF: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
  ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c",
};

function adresAdi(metin: string) {
  return metin
    .split("")
    .map((harf) => TR_HARF[harf] ?? harf)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const satirlar = (deger: string) =>
  deger.split("\n").map((s) => s.trim()).filter(Boolean);

const paragraflar = (deger: string) =>
  deger.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

const virgullu = (deger: string) =>
  deger.split(",").map((s) => s.trim()).filter(Boolean);

/* ---------- küçük form parçaları ---------- */

function Alan({
  etiket,
  ipucu,
  children,
}: {
  etiket: string;
  ipucu?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="ed-alan">
      <span className="ed-etiket">{etiket}</span>
      {children}
      {ipucu ? <span className="ed-ipucu">{ipucu}</span> : null}
    </label>
  );
}

function Metin({
  deger,
  onDegis,
  ...kalan
}: {
  deger: string;
  onDegis: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      className="ed-girdi"
      type="text"
      value={deger}
      onChange={(e) => onDegis(e.target.value)}
      {...kalan}
    />
  );
}

function CokSatir({
  deger,
  onDegis,
  satir = 4,
}: {
  deger: string;
  onDegis: (v: string) => void;
  satir?: number;
}) {
  return (
    <textarea
      className="ed-girdi ed-coksatir"
      rows={satir}
      value={deger}
      onChange={(e) => onDegis(e.target.value)}
    />
  );
}

function SiraDugmeleri({
  sira,
  toplam,
  onTasi,
  onSil,
  silUyari,
}: {
  sira: number;
  toplam: number;
  onTasi: (yon: -1 | 1) => void;
  onSil: () => void;
  silUyari: string;
}) {
  return (
    <div className="ed-kart-araclar">
      <button
        type="button"
        className="ed-mini"
        onClick={() => onTasi(-1)}
        disabled={sira === 0}
        aria-label="Yukarı taşı"
      >
        ↑
      </button>
      <button
        type="button"
        className="ed-mini"
        onClick={() => onTasi(1)}
        disabled={sira === toplam - 1}
        aria-label="Aşağı taşı"
      >
        ↓
      </button>
      <button
        type="button"
        className="ed-mini ed-mini-sil"
        onClick={() => {
          if (window.confirm(silUyari)) onSil();
        }}
      >
        Sil
      </button>
    </div>
  );
}

function KapakSec({
  deger,
  onDegis,
}: {
  deger: string;
  onDegis: (yol: string) => void;
}) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  async function yukle(dosya: File) {
    setYukleniyor(true);
    setHata("");

    try {
      const base64 = await new Promise<string>((coz, red) => {
        const okuyucu = new FileReader();
        okuyucu.onload = () => coz(String(okuyucu.result).split(",")[1] ?? "");
        okuyucu.onerror = () => red(new Error("okunamadı"));
        okuyucu.readAsDataURL(dosya);
      });

      const cevap = await fetch(`${SUNUCU}/gorsel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: dosya.name, veri: base64 }),
      });
      const sonuc = await cevap.json();

      if (!cevap.ok) {
        setHata(sonuc.hata ?? "Görsel eklenemedi.");
        return;
      }

      onDegis(sonuc.yol);
    } catch {
      setHata("Görsel eklenemedi.");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="ed-alan">
      <span className="ed-etiket">Kapak görseli</span>

      {deger ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ed-kapak" src={deger} alt="Seçilen kapak görseli" />
      ) : null}

      <div className="ed-kapak-araclar">
        <label className="ed-mini ed-dosya">
          {yukleniyor ? "Ekleniyor" : deger ? "Değiştir" : "Görsel seç"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => {
              const dosya = e.target.files?.[0];
              if (dosya) yukle(dosya);
              e.target.value = "";
            }}
          />
        </label>

        {deger ? (
          <button type="button" className="ed-mini ed-mini-sil" onClick={() => onDegis("")}>
            Kaldır
          </button>
        ) : null}
      </div>

      {hata ? <span className="ed-hata">{hata}</span> : null}
    </div>
  );
}

/* ---------- panel ---------- */

export function Editor({ baslangic }: { baslangic: SiteContent }) {
  const [veri, setVeri] = useState<SiteContent>(() => structuredClone(baslangic));
  const [sekme, setSekme] = useState<Sekme>("profil");
  const [durum, setDurum] = useState<Durum>({ tip: "bos" });
  const [kayitli, setKayitli] = useState(() => JSON.stringify(baslangic));

  const degisti = useMemo(() => JSON.stringify(veri) !== kayitli, [veri, kayitli]);

  useEffect(() => {
    const acilan = window.location.hash.replace("#", "") as Sekme;
    if (SEKMELER.some((s) => s.id === acilan)) setSekme(acilan);
  }, []);

  useEffect(() => {
    if (!degisti) return;
    const uyar = (olay: BeforeUnloadEvent) => olay.preventDefault();
    window.addEventListener("beforeunload", uyar);
    return () => window.removeEventListener("beforeunload", uyar);
  }, [degisti]);

  /* liste yardımcıları */
  function listeyiDegistir<A extends keyof SiteContent>(
    ad: A,
    islem: (liste: SiteContent[A]) => SiteContent[A],
  ) {
    setVeri((onceki) => ({ ...onceki, [ad]: islem(onceki[ad]) }));
  }

  function tasi<T>(liste: T[], sira: number, yon: -1 | 1): T[] {
    const hedef = sira + yon;
    if (hedef < 0 || hedef >= liste.length) return liste;
    const kopya = [...liste];
    [kopya[sira], kopya[hedef]] = [kopya[hedef], kopya[sira]];
    return kopya;
  }

  const oyunGuncelle = (sira: number, yama: Partial<Game>) =>
    listeyiDegistir("games", (liste) =>
      liste.map((o, i) => (i === sira ? { ...o, ...yama } : o)),
    );

  const projeGuncelle = (sira: number, yama: Partial<Project>) =>
    listeyiDegistir("projects", (liste) =>
      liste.map((p, i) => (i === sira ? { ...p, ...yama } : p)),
    );

  async function kaydet() {
    setDurum({ tip: "calisiyor" });
    try {
      const cevap = await fetch(`${SUNUCU}/kaydet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(veri),
      });
      const sonuc = await cevap.json();

      if (!cevap.ok) {
        setDurum({ tip: "hata", mesaj: sonuc.hata ?? "Kaydedilemedi." });
        return;
      }

      setKayitli(JSON.stringify(veri));
      setDurum({ tip: "tamam", mesaj: "Kaydedildi" });
    } catch {
      setDurum({
        tip: "hata",
        mesaj: "Düzenleme aracına ulaşılamadı. Terminalde npm run dev çalışıyor mu?",
      });
    }
  }

  function geriAl() {
    if (!window.confirm("Kaydedilmemiş değişiklikler silinecek. Devam edilsin mi?")) return;
    setVeri(JSON.parse(kayitli));
    setDurum({ tip: "bos" });
  }

  return (
    <div className="ed">
      <header className="ed-bar">
        <div className="shell ed-bar-ic">
          <div className="ed-bar-sol">
            <strong className="ed-bar-ad">İçerik</strong>
            <span className="ed-bar-not">
              {degisti ? "Kaydedilmemiş değişiklik var" : "Her şey kayıtlı"}
            </span>
          </div>

          <div className="ed-bar-sag">
            {durum.mesaj ? (
              <span className={`ed-durum ed-durum-${durum.tip}`}>{durum.mesaj}</span>
            ) : null}
            <button type="button" className="btn" onClick={geriAl} disabled={!degisti}>
              Geri al
            </button>
            <button
              type="button"
              className="btn btn-solid"
              onClick={kaydet}
              disabled={!degisti || durum.tip === "calisiyor"}
            >
              {durum.tip === "calisiyor" ? "Kaydediliyor" : "Kaydet"}
            </button>
          </div>
        </div>
      </header>

      <nav className="shell ed-sekmeler">
        {SEKMELER.map((s) => (
          <button
            key={s.id}
            type="button"
            className="ed-sekme"
            aria-current={sekme === s.id}
            onClick={() => {
              setSekme(s.id);
              window.history.replaceState(null, "", `#${s.id}`);
            }}
          >
            {s.ad}
          </button>
        ))}
      </nav>

      <main className="shell ed-govde">
        {sekme === "profil" ? (
          <div className="ed-kart">
            <div className="ed-izgara">
              <Alan etiket="Ad soyad">
                <Metin
                  deger={veri.profile.name}
                  onDegis={(v) =>
                    setVeri({ ...veri, profile: { ...veri.profile, name: v } })
                  }
                />
              </Alan>
              <Alan etiket="Unvan">
                <Metin
                  deger={veri.profile.role}
                  onDegis={(v) =>
                    setVeri({ ...veri, profile: { ...veri.profile, role: v } })
                  }
                />
              </Alan>
              <Alan etiket="Konum">
                <Metin
                  deger={veri.profile.location}
                  onDegis={(v) =>
                    setVeri({ ...veri, profile: { ...veri.profile, location: v } })
                  }
                />
              </Alan>
              <Alan etiket="E-posta">
                <Metin
                  deger={veri.profile.email}
                  onDegis={(v) =>
                    setVeri({ ...veri, profile: { ...veri.profile, email: v } })
                  }
                />
              </Alan>
              <Alan etiket="İkinci e-posta" ipucu="Boş bırakabilirsin.">
                <Metin
                  deger={veri.profile.emailAlt}
                  onDegis={(v) =>
                    setVeri({ ...veri, profile: { ...veri.profile, emailAlt: v } })
                  }
                />
              </Alan>
              <Alan etiket="Telefon">
                <Metin
                  deger={veri.profile.phone}
                  onDegis={(v) =>
                    setVeri({ ...veri, profile: { ...veri.profile, phone: v } })
                  }
                />
              </Alan>
              <Alan etiket="GitHub adresi" ipucu="https://github.com/kullanici">
                <Metin
                  deger={veri.profile.github}
                  onDegis={(v) =>
                    setVeri({ ...veri, profile: { ...veri.profile, github: v } })
                  }
                />
              </Alan>
              <Alan etiket="GitHub görünen ad">
                <Metin
                  deger={veri.profile.githubLabel}
                  onDegis={(v) =>
                    setVeri({ ...veri, profile: { ...veri.profile, githubLabel: v } })
                  }
                />
              </Alan>
              <Alan etiket="Site adresi">
                <Metin
                  deger={veri.profile.site}
                  onDegis={(v) =>
                    setVeri({ ...veri, profile: { ...veri.profile, site: v } })
                  }
                />
              </Alan>
              <Alan etiket="Site görünen ad">
                <Metin
                  deger={veri.profile.siteLabel}
                  onDegis={(v) =>
                    setVeri({ ...veri, profile: { ...veri.profile, siteLabel: v } })
                  }
                />
              </Alan>
            </div>

            <Alan
              etiket="Ana sayfadaki büyük cümle"
              ipucu="Satır sonuna bastığın yerden ikiye ayrılır."
            >
              <CokSatir
                satir={2}
                deger={veri.profile.headline}
                onDegis={(v) =>
                  setVeri({ ...veri, profile: { ...veri.profile, headline: v } })
                }
              />
            </Alan>

            <Alan etiket="Tanıtım paragrafı">
              <CokSatir
                satir={6}
                deger={veri.profile.intro}
                onDegis={(v) =>
                  setVeri({ ...veri, profile: { ...veri.profile, intro: v } })
                }
              />
            </Alan>

            <Alan etiket="Durum satırı" ipucu="Boş bırakırsan ana sayfada görünmez.">
              <Metin
                deger={veri.profile.now}
                onDegis={(v) => setVeri({ ...veri, profile: { ...veri.profile, now: v } })}
              />
            </Alan>

            <Alan
              etiket="Arama sonucu açıklaması"
              ipucu="Google'da ve link önizlemelerinde görünen iki cümle."
            >
              <CokSatir
                satir={3}
                deger={veri.profile.metaDescription}
                onDegis={(v) =>
                  setVeri({ ...veri, profile: { ...veri.profile, metaDescription: v } })
                }
              />
            </Alan>
          </div>
        ) : null}

        {sekme === "oyunlar" ? (
          <>
            <button
              type="button"
              className="btn ed-ekle"
              onClick={() =>
                listeyiDegistir("games", (liste) => [
                  {
                    slug: "",
                    title: "",
                    year: String(new Date().getFullYear()),
                    role: "",
                    engine: "",
                    tagline: "",
                    detail: [],
                    tags: [],
                    cover: "",
                    status: "",
                    links: [],
                  },
                  ...liste,
                ])
              }
            >
              Oyun ekle
            </button>

            {veri.games.map((oyun, sira) => (
              <div className="ed-kart" key={sira}>
                <div className="ed-kart-bas">
                  <span className="ed-kart-ad">{oyun.title || "Adsız oyun"}</span>
                  <SiraDugmeleri
                    sira={sira}
                    toplam={veri.games.length}
                    silUyari={`"${oyun.title}" silinsin mi?`}
                    onTasi={(yon) =>
                      listeyiDegistir("games", (liste) => tasi(liste, sira, yon))
                    }
                    onSil={() =>
                      listeyiDegistir("games", (liste) =>
                        liste.filter((_, i) => i !== sira),
                      )
                    }
                  />
                </div>

                <KapakSec
                  deger={oyun.cover ?? ""}
                  onDegis={(yol) => oyunGuncelle(sira, { cover: yol })}
                />

                <div className="ed-izgara">
                  <Alan etiket="Oyun adı">
                    <Metin
                      deger={oyun.title}
                      onDegis={(v) =>
                        oyunGuncelle(sira, {
                          title: v,
                          slug: oyun.slug ? oyun.slug : adresAdi(v),
                        })
                      }
                    />
                  </Alan>
                  <Alan etiket="Kısa ad" ipucu="Örnek: dustbound-railroad">
                    <Metin
                      deger={oyun.slug}
                      onDegis={(v) => oyunGuncelle(sira, { slug: adresAdi(v) })}
                    />
                  </Alan>
                  <Alan etiket="Yıl" ipucu="Örnek: 2025 — devam ediyor">
                    <Metin
                      deger={oyun.year}
                      onDegis={(v) => oyunGuncelle(sira, { year: v })}
                    />
                  </Alan>
                  <Alan etiket="Senin rolün" ipucu="Örnek: Geliştirici">
                    <Metin
                      deger={oyun.role}
                      onDegis={(v) => oyunGuncelle(sira, { role: v })}
                    />
                  </Alan>
                  <Alan etiket="Motor ve dil" ipucu="Örnek: Unity · C#">
                    <Metin
                      deger={oyun.engine}
                      onDegis={(v) => oyunGuncelle(sira, { engine: v })}
                    />
                  </Alan>
                  <Alan etiket="Durum">
                    <select
                      className="ed-girdi"
                      value={oyun.status ?? ""}
                      onChange={(e) =>
                        oyunGuncelle(sira, { status: e.target.value as Game["status"] })
                      }
                    >
                      <option value="">Belirtme</option>
                      <option value="Yayında">Yayında</option>
                      <option value="Geliştiriliyor">Geliştiriliyor</option>
                      <option value="Tamamlandı">Tamamlandı</option>
                      <option value="Arşiv">Arşiv</option>
                    </select>
                  </Alan>
                </div>

                <Alan etiket="Tek cümlelik tanıtım">
                  <CokSatir
                    satir={2}
                    deger={oyun.tagline}
                    onDegis={(v) => oyunGuncelle(sira, { tagline: v })}
                  />
                </Alan>

                <Alan
                  etiket="Açıklama"
                  ipucu="Paragrafları aralarında boş satır bırakarak ayır."
                >
                  <CokSatir
                    satir={7}
                    deger={oyun.detail.join("\n\n")}
                    onDegis={(v) => oyunGuncelle(sira, { detail: paragraflar(v) })}
                  />
                </Alan>

                <Alan etiket="Üzerinde çalıştıkların" ipucu="Virgülle ayır.">
                  <Metin
                    deger={oyun.tags.join(", ")}
                    onDegis={(v) => oyunGuncelle(sira, { tags: virgullu(v) })}
                  />
                </Alan>

                <div className="ed-baglantilar">
                  <span className="ed-etiket">Bağlantılar</span>
                  {(oyun.links ?? []).map((link, li) => (
                    <div className="ed-baglanti" key={li}>
                      <Metin
                        deger={link.label}
                        placeholder="Görünen ad"
                        onDegis={(v) =>
                          oyunGuncelle(sira, {
                            links: (oyun.links ?? []).map((l, i) =>
                              i === li ? { ...l, label: v } : l,
                            ),
                          })
                        }
                      />
                      <Metin
                        deger={link.href}
                        placeholder="https://"
                        onDegis={(v) =>
                          oyunGuncelle(sira, {
                            links: (oyun.links ?? []).map((l, i) =>
                              i === li ? { ...l, href: v } : l,
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        className="ed-mini ed-mini-sil"
                        onClick={() =>
                          oyunGuncelle(sira, {
                            links: (oyun.links ?? []).filter((_, i) => i !== li),
                          })
                        }
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="ed-mini"
                    onClick={() =>
                      oyunGuncelle(sira, {
                        links: [...(oyun.links ?? []), { label: "", href: "" }],
                      })
                    }
                  >
                    Bağlantı ekle
                  </button>
                </div>
              </div>
            ))}
          </>
        ) : null}

        {sekme === "projeler" ? (
          <>
            <button
              type="button"
              className="btn ed-ekle"
              onClick={() =>
                listeyiDegistir("projects", (liste) => [
                  {
                    slug: "",
                    title: "",
                    year: String(new Date().getFullYear()),
                    role: "",
                    summary: "",
                    detail: [],
                    stack: [],
                    status: "",
                    links: [],
                  },
                  ...liste,
                ])
              }
            >
              Proje ekle
            </button>

            {veri.projects.map((proje, sira) => (
              <div className="ed-kart" key={sira}>
                <div className="ed-kart-bas">
                  <span className="ed-kart-ad">{proje.title || "Adsız proje"}</span>
                  <SiraDugmeleri
                    sira={sira}
                    toplam={veri.projects.length}
                    silUyari={`"${proje.title}" silinsin mi?`}
                    onTasi={(yon) =>
                      listeyiDegistir("projects", (liste) => tasi(liste, sira, yon))
                    }
                    onSil={() =>
                      listeyiDegistir("projects", (liste) =>
                        liste.filter((_, i) => i !== sira),
                      )
                    }
                  />
                </div>

                <div className="ed-izgara">
                  <Alan etiket="Proje adı">
                    <Metin
                      deger={proje.title}
                      onDegis={(v) =>
                        projeGuncelle(sira, {
                          title: v,
                          slug: proje.slug ? proje.slug : adresAdi(v),
                        })
                      }
                    />
                  </Alan>
                  <Alan etiket="Kısa ad" ipucu="Örnek: original-otomotiv">
                    <Metin
                      deger={proje.slug}
                      onDegis={(v) => projeGuncelle(sira, { slug: adresAdi(v) })}
                    />
                  </Alan>
                  <Alan etiket="Yıl">
                    <Metin
                      deger={proje.year}
                      onDegis={(v) => projeGuncelle(sira, { year: v })}
                    />
                  </Alan>
                  <Alan etiket="Senin rolün">
                    <Metin
                      deger={proje.role}
                      onDegis={(v) => projeGuncelle(sira, { role: v })}
                    />
                  </Alan>
                  <Alan etiket="Durum">
                    <select
                      className="ed-girdi"
                      value={proje.status ?? ""}
                      onChange={(e) =>
                        projeGuncelle(sira, { status: e.target.value as Project["status"] })
                      }
                    >
                      <option value="">Belirtme</option>
                      <option value="Yayında">Yayında</option>
                      <option value="Geliştiriliyor">Geliştiriliyor</option>
                      <option value="Tamamlandı">Tamamlandı</option>
                      <option value="Arşiv">Arşiv</option>
                    </select>
                  </Alan>
                  <Alan etiket="Kullanılanlar" ipucu="Virgülle ayır.">
                    <Metin
                      deger={proje.stack.join(", ")}
                      onDegis={(v) => projeGuncelle(sira, { stack: virgullu(v) })}
                    />
                  </Alan>
                </div>

                <Alan etiket="Listede görünen cümle">
                  <CokSatir
                    satir={2}
                    deger={proje.summary}
                    onDegis={(v) => projeGuncelle(sira, { summary: v })}
                  />
                </Alan>

                <Alan
                  etiket="Açıldığında görünen metin"
                  ipucu="Paragrafları aralarında boş satır bırakarak ayır."
                >
                  <CokSatir
                    satir={7}
                    deger={proje.detail.join("\n\n")}
                    onDegis={(v) => projeGuncelle(sira, { detail: paragraflar(v) })}
                  />
                </Alan>

                <div className="ed-baglantilar">
                  <span className="ed-etiket">Bağlantılar</span>
                  {(proje.links ?? []).map((link, li) => (
                    <div className="ed-baglanti" key={li}>
                      <Metin
                        deger={link.label}
                        placeholder="Görünen ad"
                        onDegis={(v) =>
                          projeGuncelle(sira, {
                            links: (proje.links ?? []).map((l, i) =>
                              i === li ? { ...l, label: v } : l,
                            ),
                          })
                        }
                      />
                      <Metin
                        deger={link.href}
                        placeholder="https://"
                        onDegis={(v) =>
                          projeGuncelle(sira, {
                            links: (proje.links ?? []).map((l, i) =>
                              i === li ? { ...l, href: v } : l,
                            ),
                          })
                        }
                      />
                      <button
                        type="button"
                        className="ed-mini ed-mini-sil"
                        onClick={() =>
                          projeGuncelle(sira, {
                            links: (proje.links ?? []).filter((_, i) => i !== li),
                          })
                        }
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="ed-mini"
                    onClick={() =>
                      projeGuncelle(sira, {
                        links: [...(proje.links ?? []), { label: "", href: "" }],
                      })
                    }
                  >
                    Bağlantı ekle
                  </button>
                </div>
              </div>
            ))}

          </>
        ) : null}

        {(sekme === "deneyim" || sekme === "egitim") ? (
          <GecmisDuzenle
            ad={sekme === "deneyim" ? "experience" : "education"}
            liste={sekme === "deneyim" ? veri.experience : veri.education}
            ekleEtiket={sekme === "deneyim" ? "Deneyim ekle" : "Eğitim ekle"}
            kurumEtiket={sekme === "deneyim" ? "Şirket / işletme" : "Okul"}
            baslikEtiket={sekme === "deneyim" ? "Pozisyon" : "Bölüm"}
            degistir={listeyiDegistir}
            tasi={tasi}
          />
        ) : null}

        {sekme === "yetkinlik" ? (
          <>
            {veri.skills.map((grup, sira) => (
              <div className="ed-kart" key={sira}>
                <div className="ed-kart-bas">
                  <span className="ed-kart-ad">{grup.title || "Adsız başlık"}</span>
                  <SiraDugmeleri
                    sira={sira}
                    toplam={veri.skills.length}
                    silUyari={`"${grup.title}" başlığı silinsin mi?`}
                    onTasi={(yon) =>
                      listeyiDegistir("skills", (liste) => tasi(liste, sira, yon))
                    }
                    onSil={() =>
                      listeyiDegistir("skills", (liste) =>
                        liste.filter((_, i) => i !== sira),
                      )
                    }
                  />
                </div>

                <Alan etiket="Başlık">
                  <Metin
                    deger={grup.title}
                    onDegis={(v) =>
                      listeyiDegistir("skills", (liste) =>
                        liste.map((g, i) => (i === sira ? { ...g, title: v } : g)),
                      )
                    }
                  />
                </Alan>

                <Alan etiket="Maddeler" ipucu="Her satıra bir tane.">
                  <CokSatir
                    satir={6}
                    deger={grup.items.join("\n")}
                    onDegis={(v) =>
                      listeyiDegistir("skills", (liste) =>
                        liste.map((g, i) =>
                          i === sira ? { ...g, items: satirlar(v) } : g,
                        ),
                      )
                    }
                  />
                </Alan>
              </div>
            ))}

            <button
              type="button"
              className="btn ed-ekle"
              onClick={() =>
                listeyiDegistir("skills", (liste) => [
                  ...liste,
                  { title: "", items: [] } satisfies SkillGroup,
                ])
              }
            >
              Başlık ekle
            </button>
          </>
        ) : null}
      </main>
    </div>
  );
}

/* ---------- deneyim ve eğitim aynı formu paylaşıyor ---------- */

function GecmisDuzenle({
  ad,
  liste,
  ekleEtiket,
  kurumEtiket,
  baslikEtiket,
  degistir,
  tasi,
}: {
  ad: "experience" | "education";
  liste: ExperienceItem[];
  ekleEtiket: string;
  kurumEtiket: string;
  baslikEtiket: string;
  degistir: <A extends keyof SiteContent>(
    ad: A,
    islem: (liste: SiteContent[A]) => SiteContent[A],
  ) => void;
  tasi: <T>(liste: T[], sira: number, yon: -1 | 1) => T[];
}) {
  const guncelle = (sira: number, yama: Partial<ExperienceItem>) =>
    degistir(ad, (mevcut) =>
      (mevcut as ExperienceItem[]).map((k, i) =>
        i === sira ? { ...k, ...yama } : k,
      ) as SiteContent[typeof ad],
    );

  return (
    <>
      {liste.map((kayit, sira) => (
        <div className="ed-kart" key={sira}>
          <div className="ed-kart-bas">
            <span className="ed-kart-ad">{kayit.title || "Yeni kayıt"}</span>
            <SiraDugmeleri
              sira={sira}
              toplam={liste.length}
              silUyari={`"${kayit.title}" silinsin mi?`}
              onTasi={(yon) =>
                degistir(ad, (mevcut) =>
                  tasi(mevcut as ExperienceItem[], sira, yon) as SiteContent[typeof ad],
                )
              }
              onSil={() =>
                degistir(ad, (mevcut) =>
                  (mevcut as ExperienceItem[]).filter(
                    (_, i) => i !== sira,
                  ) as SiteContent[typeof ad],
                )
              }
            />
          </div>

          <div className="ed-izgara">
            <Alan etiket="Tarih aralığı" ipucu="Örnek: 2019 — bugün">
              <Metin deger={kayit.period} onDegis={(v) => guncelle(sira, { period: v })} />
            </Alan>
            <Alan etiket={baslikEtiket}>
              <Metin deger={kayit.title} onDegis={(v) => guncelle(sira, { title: v })} />
            </Alan>
            <Alan etiket={kurumEtiket}>
              <Metin deger={kayit.org} onDegis={(v) => guncelle(sira, { org: v })} />
            </Alan>
          </div>

          <Alan etiket="Açıklama">
            <CokSatir
              satir={3}
              deger={kayit.description}
              onDegis={(v) => guncelle(sira, { description: v })}
            />
          </Alan>
        </div>
      ))}

      <button
        type="button"
        className="btn ed-ekle"
        onClick={() =>
          degistir(ad, (mevcut) =>
            [
              ...(mevcut as ExperienceItem[]),
              { period: "", title: "", org: "", description: "" },
            ] as SiteContent[typeof ad],
          )
        }
      >
        {ekleEtiket}
      </button>
    </>
  );
}
