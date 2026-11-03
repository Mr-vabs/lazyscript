/** Lightweight LaTeX-to-handwritten SVG renderer. Keeps source LaTeX in the editor DOM. */

type Node = { kind: 'row'; children: Node[] } | { kind: 'atom'; value: string } | { kind: 'frac'; top: Node; bottom: Node } | { kind: 'sqrt'; body: Node } | { kind: 'script'; base: Node; sup?: Node; sub?: Node };
type Box = { width: number; height: number; baseline: number; markup: string };

const SYMBOLS: Record<string, string> = {
  alpha:'α', beta:'β', gamma:'γ', delta:'δ', epsilon:'ε', theta:'θ', lambda:'λ', mu:'μ', pi:'π', rho:'ρ', sigma:'σ', phi:'φ', omega:'ω',
  Gamma:'Γ', Delta:'Δ', Theta:'Θ', Lambda:'Λ', Pi:'Π', Sigma:'Σ', Phi:'Φ', Omega:'Ω',
  times:'×', cdot:'·', div:'÷', pm:'±', mp:'∓', leq:'≤', le:'≤', geq:'≥', ge:'≥', neq:'≠', approx:'≈', infty:'∞',
  sum:'∑', prod:'∏', int:'∫', partial:'∂', nabla:'∇',rightarrow:'→',leftarrow:'←',Rightarrow:'⇒',Leftrightarrow:'⇔', degree:'°'
};

class Parser {
  private i = 0;
  private readonly source: string;
  constructor(source: string) { this.source = source; }
  parse(): Node { return this.row(); }
  private row(stopAtBrace = false): Node {
    const children: Node[] = [];
    while (this.i < this.source.length) {
      const ch = this.source[this.i];
      if (ch === '}' && stopAtBrace) { this.i++; break; }
      if (ch === '}' || ch === '&') { this.i++; continue; }
      if (/\s/.test(ch)) { this.i++; children.push({kind:'atom', value:' '}); continue; }
      let base: Node;
      if (ch === '{') { this.i++; base = this.row(true); }
      else if (ch === '\\') base = this.command();
      else { this.i++; base = {kind:'atom', value: ch}; }
      let sup: Node | undefined; let sub: Node | undefined;
      while (this.i < this.source.length && (this.source[this.i] === '^' || this.source[this.i] === '_')) {
        const op = this.source[this.i++]; const arg = this.argument();
        if (op === '^') sup = arg; else sub = arg;
      }
      children.push(sup || sub ? {kind:'script', base, sup, sub} : base);
    }
    return {kind:'row', children};
  }
  private argument(): Node {
    if (this.source[this.i] === '{') { this.i++; return this.row(true); }
    if (this.source[this.i] === '\\') return this.command();
    const value = this.source[this.i++] || '';
    return {kind:'atom', value};
  }
  private command(): Node {
    this.i++;
    const start = this.i;
    while (/[A-Za-z]/.test(this.source[this.i] || '')) this.i++;
    const name = this.source.slice(start, this.i);
    if (!name) return {kind:'atom', value:'\\'};
    if (name === 'frac' || name === 'dfrac' || name === 'tfrac') return {kind:'frac', top:this.argument(), bottom:this.argument()};
    if (name === 'sqrt') return {kind:'sqrt', body:this.argument()};
    if (name === 'left' || name === 'right' || name === 'displaystyle' || name === 'textstyle') return this.argumentIfGroupOrNext();
    if (name === 'text' || name === 'mathrm' || name === 'mathbf' || name === 'operatorname') return this.argument();
    if (name === 'quad' || name === 'qquad') return {kind:'atom', value:'   '};
    if (name === ',') return {kind:'atom', value:' '};
    return {kind:'atom', value:SYMBOLS[name] || name};
  }
  private argumentIfGroupOrNext(): Node {
    if (this.source[this.i] === '{') return this.argument();
    return {kind:'row', children:[]};
  }
}

