import Link from "next/link";
import { profile } from "@/content/site";

export function Nav({ variant = "home" }: { variant?: "home" | "cv" }) {
  return (
    <nav className="nav">
      <span className="ilerleme" aria-hidden="true" />
      <div className="shell nav-inner">
        <Link href="/" className="nav-name">
          {profile.name}
        </Link>

        <div className="nav-links">
          {variant === "home" ? (
            <>
              <a className="nav-link" href="#oyunlar">
                Oyunlar
              </a>
              <a className="nav-link nav-link-optional" href="#calismalar">
                Çalışmalar
              </a>
              <a className="nav-link nav-link-optional" href="#iletisim">
                İletişim
              </a>
              <Link className="nav-link nav-link-strong" href="/cv">
                CV
              </Link>
              {process.env.NODE_ENV === "development" ? (
                <Link className="nav-link nav-link-strong" href="/duzenle">
                  İçerik
                </Link>
              ) : null}
            </>
          ) : (
            <Link className="nav-link nav-link-strong" href="/">
              Ana sayfa
            </Link>
          )}
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
