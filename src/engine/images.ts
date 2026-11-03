export const imgEvents = new EventTarget();
const cache = new Map<string, HTMLImageElement>();
export function getImg(src: string): HTMLImageElement | null {
  let im = cache.get(src);
  if (!im) { im = new Image(); im.onload = () => imgEvents.dispatchEvent(new Event('load')); im.src = src; cache.set(src, im); }
  return im.complete && im.naturalWidth ? im : null;
}
// Downscale on import so saved projects and PDFs stay small.
export function fileToDataUrl(file: File, max = 1400): Promise<string> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.85));
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not read that image')); };
    im.src = url;
  });
}
