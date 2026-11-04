"use client";

import { ESYA_NOTLARI, esyaSec, useSeciliEsya } from "@/lib/esya";

/** Masadaki bir eşyaya tıklanınca açılan küçük not. */
export function Not() {
  const secili = useSeciliEsya();
  const not = secili ? ESYA_NOTLARI[secili] : null;

  return (
    <div className="not-katman" data-acik={Boolean(not)}>
      {not ? (
        <div className="not-kutu" role="dialog" aria-label={not.baslik}>
          <div className="not-bas">
            <strong>{not.baslik}</strong>
            <button type="button" onClick={() => esyaSec(null)} aria-label="Kapat">
              ×
            </button>
          </div>
          <p>{not.metin}</p>
        </div>
      ) : null}
    </div>
  );
}
