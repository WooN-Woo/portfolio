"use client";

import { games, profile, projects } from "@/content/site";

/**
 * BMO'nun ekranına girildiğinde açılan içerik.
 *
 * 3B yüzeye basılmıyor; ekranın yerini alan gerçek bir HTML katmanı —
 * yazılar net kalsın, seçilebilsin ve klavyeyle gezilebilsin diye.
 */
export function TvEkran() {
  return (
    <div className="tv-icerik">
      <header className="tv-bas">
        <p className="tv-etiket">{profile.role}</p>
        <h1 className="tv-ad">{profile.name}</h1>
        <p className="tv-giris">{profile.intro}</p>
      </header>

      <section className="tv-bolum">
        <h2 className="tv-etiket">Oyunlar</h2>
        <ul className="tv-liste">
          {games.map((oyun) => (
            <li key={oyun.slug}>
              <span className="tv-yil">{oyun.year}</span>
              <span className="tv-baslik">{oyun.title}</span>
              <span className="tv-not">{oyun.tagline}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="tv-bolum">
        <h2 className="tv-etiket">Diğer çalışmalar</h2>
        <ul className="tv-liste">
          {projects.map((proje) => (
            <li key={proje.slug}>
              <span className="tv-yil">{proje.year}</span>
              <span className="tv-baslik">{proje.title}</span>
              <span className="tv-not">{proje.summary}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="tv-alt">
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <a href={profile.github} target="_blank" rel="noreferrer">
          {profile.githubLabel}
        </a>
      </footer>
    </div>
  );
}
