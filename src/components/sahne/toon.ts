import { DataTexture, NearestFilter, RedFormat, UnsignedByteType } from "three";

/**
 * Çizgi film gölgesi için basamaklı geçiş dokusu.
 *
 * MeshToonMaterial ışığı bu dokudan okuyor: yumuşak geçiş yerine
 * birkaç net ton veriyor — elle boyanmış sahneyle aynı dili konuşsun diye.
 */
let onbellek: DataTexture | null = null;

export function toonGecis() {
  if (onbellek) return onbellek;

  const basamaklar = new Uint8Array([70, 140, 205, 255]);
  const doku = new DataTexture(
    basamaklar,
    basamaklar.length,
    1,
    RedFormat,
    UnsignedByteType,
  );
  doku.minFilter = NearestFilter;
  doku.magFilter = NearestFilter;
  doku.generateMipmaps = false;
  doku.needsUpdate = true;

  onbellek = doku;
  return doku;
}
