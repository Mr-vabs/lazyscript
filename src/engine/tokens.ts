// DOM -> flat token stream. Block aware, whitespace collapsed, $...$ / $$...$$ / \( \) / \[ \] become math tokens.
export interface Tok { k: string; [x: string]: any }
const BLOCK = /^(DIV|P|H[1-6]|LI|UL|OL|BLOCKQUOTE|PRE|TR)$/;
const MATH = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$(?!\s)([^$\n]*?[^\s$])\$(?!\d)/g;

export function tokens(root: HTMLElement): Tok[] {
  const out: Tok[] = [];
  const words = (t: string, s: any, code: boolean) => {
    if (code) { t.split(/(\n)/).forEach(x => { if (x === '\n') out.push({ k: 'nl' }); else if (x) out.push({ k: 'w', s: x, ...s, code: true }); }); return; }
    t.split(/(\s+)/).forEach(x => { if (!x) return; if (/^\s+$/.test(x)) out.push({ k: 'sp' }); else out.push({ k: 'w', s: x, ...s }); });
  };
  const text = (t: string, s: any, pre: boolean) => {
    if (pre) return words(t, s, true);
    let last = 0;
    for (const m of t.matchAll(MATH)) {
      words(t.slice(last, m.index), s, false);
      const display = m[1] !== undefined || m[2] !== undefined;
      out.push({ k: 'math', tex: (m[1] ?? m[2] ?? m[3] ?? m[4]).trim(), display, c: s.c });
      last = m.index! + m[0].length;
    }
    words(t.slice(last), s, false);
  };
  function walk(n: Node, s: any, pre: boolean) {
    if (n.nodeType === 3) return text(n.textContent || '', s, pre);
    if (n.nodeType !== 1) return;
    const el = n as HTMLElement, tg = el.tagName;
    if (/^(STYLE|SCRIPT)$/.test(tg)) return;
    if (tg === 'BR') { out.push({ k: 'nl' }); return; }
    if (tg === 'IMG') {
      const src = el.getAttribute('src') || '';
      if (/^data:image\//.test(src)) out.push({ k: 'img', src, ratio: parseFloat(el.dataset.ratio || '1.333'), w: parseFloat(el.dataset.w || '250'), fit: el.dataset.fit || 'cover' });
      return;
    }
    if (tg === 'TABLE') {
      out.push({ k: 'blk' });
      const rows = [...el.querySelectorAll('tr')].map(tr => [...tr.children].filter(c => /^T[DH]$/.test(c.tagName)).map(c => {
        const e = c as HTMLElement, fw = e.style.fontWeight;
        return { t: (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim(), b: c.tagName === 'TH' || fw === 'bold' || +fw >= 600, c: e.style.color || null };
      })).filter(r => r.length);
      if (rows.length) out.push({ k: 'tbl', rows });
      out.push({ k: 'blk' }); return;
    }
    const ns = { ...s }, fw = el.style.fontWeight;
    if (/^(B|STRONG|TH|H[1-6])$/.test(tg) || fw === 'bold' || +fw >= 600) ns.b = true;
    if (tg === 'U' || el.style.textDecoration.includes('underline')) ns.u = true;
    const col = el.style.color || el.getAttribute('color'); if (col) ns.c = col;
    const bl = BLOCK.test(tg); if (bl) out.push({ k: 'blk' });
    if (tg === 'UL' || tg === 'OL') { out.push({ k: 'list', o: tg === 'OL' }); el.childNodes.forEach(c => walk(c, ns, pre)); out.push({ k: 'endlist' }); return; }
    if (tg === 'LI') out.push({ k: 'li' });
    if (tg === 'PRE') out.push({ k: 'pre', c: ns.c || null });
    el.childNodes.forEach(c => walk(c, ns, pre || tg === 'PRE'));
    if (tg === 'PRE') out.push({ k: 'endpre' });
    if (bl) out.push({ k: 'blk' });
  }
  walk(root, { c: null }, false);
  return out;
}
