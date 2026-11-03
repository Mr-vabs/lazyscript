// LaTeX subset -> box layout -> drawn on the canvas in the handwriting font.
// Every box carries ascent/descent, so formulas sit on the text baseline instead of being pasted in as images.
import { Settings, fontStr } from './config';
export interface Box { w: number; a: number; d: number; draw: (c: CanvasRenderingContext2D, x: number, y: number, j: (k: number) => number) => void }
interface N { t: string; [k: string]: any }

const SYM: Record<string, string> = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  times: '×', cdot: '·', pm: '±', mp: '∓', div: '÷', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', equiv: '≡', sim: '∼', propto: '∝', ll: '≪', gg: '≫',
  infty: '∞', partial: '∂', nabla: '∇', forall: '∀', exists: '∃', in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', cup: '∪', cap: '∩', emptyset: '∅', therefore: '∴',
  to: '→', rightarrow: '→', leftarrow: '←', leftrightarrow: '↔', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', implies: '⇒', iff: '⇔', ldots: '…', cdots: '⋯', degree: '°', prime: '′', neg: '¬', land: '∧', lor: '∨' };
const OPS = new Set(['times', 'pm', 'mp', 'div', 'le', 'leq', 'ge', 'geq', 'ne', 'neq', 'approx', 'equiv', 'sim', 'propto', 'll', 'gg', 'in', 'notin', 'subset', 'subseteq', 'to', 'rightarrow', 'leftarrow', 'leftrightarrow', 'Rightarrow', 'Leftarrow', 'Leftrightarrow', 'implies', 'iff', 'cup', 'cap', 'land', 'lor']);
const FN = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'exp', 'min', 'max', 'sup', 'inf', 'det', 'arg', 'gcd', 'Pr', 'var', 'cov'];
const DELIM: Record<string, string> = { '.': '', langle: '⟨', rangle: '⟩', lbrace: '{', rbrace: '}', lvert: '|', rvert: '|', vert: '|', '|': '‖' };

export function parseTex(src: string): N[] {
  let i = 0;
  const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const cmd = () => { const m = /^[a-zA-Z]+|^[\s\S]/.exec(src.slice(i))!; i += m[0].length; return m[0]; };
  const raw = () => { ws(); if (src[i] !== '{') return ''; let d = 0, s = ''; i++; while (i < src.length) { const ch = src[i++]; if (ch === '{') d++; else if (ch === '}') { if (!d) break; d--; } s += ch; } return s; };
  const arg = (): N => { ws(); if (src[i] === '{') { i++; const c = seq('}'); i++; return { t: 'group', c }; } return atom() || { t: 'group', c: [] }; };
  const delim = () => { ws(); let d: string; if (src[i] === '\\') { i++; d = cmd(); } else d = src[i++] || ''; return d in DELIM ? DELIM[d] : d; };
  function seq(stop?: string): N[] {
    const out: N[] = [];
    while (i < src.length) {
      ws(); if (i >= src.length || src[i] === stop) break;
      if (stop === 'R' && src.startsWith('\\right', i)) break;
      const a = atom(); if (!a) continue;
      let u: N | undefined, l: N | undefined;
      for (;;) { ws(); if (src[i] === '^') { i++; u = arg(); } else if (src[i] === '_') { i++; l = arg(); } else break; }
      out.push(u || l ? { t: 'script', b: a, u, l } : a);
    }
    return out;
  }
  function atom(): N | null {
    ws(); const ch = src[i];
    if (ch === '{') { i++; const c = seq('}'); i++; return { t: 'group', c }; }
    if (ch === '}') { i++; return null; }
    if (ch === '\\') { i++; return command(cmd()); }
    i++;
    if (/[0-9]/.test(ch)) { let s = ch; while (i < src.length && /[0-9.]/.test(src[i])) s += src[i++]; return { t: 'sym', s }; }
    if ('+-=<>*'.includes(ch)) return { t: 'sym', s: ch === '-' ? '−' : ch === '*' ? '∗' : ch, op: true };
    if (ch === '&' || ch === '~') return { t: 'sp', w: 0.5 };
    if (ch === "'") return { t: 'sym', s: '′' };
    return { t: 'sym', s: ch };
  }
  function command(n: string): N | null {
    switch (n) {
      case 'frac': case 'dfrac': case 'tfrac': { const a = arg(), b = arg(); return { t: 'frac', n: a, d: b }; }
      case 'sqrt': { let idx: N | undefined; ws(); if (src[i] === '[') { const e = src.indexOf(']', i); idx = { t: 'group', c: parseTex(src.slice(i + 1, e)) }; i = e + 1; } return { t: 'sqrt', c: arg(), i: idx }; }
      case 'bar': case 'overline': case 'hat': case 'widehat': case 'vec': case 'tilde': case 'dot': return { t: 'acc', k: n === 'overline' ? 'bar' : n === 'widehat' ? 'hat' : n, c: arg() };
      case 'text': case 'mathrm': case 'operatorname': case 'textbf': case 'mbox': return { t: 'text', s: raw() };
      case 'mathbf': case 'boldsymbol': return { t: 'group', c: [arg()], b: 1 };
      case 'mathit': case 'mathcal': case 'mathbb': return arg();
      case 'left': { const l = delim(); const c = seq('R'); let r = ''; if (src.startsWith('\\right', i)) { i += 6; r = delim(); } return { t: 'delim', l, r, c }; }
      case 'sum': case 'prod': case 'int': case 'oint': case 'lim': case 'limsup': case 'liminf': return { t: 'big', s: n };
      case ',': case ';': case ':': case '!': case ' ': return { t: 'sp', w: 0.4 };
      case 'quad': return { t: 'sp', w: 1.6 };
      case 'qquad': return { t: 'sp', w: 3 };
      case '\\': return { t: 'sp', w: 1 };
      case '{': case '}': case '%': case '$': case '_': case '#': case '&': return { t: 'sym', s: n };
    }
    if (FN.includes(n)) return { t: 'text', s: n, fn: 1 };
    if (n in SYM) return { t: 'sym', s: SYM[n], op: OPS.has(n) };
    return { t: 'text', s: n };
  }
  return seq();
}

