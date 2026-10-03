// Preserve identity URLs for selection and only transform the known image CDN.
export function previewUrl(source: string, width: number): string {
  try {
    const url = new URL(source);
    if (url.hostname !== 'images.unsplash.com') return source;
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', '70');
    url.searchParams.set('auto', 'format');
    return url.toString();
  } catch {
    return source;
  }
}

export function previewSrcSet(source: string): string | undefined {
  if (previewUrl(source, 320) === source) return undefined;
  return [320, 640, 960].map(width => `${previewUrl(source, width)} ${width}w`).join(', ');
}
