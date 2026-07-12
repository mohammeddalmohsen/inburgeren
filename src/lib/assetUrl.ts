export function publicAssetUrl(sourceUrl: string, baseUrl = import.meta.env.BASE_URL || '/'): string {
  if (/^(https?:|data:|blob:)/i.test(sourceUrl)) return sourceUrl;
  if (sourceUrl.startsWith('/')) return sourceUrl;
  const base = baseUrl;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedSource = sourceUrl.replace(/^\.\//, '');
  return `${normalizedBase}${normalizedSource}`;
}
