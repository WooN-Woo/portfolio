const ALT_YOL = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * public/ altındaki bir dosyanın adresini verir.
 * Site alt klasörde yayınlanıyorsa yolun başına onu ekler.
 */
export function varlik(yol: string) {
  if (!yol || !yol.startsWith("/")) return yol;
  return `${ALT_YOL}${yol}`;
}