const mc = document.createElement('canvas').getContext('2d')!;
const tw = (str: string, z: number, s: Settings, b: boolean) => { mc.font = fontStr(s, b, z); return mc.measureText(str).width; };
function stroke(c: CanvasRenderingContext2D, p: number[][], lw: number, smooth = true) {
  c.save(); c.strokeStyle = c.fillStyle as string; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(p[0][0], p[0][1]);
  for (let k = 1; k < p.length; k++) {
    if (smooth && k < p.length - 1) c.quadraticCurveTo(p[k][0], p[k][1], (p[k][0] + p[k + 1][0]) / 2, (p[k][1] + p[k + 1][1]) / 2);
    else c.lineTo(p[k][0], p[k][1]);
  }
  c.stroke(); c.restore();
}
function textBox(str: string, z: number, s: Settings, b: boolean, pad = 0): Box {
  const tall = /[()\[\]{}|\/⟨⟩‖]/.test(str);
  return { w: tw(str, z, s, b) + pad * 2 * z, a: z * (tall ? 0.82 : 0.74), d: z * (tall || /[gjpqy,;]/.test(str) ? 0.26 : 0.06),
    draw: (c, x, y, j) => { c.font = fontStr(s, b, z); c.fillText(str, x + pad * z, y + j(0.8)); } };
}
function hbox(bs: Box[]): Box {
  let w = 0, a = 0, d = 0; bs.forEach(b => { w += b.w; a = Math.max(a, b.a); d = Math.max(d, b.d); });
  return { w, a, d, draw: (c, x, y, j) => { let cx = x; bs.forEach(b => { b.draw(c, cx, y, j); cx += b.w; }); } };
}
function lay(n: N, z: number, s: Settings, disp: boolean, b: boolean): Box {
  switch (n.t) {
    case 'sym': return textBox(n.s, z, s, b, n.op ? 0.2 : 0);
    case 'text': return textBox(n.s, z, s, b, n.fn ? 0.06 : 0);
    case 'sp': return { w: n.w * z * 0.4, a: 0, d: 0, draw: () => {} };
    case 'group': return hbox(n.c.map((k: N) => lay(k, z, s, disp, b || !!n.b)));
    case 'frac': {
      const nb = lay(n.n, z * 0.88, s, false, b), db = lay(n.d, z * 0.88, s, false, b), g = z * 0.14, ax = z * 0.3, w = Math.max(nb.w, db.w) + z * 0.3;
      return { w, a: ax + g + nb.d + nb.a, d: Math.max(0, db.a + db.d + g - ax), draw: (c, x, y, j) => {
        const yb = y - ax; nb.draw(c, x + (w - nb.w) / 2, yb - g - nb.d, j); db.draw(c, x + (w - db.w) / 2, yb + g + db.a, j);
        stroke(c, [[x + z * 0.05, yb + j(0.6)], [x + w / 2, yb + j(0.9)], [x + w - z * 0.05, yb + j(0.6)]], z * 0.07); } };
    }
    case 'sqrt': {
      const body = lay(n.c, z, s, disp, b), idx = n.i ? lay(n.i, z * 0.55, s, false, b) : null, rw = z * 0.6 + (idx ? idx.w * 0.6 : 0), a = body.a + z * 0.2;
      return { w: rw + body.w + z * 0.15, a, d: body.d, draw: (c, x, y, j) => {
        const ty = y - a + z * 0.03, bx = x + rw;
        stroke(c, [[bx - z * 0.5, y - a * 0.35 + j(0.5)], [bx - z * 0.28, y + body.d + z * 0.04], [bx - z * 0.02, ty + j(0.5)], [bx + body.w + z * 0.12, ty + j(0.5)]], z * 0.07, false);
        body.draw(c, bx, y, j); if (idx) idx.draw(c, x, y - a * 0.45, j); } };
    }
    case 'script': {
      const bs = lay(n.b, z, s, disp, b), sz = z * 0.62, u = n.u ? lay(n.u, sz, s, false, b) : null, l = n.l ? lay(n.l, sz, s, false, b) : null;
      if (n.b.t === 'big' && (disp || n.b.s.startsWith('lim'))) {
        const w = Math.max(bs.w, u ? u.w : 0, l ? l.w : 0), g = z * 0.08;
        return { w, a: bs.a + (u ? g + u.d + u.a : 0), d: bs.d + (l ? g + l.a + l.d : 0), draw: (c, x, y, j) => {
          bs.draw(c, x + (w - bs.w) / 2, y, j); if (u) u.draw(c, x + (w - u.w) / 2, y - bs.a - g - u.d, j); if (l) l.draw(c, x + (w - l.w) / 2, y + bs.d + g + l.a, j); } };
      }
      const up = Math.max(z * 0.4, bs.a * 0.6), dn = Math.max(z * 0.18, bs.d + z * 0.1), sw = Math.max(u ? u.w : 0, l ? l.w : 0) + z * 0.06;
      return { w: bs.w + sw, a: Math.max(bs.a, u ? up + u.a : 0), d: Math.max(bs.d, l ? dn + l.d : 0), draw: (c, x, y, j) => {
        bs.draw(c, x, y, j); if (u) u.draw(c, x + bs.w + z * 0.03, y - up, j); if (l) l.draw(c, x + bs.w + z * 0.03, y + dn, j); } };
    }
    case 'big': {
      if (n.s.startsWith('lim')) return textBox(n.s, z, s, false, 0.05);
      const g = ({ sum: '∑', prod: '∏', int: '∫', oint: '∮' } as Record<string, string>)[n.s], sc = disp ? 1.5 : 1.15, sh = z * 0.28 * (sc - 1);
      return { w: tw(g, z * sc, s, false) + z * 0.12, a: z * 0.75 * sc - sh, d: z * 0.24 * sc + sh, draw: (c, x, y, j) => { c.font = fontStr(s, false, z * sc); c.fillText(g, x + z * 0.04, y + sh + j(0.5)); } };
    }
    case 'acc': {
      const bd = lay(n.c, z, s, disp, b);
      return { w: bd.w, a: bd.a + z * 0.2, d: bd.d, draw: (c, x, y, j) => {
        bd.draw(c, x, y, j); const t = y - bd.a - z * 0.1, m = x + bd.w / 2, lw = z * 0.06;
        if (n.k === 'bar') stroke(c, [[x + z * 0.05, t + j(0.5)], [x + bd.w - z * 0.05, t + j(0.5)]], lw);
        else if (n.k === 'hat') stroke(c, [[m - z * 0.18, t + z * 0.1], [m, t - z * 0.06], [m + z * 0.18, t + z * 0.1]], lw, false);
        else if (n.k === 'vec') { stroke(c, [[x + z * 0.05, t], [x + bd.w, t]], lw); stroke(c, [[x + bd.w - z * 0.18, t - z * 0.1], [x + bd.w, t], [x + bd.w - z * 0.18, t + z * 0.1]], lw, false); }
        else if (n.k === 'tilde') stroke(c, [[m - z * 0.2, t + z * 0.04], [m - z * 0.07, t - z * 0.06], [m + z * 0.07, t + z * 0.06], [m + z * 0.2, t - z * 0.04]], lw);
        else { c.beginPath(); c.arc(m, t, z * 0.05, 0, 7); c.fill(); } } };
    }
    case 'delim': {
      const bd = hbox(n.c.map((k: N) => lay(k, z, s, disp, b))), k = Math.max(1, (bd.a + bd.d) / (z * 0.95)), cy = (bd.a - bd.d) / 2;
      const lw = n.l ? tw(n.l, z, s, false) : 0, rw = n.r ? tw(n.r, z, s, false) : 0;
      const dl = (c: CanvasRenderingContext2D, ch: string, x: number, y: number) => { if (!ch) return; c.save(); c.font = fontStr(s, false, z); c.translate(x, y - cy + z * 0.27 * k); c.scale(1, k); c.fillText(ch, 0, 0); c.restore(); };
      return { w: lw + bd.w + rw + z * 0.1, a: bd.a, d: bd.d, draw: (c, x, y, j) => { dl(c, n.l, x, y); bd.draw(c, x + lw + z * 0.05, y, j); dl(c, n.r, x + lw + bd.w + z * 0.1, y); } };
    }
  }
  return textBox(String(n.s || ''), z, s, b);
}
export function buildMath(tex: string, size: number, s: Settings, display: boolean): Box {
  try { return hbox(parseTex(tex).map(n => lay(n, size, s, display, false))); }
  catch { return textBox(tex, size, s, false); }
}
export function hashStr(t: string) { let h = 2166136261; for (let k = 0; k < t.length; k++) { h ^= t.charCodeAt(k); h = Math.imul(h, 16777619); } return h >>> 0; }
