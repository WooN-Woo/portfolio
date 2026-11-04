"use client";

import { useKaydirma, aralik } from "@/lib/kaydirma";
import { games, profile, projects } from "@/content/site";

/**
 * BMO'nun ekranındaki içerik.
 *
 * Kamera ekrana yaklaştıkça beliriyor. 3B yüzeye basılmıyor; ekranın
 * önünde duran gerçek bir HTML katmanı — yazılar net kalsın,
 * klavyeyle gezilebilsin diye.
 */
export function Ekran() {
  const oran = useKaydirma(true);
  const gorunurluk = aralik(oran, 0.62, 0.9);

  return (
    <div
      className="ekran-katman"
      style={{
        opacity: gorunurluk,
        pointerEvents: gorunurluk > 0.7 ? "auto" : "none",
        transform: `scale(${0.94 + gorunurluk * 0.06})`,
      }}
    >
      <div className="ekran-cerceve">
        <div className="ekran-ic">
          <header className="ekran-bas">
            <span className="ekran-etiket">{profile.role}</span>
            <h1 className="ekran-ad">{profile.name}</h1>
            <p className="ekran-giris">{profile.intro}</p>
          </header>

          <section className="ekran-bolum">
            <span className="ekran-etiket">Oyunlar</span>
            <ul className="ekran-liste">
              {games.map((oyun) => (
                <li key={oyun.slug}>
                  <span className="ekran-yil">{oyun.year}</span>
                  <span className="ekran-baslik">{oyun.title}</span>
                  <span className="ekran-not">{oyun.tagline}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="ekran-bolum">
            <span className="ekran-etiket">Diğer çalışmalar</span>
            <ul className="ekran-liste">
              {projects.map((proje) => (
                <li key={proje.slug}>
                  <span className="ekran-yil">{proje.year}</span>
                  <span className="ekran-baslik">{proje.title}</span>
                  <span className="ekran-not">{proje.summary}</span>
                </li>
              ))}
            </ul>
          </section>

          <footer className="ekran-alt">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.github} target="_blank" rel="noreferrer">
              {profile.githubLabel}
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