function esc(value: string): string { return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c] || c)); }
function layout(node: Node, size: number, seed: { n:number }): Box {
  const gap = size * 0.10;
  if (node.kind === 'atom') {
    const value = node.value;
    if (value === ' ') return {width:size*0.28,height:size*1.12,baseline:size*0.82,markup:''};
    let x = 0; let markup = '';
    for (const char of value) {
      const w = /[il1.,'`]/.test(char) ? size*.30 : /[MW∑∏]/.test(char) ? size*.82 : size*.56;
      const n = seed.n++; const rotate = ((n*17)%7)-3;
      markup += `<text x="${x.toFixed(2)}" y="${(size*.82).toFixed(2)}" font-family="Caveat, 'Segoe Script', cursive" font-size="${size}" fill="#101a35" transform="rotate(${rotate} ${x.toFixed(2)} ${(size*.82).toFixed(2)})">${esc(char)}</text>`;
      x += w;
    }
    return {width:Math.max(x,size*.25),height:size*1.12,baseline:size*.82,markup};
  }
  if (node.kind === 'row') {
    const boxes = node.children.map(child => layout(child,size,seed));
    const baseline = Math.max(size*.82,...boxes.map(b=>b.baseline));
    const below = Math.max(size*.30,...boxes.map(b=>b.height-b.baseline));
    let x=0; let markup='';
    boxes.forEach(b=>{ markup += `<g transform="translate(${x.toFixed(2)} ${(baseline-b.baseline).toFixed(2)})">${b.markup}</g>`; x += b.width + gap*.28; });
    return {width:Math.max(size*.2,x-gap*.28),height:baseline+below,baseline,markup};
  }
  if (node.kind === 'frac') {
    const a=layout(node.top,size*.78,seed), b=layout(node.bottom,size*.78,seed);
    const width=Math.max(a.width,b.width)+size*.48, x=(width-Math.max(a.width,b.width))/2;
    const topY=0, lineY=a.height+size*.12, bottomY=lineY+size*.20;
    const markup=`<g transform="translate(${x} ${topY})">${a.markup}</g><path d="M 0 ${lineY} Q ${width*.48} ${lineY+1.2} ${width} ${lineY-0.4}" fill="none" stroke="#101a35" stroke-width="${Math.max(1,size*.055)}" stroke-linecap="round"/><g transform="translate(${x} ${bottomY})">${b.markup}</g>`;
    return {width,height:bottomY+b.height,baseline:lineY+size*.15,markup};
  }
  if (node.kind === 'sqrt') {
    const b=layout(node.body,size,seed), width=b.width+size*.58;
    const markup=`<path d="M 0 ${size*.55} Q ${size*.12} ${size*.48} ${size*.20} ${size*.72} L ${size*.34} ${size*.98} L ${size*.53} ${size*.12} Q ${size*.57} ${size*.02} ${size*.66} ${size*.10} L ${width} ${size*.10}" fill="none" stroke="#101a35" stroke-width="${Math.max(1,size*.07)}" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(${size*.62} ${size*.08})">${b.markup}</g>`;
    return {width,height:Math.max(b.height+size*.08,size*1.12),baseline:b.baseline+size*.08,markup};
  }
  const base=layout(node.base,size,seed), sup=node.sup?layout(node.sup,size*.58,seed):null, sub=node.sub?layout(node.sub,size*.58,seed):null;
  const x=base.width+size*.02, supY=0, subY=base.baseline+size*.02;
  let markup=base.markup;
  if(sup) markup+=`<g transform="translate(${x} ${supY})">${sup.markup}</g>`;
  if(sub) markup+=`<g transform="translate(${x} ${subY})">${sub.markup}</g>`;
  const height=Math.max(base.height,sup?sup.height+base.baseline*.02:0,sub?subY+sub.height:0);
  return {width:x+Math.max(sup?.width||0,sub?.width||0),height,baseline:base.baseline,markup};
}

export function renderHandwrittenMath(latex: string, fontSize: number, display = false): SVGSVGElement {
  const clean = latex.replace(/\\begin\{(aligned|array|matrix|pmatrix|bmatrix)\}/g,'').replace(/\\end\{(aligned|array|matrix|pmatrix|bmatrix)\}/g,'').replace(/\\\\/g,'; ');
  const parsed = new Parser(clean).parse();
  const box = layout(parsed, Math.max(18,fontSize*1.18), {n:0});
  const pad=5, width=box.width+pad*2, height=box.height+pad*2;
  const svgText=`<svg data-ls-handwritten="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(2)} ${height.toFixed(2)}" width="${width.toFixed(2)}px" height="${height.toFixed(2)}px"><g transform="translate(${pad} ${pad})">${box.markup}</g></svg>`;
  const doc = new DOMParser().parseFromString(svgText,'image/svg+xml');
  const svg=doc.documentElement as unknown as SVGSVGElement;
  if(doc.querySelector('parsererror')) throw new Error('Could not parse this mathematical expression.');
  if(display) svg.setAttribute('data-display','true');
  return document.importNode(svg,true) as SVGSVGElement;
}
