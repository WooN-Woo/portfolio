import Link from "next/link";
import { profile } from "@/content/site";

export function Nav() {
  return (
    <nav className="nav">
      <span className="ilerleme" aria-hidden="true" />
      <div className="shell nav-inner">
        <Link href="/" className="nav-name">
          {profile.name}
        </Link>

        <div className="nav-links">
          <a className="nav-link" href="#oyunlar">
            Oyunlar
          </a>
          <a className="nav-link nav-link-optional" href="#calismalar">
            Çalışmalar
          </a>
          <a className="nav-link nav-link-optional" href="#egitim">
            Eğitim
          </a>
          <a className="nav-link nav-link-strong" href="#iletisim">
            İletişim
          </a>
          {process.env.NODE_ENV === "development" ? (
            <Link className="nav-link nav-link-strong" href="/duzenle">
              İçerik
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <a href={profile.github} target="_blank" rel="noreferrer">
          {profile.githubLabel} ↗
        </a>
      </div>
    </footer>
  );
}
