/** Sıralı görünme efektlerinde kullanılan gecikme jetonu. */
export function gecikme(ms: number) {
  return { "--gecikme": `${ms}ms` } as React.CSSProperties;
}
