import type { Metadata } from "next";
import { Footer, Nav } from "@/components/Chrome";
import { PrintButton } from "@/components/PrintButton";
import {
  education,
  experience,
  games,
  hobbies,
  languages,
  profile,
  projects,
  skills,
} from "@/content/site";

export const metadata: Metadata = {
  title: `CV — ${profile.name}`,
  description: `${profile.name} özgeçmişi.`,
};

export default function CvPage() {
  return (
    <>
      <Nav variant="cv" />

      <main className="cv shell">
        <header className="cv-head">
          <div>
            <h1 className="cv-name">{profile.name}</h1>
            <p className="cv-role">{profile.role}</p>
          </div>

          <ul className="cv-contact">
            {profile.phone ? <li>{profile.phone}</li> : null}
            <li>{profile.email}</li>
            {profile.emailAlt ? <li>{profile.emailAlt}</li> : null}
            <li>{profile.githubLabel}</li>
            <li>{profile.location}</li>
          </ul>
        </header>

        <div className="cv-tools">
          <PrintButton>Yazdır / PDF olarak kaydet</PrintButton>
        </div>

        {profile.goal ? (
          <section className="cv-section">
            <h2 className="cv-section-title">Hedef</h2>
            <p className="cv-intro">{profile.goal}</p>
          </section>
        ) : null}

        {education.length ? (
          <section className="cv-section">
            <h2 className="cv-section-title">Eğitim</h2>
            {education.map((item) => (
              <article className="cv-entry" key={`${item.org}-${item.title}`}>
                <div className="cv-entry-period">{item.period}</div>
                <div>
                  <h3 className="cv-entry-title">
                    {item.title} <span className="cv-entry-org">· {item.org}</span>
                  </h3>
                  {item.description ? (
                    <p className="cv-entry-desc">{item.description}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {games.length ? (
          <section className="cv-section">
            <h2 className="cv-section-title">Oyunlar</h2>
            {games.map((game) => (
              <article className="cv-entry" key={game.slug}>
                <div className="cv-entry-period">{game.year}</div>
                <div>
                  <h3 className="cv-entry-title">
                    {game.title} <span className="cv-entry-org">· {game.role}</span>
                  </h3>
                  <p className="cv-entry-desc">{game.tagline}</p>
                  {game.detail.map((paragraph) => (
                    <p className="cv-entry-desc" key={paragraph.slice(0, 24)}>
                      {paragraph}
                    </p>
                  ))}
                  <p className="cv-entry-stack">
                    {[game.engine, ...game.tags].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {experience.length ? (
          <section className="cv-section">
            <h2 className="cv-section-title">Deneyim</h2>
            {experience.map((item) => (
              <article className="cv-entry" key={`${item.org}-${item.title}`}>
                <div className="cv-entry-period">{item.period}</div>
                <div>
                  <h3 className="cv-entry-title">
                    {item.title} <span className="cv-entry-org">· {item.org}</span>
                  </h3>
                  <p className="cv-entry-desc">{item.description}</p>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {projects.length ? (
          <section className="cv-section">
            <h2 className="cv-section-title">Projeler</h2>
            {projects.map((project) => (
              <article className="cv-entry" key={project.slug}>
                <div className="cv-entry-period">{project.year}</div>
                <div>
                  <h3 className="cv-entry-title">
                    {project.title} <span className="cv-entry-org">· {project.role}</span>
                  </h3>
                  <p className="cv-entry-desc">{project.summary}</p>
                  <p className="cv-entry-stack">{project.stack.join(" · ")}</p>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        <section className="cv-section">
          <h2 className="cv-section-title">Yetkinlikler</h2>
          <div className="cv-skills">
            {skills.map((group) => (
              <div className="cv-skill-group" key={group.title}>
                <span className="cv-skill-title">{group.title}</span>
                <span className="cv-skill-items">{group.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="cv-section">
          <h2 className="cv-section-title">Diller</h2>
          <div className="cv-skills">
            {languages.map((language) => (
              <div className="cv-skill-group" key={language.name}>
                <span className="cv-skill-title">{language.name}</span>
                <span className="cv-skill-items">{language.level}</span>
              </div>
            ))}
          </div>
        </section>

        {hobbies.length ? (
          <section className="cv-section">
            <h2 className="cv-section-title">İlgi alanları</h2>
            <p className="cv-intro">{hobbies.join(" · ")}</p>
          </section>
        ) : null}
      </main>

      <Footer />
    </>
  );
}
