import { Footer, Nav } from "@/components/Chrome";
import { GameShowcase } from "@/components/GameShowcase";
import { Reveal } from "@/components/Reveal";
import { WorkIndex } from "@/components/WorkIndex";
import {
  education,
  experience,
  games,
  profile,
  projects,
  skills,
} from "@/content/site";
import { gecikme } from "@/lib/anim";

export default function Home() {
  const basliklar = profile.headline.split("\n");
  const gecmis = [...experience, ...education];

  return (
    <>
      <a className="skip" href="#icerik">
        İçeriğe geç
      </a>
      <Nav />

      <main id="icerik">
        <header className="hero shell">
          <span className="label hero-eyebrow giris">{profile.role}</span>

          <h1 className="hero-title">
            {basliklar.map((satir, i) => (
              <span className="hero-satir" key={satir}>
                <span style={gecikme(120 + i * 110)}>{satir}</span>
              </span>
            ))}
          </h1>

          <p className="hero-lead giris" style={gecikme(120 + basliklar.length * 110)}>
            {profile.intro}
          </p>

          <div
            className="hero-actions giris"
            style={gecikme(210 + basliklar.length * 110)}
          >
            <a className="btn btn-solid" href="#oyunlar">
              Oyunlara bak
            </a>
            <a className="btn" href={`mailto:${profile.email}`}>
              E-posta gönder
            </a>
          </div>

          {profile.now ? (
            <p className="hero-now giris" style={gecikme(300 + basliklar.length * 110)}>
              <span className="hero-dot" aria-hidden="true" />
              {profile.now}
            </p>
          ) : null}
        </header>

        {games.length ? (
          <section className="section" id="oyunlar">
            <div className="shell section-grid">
              <div className="section-rail">
                <span className="label">Oyunlar</span>
              </div>
              <div className="section-body">
                <GameShowcase games={games} />
              </div>
            </div>
          </section>
        ) : null}

        {projects.length ? (
          <section className="section" id="calismalar">
            <div className="shell section-grid">
              <div className="section-rail">
                <span className="label">Diğer çalışmalar</span>
              </div>
              <div className="section-body">
                <WorkIndex projects={projects} />
              </div>
            </div>
          </section>
        ) : null}

        {gecmis.length ? (
          <section className="section" id="egitim">
            <div className="shell section-grid">
              <div className="section-rail">
                <span className="label">
                  {experience.length ? "Deneyim ve eğitim" : "Eğitim"}
                </span>
              </div>
              <div className="section-body">
                <div className="tl">
                  {gecmis.map((item, i) => (
                    <Reveal
                      as="article"
                      className="tl-item"
                      delay={i * 90}
                      key={`${item.org}-${item.title}`}
                    >
                      <div className="tl-period">{item.period}</div>
                      <div>
                        <h3 className="tl-title">{item.title}</h3>
                        <div className="tl-org">{item.org}</div>
                        {item.description ? (
                          <p className="tl-desc">{item.description}</p>
                        ) : null}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="section" id="yetkinlikler">
          <div className="shell section-grid">
            <div className="section-rail">
              <span className="label">Yetkinlikler</span>
            </div>
            <div className="section-body">
              <div className="skills">
                {skills.map((group, i) => (
                  <Reveal delay={i * 90} key={group.title}>
                    <h3 className="skill-title">{group.title}</h3>
                    <ul>
                      {group.items.map((item) => (
                        <li className="skill-item" key={item}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="iletisim">
          <div className="shell section-grid">
            <div className="section-rail">
              <span className="label">İletişim</span>
            </div>
            <div className="section-body">
              <Reveal>
                <h2 className="contact-title">Birlikte bir şey yapalım.</h2>
              </Reveal>

              <Reveal delay={120}>
                <div className="contact-list">
                  <a className="contact-row" href={`mailto:${profile.email}`}>
                    <span className="contact-row-key">E-posta</span>
                    <span className="contact-row-value">{profile.email}</span>
                  </a>

                  {profile.phone ? (
                    <a
                      className="contact-row"
                      href={`tel:${profile.phone.replace(/\s/g, "")}`}
                    >
                      <span className="contact-row-key">Telefon</span>
                      <span className="contact-row-value">{profile.phone}</span>
                    </a>
                  ) : null}

                  <a
                    className="contact-row"
                    href={profile.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="contact-row-key">GitHub</span>
                    <span className="contact-row-value">{profile.githubLabel}</span>
                  </a>

                  {profile.site ? (
                    <a
                      className="contact-row"
                      href={profile.site}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="contact-row-key">Site</span>
                      <span className="contact-row-value">{profile.siteLabel}</span>
                    </a>
                  ) : null}

                  <div className="contact-row">
                    <span className="contact-row-key">Konum</span>
                    <span className="contact-row-value">{profile.location}</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
