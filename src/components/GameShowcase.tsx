import { GameMedia } from "@/components/GameMedia";
import { Reveal } from "@/components/Reveal";
import type { Game } from "@/content/site";

export function GameShowcase({ games }: { games: Game[] }) {
  return (
    <div className="oyunlar">
      {games.map((game, sira) => (
        <Reveal as="article" className="oyun" delay={sira * 90} key={game.slug}>
          <GameMedia title={game.title} cover={game.cover} video={game.video} />

          <div className="oyun-govde">
            <div className="oyun-ust">
              <h3 className="oyun-ad">{game.title}</h3>
              {game.status ? <span className="oyun-durum">{game.status}</span> : null}
            </div>

            <p className="oyun-meta">
              {[game.year, game.role, game.engine].filter(Boolean).join(" · ")}
            </p>

            {game.tagline ? <p className="oyun-slogan">{game.tagline}</p> : null}

            <div className="oyun-metin">
              {game.detail.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>

            {game.tags.length ? (
              <div className="oyun-etiketler">
                {game.tags.map((tag) => (
                  <span className="oyun-etiket" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {game.links?.length ? (
              <div className="oyun-baglantilar">
                {game.links.map((link) => (
                  <a
                    className="work-link"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    key={link.href}
                  >
                    {link.label} ↗
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
