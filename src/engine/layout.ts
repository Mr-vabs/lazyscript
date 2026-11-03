// Tokens -> items -> pages. Every item is a whole number of ruled lines tall, so text never drifts off the lines
// after a formula, table or image. Lines containing tall maths grow by whole lines and keep the baseline on a rule.
import { W, H, ML, MR, MT, MB, AVAIL, Settings, lineH, fontStr, RATIOS } from './config';
import { tokens } from './tokens';
import { Box, buildMath } from './math';
export interface MathAt { box: Box; x: number; c: string | null }
export interface Item { kind: 'line' | 'row' | 'img'; n: number; y: number; base: number; [k: string]: any }
const mc = document.createElement('canvas').getContext('2d')!;
function wid(s: Settings, str: string, b?: boolean) {
  mc.font = fontStr(s, !!b); const ls = 'letterSpacing' in mc;
  if (ls) (mc as any).letterSpacing = s.sp + 'px';
  const w = mc.measureText(str).width; return ls ? w : w + s.sp * str.length;
}
export function layout(root: HTMLElement, s: Settings): Item[][] {
  const h = lineH(s), maxX = W - MR, items: Item[] = [];
  let L: any = null, ind = 0, code = false, codeC: string | null = null;
  const lists: { o: boolean; i: number }[] = [];
  const open = () => { if (!L) L = { kind: 'line', words: [], maths: [], x: ML + ind + (code ? 12 : 0), a: 0.74 * h, d: 0.26 * h, code, codeC }; };
  const has = () => L && (L.words.length || L.maths.length);
  const end = () => {
    if (!L) return;
    const ex = Math.max(0, Math.ceil((L.a - 0.74 * h) / h - 1e-6)), bl = Math.max(0, Math.ceil((L.d - 0.26 * h) / h - 1e-6));
    L.n = 1 + ex + bl; L.base = (ex + 0.74) * h; items.push(L); L = null;
  };
  const blank = () => items.push({ kind: 'line', words: [], maths: [], n: 1, y: 0, base: 0.74 * h });
  for (const t of tokens(root)) {
    switch (t.k) {
      case 'blk': end(); break;
      case 'nl': if (L) end(); else blank(); break;
      case 'list': end(); lists.push({ o: t.o, i: 0 }); ind += 18; break;
      case 'endlist': end(); lists.pop(); ind -= 18; break;
      case 'li': { end(); const l = lists[lists.length - 1] || { o: false, i: 0 }; l.i++; open(); L.x -= 18; L.words.push({ s: l.o ? l.i + '.' : '•', x: L.x, b: true, c: null }); L.x += 18; break; }
      case 'pre': end(); code = true; codeC = t.c; break;
      case 'endpre': end(); code = false; break;
      case 'sp': if (has()) L.x += wid(s, ' '); break;
      case 'w': {
        open(); const w = wid(s, t.s, t.b);
        if (L.x + w > maxX && has() && !t.code) { end(); open(); }
        L.words.push({ s: t.s, x: L.x, b: t.b, u: t.u, c: t.c }); L.x += w; break;
      }
      case 'math': {
        const box = buildMath(t.tex, s.size * 1.05, s, t.display);
        if (t.display) { end(); open(); L.maths.push({ box, x: Math.max(ML, ML + (AVAIL - box.w) / 2), c: t.c }); L.a = Math.max(L.a, box.a); L.d = Math.max(L.d, box.d); end(); break; }
        open(); if (L.x + box.w > maxX && has()) { end(); open(); }
        L.maths.push({ box, x: L.x, c: t.c }); L.x += box.w + s.size * 0.15; L.a = Math.max(L.a, box.a); L.d = Math.max(L.d, box.d); break;
      }
      case 'tbl': {
        end(); const cols = Math.max(...t.rows.map((r: any[]) => r.length)), cw = AVAIL / cols;
        for (const r of t.rows) {
          const cells = r.map((c: any) => {
            const ls: string[] = []; let cur = '';
            c.t.split(' ').forEach((w: string) => { const tr = cur ? cur + ' ' + w : w; if (cur && wid(s, tr, c.b) > cw - 10) { ls.push(cur); cur = w; } else cur = tr; });
            ls.push(cur); return { ls, b: c.b, c: c.c };
          });
          items.push({ kind: 'row', cells, cw, n: Math.max(...cells.map((c: any) => c.ls.length)), y: 0, base: 0.74 * h });
        }
        break;
      }
      case 'img': {
        end(); let w = Math.min(t.w, AVAIL), fh = w / (t.ratio || RATIOS['4:3']); const maxH = H - MT - MB - h;
        if (fh > maxH) { fh = maxH; w = fh * t.ratio; }
        items.push({ kind: 'img', src: t.src, fit: t.fit, w, fh, x: ML + (AVAIL - w) / 2, n: Math.ceil((fh + 10) / h), y: 0, base: 0 });
        break;
      }
    }
  }
  end();
  const pages: Item[][] = [[]]; let y = MT;
  for (const it of items) {
    const ih = it.n * h;
    if (y + ih > H - MB && pages[pages.length - 1].length) { pages.push([]); y = MT; }
    pages[pages.length - 1].push({ ...it, y }); y += ih;
  }
  return pages;
}
