"use client";

import { useKaydirma } from "@/lib/kaydirma";

/** BMO'nun pil göstergesi — sayfanın ne kadarını gezdiğini gösteriyor. */
export function Pil() {
  const oran = useKaydirma(true);
  const yuzde = Math.round(oran * 100);
  const dolu = yuzde >= 99;

  return (
    <div className="pil" aria-hidden="true">
      <div className="pil-govde">
        <div className="pil-dolum" style={{ width: `${Math.max(4, yuzde)}%` }} />
      </div>
      <div className="pil-uc" />
      <span className="pil-yazi">{dolu ? "DOLU" : `%${yuzde}`}</span>
    </div>
  );
}
