import { W, H, ML, MT, MB, Settings, FONTS, lineH, fontStr } from './config';
import { Item } from './layout';
import { hashStr } from './math';
import { getImg } from './images';
function rng(a: number) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function wordW(c: CanvasRenderingContext2D, str: string) { return c.measureText(str).width; }

export function renderPage(page: Item[], pi: number, cv: HTMLCanvasElement, sc: number, s: Settings, exporting: boolean) {
  const c = cv.getContext('2d')!, h = lineH(s), m = s.mess;
  cv.width = Math.round(W * sc); cv.height = Math.round(H * sc); c.setTransform(sc, 0, 0, sc, 0, 0);
  c.fillStyle = s.scan ? '#f1f1ef' : '#fffefa'; c.fillRect(0, 0, W, H);
  if (s.op > 0 && s.paper !== 'blank') {
    c.strokeStyle = `rgba(90,130,220,${s.op})`; c.lineWidth = 0.7; c.beginPath();
    if (s.paper === 'grid') { for (let x = ML; x < W; x += h) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = MT; y < H; y += h) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke(); }
    else { for (let y = MT - 0.18 * h; y < H - MB + h; y += h) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke(); c.strokeStyle = `rgba(220,70,70,${s.op})`; c.beginPath(); c.moveTo(ML - 12, 0); c.lineTo(ML - 12, H); c.stroke(); }
  }
  c.textBaseline = 'alphabetic';
  page.forEach((it, ii) => {
    const R = rng(pi * 7919 + ii * 104729 + s.fi * 13 + Math.round(m * 100)), drift = (R() - 0.5) * m * 0.9, base = it.y + it.base;
    if (it.kind === 'img') {
      const im = getImg(it.src), x = it.x, y = it.y + 5; c.save();
      c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 4; c.fillRect(x, y, it.w, it.fh); c.shadowColor = 'transparent';
      c.beginPath(); c.rect(x, y, it.w, it.fh); c.clip();
      if (im) {
        const fr = it.w / it.fh, ir = im.naturalWidth / im.naturalHeight;
        if (it.fit === 'contain') { const dw = ir > fr ? it.w : it.fh * ir, dh = ir > fr ? it.w / ir : it.fh; c.drawImage(im, x + (it.w - dw) / 2, y + (it.fh - dh) / 2, dw, dh); }
        else { let sw = im.naturalWidth, sh = im.naturalHeight; if (ir > fr) sw = sh * fr; else sh = sw / fr; c.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, x, y, it.w, it.fh); }
      }
      c.restore(); c.fillStyle = 'rgba(235,220,150,.65)';
      [[x - 6, y - 4, -0.5], [x + it.w - 14, y - 4, 0.5]].forEach(([tx, ty, r]) => { c.save(); c.translate(tx, ty); c.rotate(r); c.fillRect(0, 0, 20, 9); c.restore(); });
      return;
    }
    if (it.kind === 'row') {
      let x = ML; c.font = fontStr(s);
      it.cells.forEach((cell: any) => {
        c.strokeStyle = '#333'; c.lineWidth = 0.8; c.strokeRect(x, it.y, it.cw, it.n * h);
        c.font = fontStr(s, cell.b); c.fillStyle = cell.c || s.ink; cell.ls.forEach((l: string, k: number) => c.fillText(l, x + 5, base + k * h + (R() - 0.5) * m)); x += it.cw;
      });
      return;
    }
    if (it.code) { c.strokeStyle = it.codeC || s.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(ML + 4, it.y + 2); c.lineTo(ML + 4, it.y + it.n * h - 2); c.stroke(); }
    it.words.forEach((w: any, wi: number) => {
      const r = rng(pi * 131071 + ii * 8191 + wi * 31 + s.fi), col = w.c && w.c !== 'rgb(0, 0, 0)' ? w.c : s.ink;
      c.save(); if ('letterSpacing' in c) (c as any).letterSpacing = s.sp + 'px';
      c.translate(w.x, base + drift + (r() - 0.5) * m * 1.4); c.rotate((r() - 0.5) * m * 0.014); c.globalAlpha = 0.86 + r() * 0.14; c.fillStyle = col; c.font = fontStr(s, w.b);
      if (FONTS[s.fi].perChar) { let x = 0; for (const ch of w.s) { const k = 1 + (r() - 0.5) * m * 0.05; c.save(); c.translate(x, (r() - 0.5) * m * 0.8); c.scale(k, k); c.fillText(ch, 0, 0); c.restore(); x += c.measureText(ch).width; } }
      else c.fillText(w.s, 0, 0);
      if (w.u) { c.strokeStyle = col; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 2.5); c.lineTo(wordW(c, w.s), 2.5 + (r() - 0.5) * 1.5); c.stroke(); }
      c.restore();
    });
    it.maths.forEach((mt: any) => {
      const r = rng(hashStr(mt.box.w.toFixed(2) + ':' + ii) + pi), j = (k: number) => (r() - 0.5) * k * m;
      c.save(); if ('letterSpacing' in c) (c as any).letterSpacing = '0px';
      c.fillStyle = mt.c && mt.c !== 'rgb(0, 0, 0)' ? mt.c : s.ink; c.globalAlpha = 0.92; mt.box.draw(c, mt.x, base + drift, j); c.restore();
    });
  });
  if (s.scan) {
    const g = c.createLinearGradient(0, 0, 70, 0); g.addColorStop(0, 'rgba(0,0,0,.09)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 70, H);
    if (exporting) { const d = c.getImageData(0, 0, cv.width, cv.height), a = d.data, N = rng(pi + 99); for (let i = 0; i < a.length; i += 4) { let v = 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2]; v = v > 185 ? 250 : v * 0.8; v += (N() - 0.5) * 26; a[i] = a[i + 1] = a[i + 2] = v; } c.putImageData(d, 0, 0); }
  }
}
