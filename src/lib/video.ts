/** YouTube bağlantısından video kimliğini çıkarır; tanınmayan adreste null döner. */
export function youtubeKimlik(adres: string): string | null {
  if (!adres) return null;

  const temiz = adres.trim();
  const kaliplar = [
    /(?:youtube\.com|youtube-nocookie\.com)\/watch\?(?:.*&)?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /(?:youtube\.com|youtube-nocookie\.com)\/embed\/([\w-]{11})/,
    /(?:youtube\.com|youtube-nocookie\.com)\/shorts\/([\w-]{11})/,
    /(?:youtube\.com|youtube-nocookie\.com)\/live\/([\w-]{11})/,
  ];

  for (const kalip of kaliplar) {
    const eslesme = temiz.match(kalip);
    if (eslesme) return eslesme[1];
  }

  // Sadece kimliğin kendisi yapıştırılmışsa
  if (/^[\w-]{11}$/.test(temiz)) return temiz;

  return null;
}
