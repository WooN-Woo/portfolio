"use client";

import { useState } from "react";
import { varlik } from "@/lib/varlik";
import { youtubeKimlik } from "@/lib/video";

/**
 * Oyunun görseli. Video bağlantısı varsa önce kapak görünür; oynat'a
 * basılınca YouTube yüklenir. Böylece sayfa açılırken dışarıya istek gitmez.
 */
export function GameMedia({
  title,
  cover,
  video,
}: {
  title: string;
  cover?: string;
  video?: string;
}) {
  const [oynuyor, setOynuyor] = useState(false);
  const kimlik = youtubeKimlik(video ?? "");

  const kapak = cover
    ? varlik(cover)
    : kimlik
      ? `https://i.ytimg.com/vi/${kimlik}/hqdefault.jpg`
      : "";

  if (kimlik && oynuyor) {
    return (
      <div className="oyun-gorsel">
        <iframe
          className="oyun-video"
          src={`https://www.youtube-nocookie.com/embed/${kimlik}?autoplay=1&rel=0`}
          title={`${title} oynanış videosu`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const icerik = kapak ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="oyun-kapak"
      src={kapak}
      alt={`${title} oyunundan bir görsel`}
      loading="lazy"
    />
  ) : (
    <div className="oyun-bos" aria-hidden="true">
      <span>{title}</span>
    </div>
  );

  if (!kimlik) {
    return <div className="oyun-gorsel">{icerik}</div>;
  }

  return (
    <button
      type="button"
      className="oyun-gorsel oyun-oynat"
      onClick={() => setOynuyor(true)}
      aria-label={`${title} oynanış videosunu oynat`}
    >
      {icerik}
      <span className="oyun-oynat-isaret" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
    </button>
  );
}
