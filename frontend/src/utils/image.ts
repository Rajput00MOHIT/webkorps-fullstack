/**
 * Universal Image Source Resolver
 * Safely resolves image asset URLs across both Vite (string) and Next.js (StaticImageData)
 */
export function getImgSrc(img: any): string {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (typeof img === 'object' && img !== null && 'src' in img) {
    return img.src;
  }
  return String(img);
}
