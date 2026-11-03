import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { DEFAULTS, FONTS, RATIOS, IMG_WIDTHS, Settings } from './engine/config';
import { ensureFont } from './engine/fonts';
import { layout, Item } from './engine/layout';
import { renderPage } from './engine/render';
import { buildMath } from './engine/math';
import { fileToDataUrl, imgEvents } from './engine/images';
import { exportPdf } from './engine/pdf';
import { clean, normalizeMath } from './lib/sanitize';
import { loadDraft, saveDraft, downloadProject, readProject } from './lib/storage';

const SAMPLE = `<h3>Statistics – Assignment 1</h3><p>Q1. Find the sample mean and the standard deviation.</p><p>Ans. The sample mean is $\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i = 6$ and the standard deviation is</p><p>$$s=\\sqrt{\\frac{\\sum_{i=1}^{n}(x_i-\\bar{x})^2}{n-1}}$$</p><p>so $s \\approx 1.58$. Type formulas as LaTeX between dollar signs.</p>`;
const AI_PROMPT = `You are writing an assignment for LazyScript, a handwriting-style document editor. Output ONLY raw HTML body content. Do not use Markdown, code fences, explanations outside the HTML, or a full HTML document.

DOCUMENT STRUCTURE
- Use semantic HTML such as <h2>, <h3>, <p>, <b>, <u>, <ul>, <ol>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td> and <pre> where appropriate.
- Put each question and answer in readable paragraphs. Make question labels bold; use black for questions and blue for answers when inline styling is useful.
- Keep paragraphs concise and naturally spaced. Do not create layout with excessive <br> tags.

MATHEMATICS — IMPORTANT
- Write EVERY mathematical expression as LaTeX source in the HTML text. Do not render, attach, link, describe, or substitute formulas as images, screenshots, SVG, MathML, Unicode-art, or HTML drawings.
- Inline mathematics MUST use one dollar delimiter on each side: $...$. Example: <p>The mean is $\bar{x}=\frac{1}{n}\sum_{i=1}^{n}x_i$.</p>
- A standalone/display equation MUST be the only content in its own paragraph and use two dollar delimiters on each side: <p>$$s=\sqrt{\frac{\sum_{i=1}^{n}(x_i-\bar{x})^2}{n-1}}$$</p>.
- Never put LaTeX inside <pre>, <code>, HTML attributes, or a code block. Do not HTML-escape the LaTeX backslashes or dollar delimiters.
- Use braces for multi-character powers and indices: $x^{n+1}$, $a_{ij}$. Use \frac{numerator}{denominator} for fractions and \sqrt{expression} for roots.
- Supported notation includes ordinary numbers/variables; superscripts and subscripts; nested fractions; square roots and indexed roots \sqrt[n]{x}; Greek letters such as \alpha, \beta, \theta, \lambda, \pi, \sigma; operators such as \times, \cdot, \pm, \leq, \geq, \neq, \approx, \rightarrow, \infty; functions such as \sin, \cos, \tan, \log, \ln; sums/products/integrals with limits such as \sum_{i=1}^{n}, \prod_{i=1}^{n}, \int_{a}^{b}; accents such as \bar{x}, \hat{x}, \vec{v}; grouping with \left( ... \right), \left[ ... \right]; and text inside formulas with \text{...}.
- Keep to this supported subset. Do NOT use matrix/array/aligned/cases environments (\begin{...}), \binom, equation numbering, or advanced LaTeX packages; they are not supported by the current handwriting renderer. If a problem requires a matrix, present it as a simple HTML table instead. If a symbol cannot be expressed with the supported subset, explain it in ordinary text rather than inventing a broken LaTeX command.
- Preserve the mathematical meaning, signs, parentheses, limits, units and exact values. Do not omit steps in derivations. Prefer one display equation per paragraph for reliable line layout.

OTHER RULES
- Inside <pre>, escape literal < as &lt; and > as &gt;. Do not use <style>, <script>, external resources, or <img> elements. Ordinary non-mathematical illustrations are not required.
- Question: [PASTE HERE]`;

function PageView({ page, idx, s }: { page: Item[]; idx: number; s: Settings }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), [vis, setVis] = useState(false);
  useEffect(() => { const io = new IntersectionObserver(e => setVis(e[0].isIntersecting), { rootMargin: '600px' }); io.observe(box.current!); return () => io.disconnect(); }, []);
  useEffect(() => { if (vis && cv.current) renderPage(page, idx, cv.current, 1.6, s, false); }, [vis, page, s, idx]);
  return <div ref={box} className="pg"><i>Page {idx + 1}</i><canvas ref={cv} /></div>;
}

function MathDialog({ s, onInsert, onClose }: { s: Settings; onInsert: (t: string, d: boolean) => void; onClose: () => void }) {
  const [tex, setTex] = useState('\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i'), [disp, setDisp] = useState(false), cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current!, b = buildMath(tex, 28, s, disp), w = Math.ceil(b.w + 24), h = Math.ceil(b.a + b.d + 24);
    c.width = w * 2; c.height = h * 2; c.style.width = w + 'px'; c.style.height = h + 'px';
    const x = c.getContext('2d')!; x.scale(2, 2); x.fillStyle = '#fffefa'; x.fillRect(0, 0, w, h); x.fillStyle = s.ink; b.draw(x, 12, 12 + b.a, () => 0);
  }, [tex, disp, s]);
  return <div className="modal" onClick={onClose}><div className="dlg" onClick={e => e.stopPropagation()}>
    <h2>Insert formula</h2>
    <textarea value={tex} onChange={e => setTex(e.target.value)} rows={3} spellCheck={false} aria-label="LaTeX" />
    <div className="prev"><canvas ref={cv} /></div>
    <label className="row"><input type="checkbox" checked={disp} onChange={e => setDisp(e.target.checked)} /> Put on its own centred line</label>
    <p className="hint">Supports fractions, roots, powers, subscripts, ∑ ∫ ∏ lim with limits, Greek letters, bars and hats, and \left( \right) brackets.</p>
    <div className="row end"><button onClick={onClose}>Cancel</button><button className="pri" onClick={() => onInsert(tex, disp)}>Insert</button></div>
  </div></div>;
}

function ImageDialog({ src, onInsert, onClose }: { src: string; onInsert: (r: string, w: string, f: string) => void; onClose: () => void }) {
  const [r, setR] = useState('4:3'), [w, setW] = useState('Medium'), [f, setF] = useState('cover');
  return <div className="modal" onClick={onClose}><div className="dlg" onClick={e => e.stopPropagation()}>
    <h2>Insert image</h2>
    <p className="hint">The image goes into a fixed frame, so it always takes the same whole number of lines and never pushes the text off the ruling.</p>
    <div className="frame" style={{ aspectRatio: String(RATIOS[r]), width: Math.min(IMG_WIDTHS[w], 300) }}><img src={src} style={{ objectFit: f as any }} alt="" /></div>
    <label className="row">Shape <select value={r} onChange={e => setR(e.target.value)}>{Object.keys(RATIOS).map(k => <option key={k}>{k}</option>)}</select></label>
    <label className="row">Width <select value={w} onChange={e => setW(e.target.value)}>{Object.keys(IMG_WIDTHS).map(k => <option key={k}>{k}</option>)}</select></label>
    <label className="row">Fit <select value={f} onChange={e => setF(e.target.value)}><option value="cover">Fill frame (crop)</option><option value="contain">Show whole image</option></select></label>
    <div className="row end"><button onClick={onClose}>Cancel</button><button className="pri" onClick={() => onInsert(r, w, f)}>Insert</button></div>
  </div></div>;
}

export default function App() {
  const ed = useRef<HTMLDivElement>(null), range = useRef<Range | null>(null), fileIn = useRef<HTMLInputElement>(null), imgIn = useRef<HTMLInputElement>(null);
  const [s, setS] = useState<Settings>(() => loadDraft()?.s || DEFAULTS), [ver, setVer] = useState(0), [pages, setPages] = useState<Item[][]>([]);
  const [tab, setTab] = useState<'write' | 'preview'>('write'), [toast, setToast] = useState(''), [math, setMath] = useState(false), [img, setImg] = useState<string | null>(null), [sure, setSure] = useState(false);
  const bump = () => setVer(v => v + 1), say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1800); };
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS(o => ({ ...o, [k]: v }));

  useEffect(() => { ed.current!.innerHTML = clean(loadDraft()?.html || SAMPLE); bump(); const f = () => bump(); imgEvents.addEventListener('load', f); return () => imgEvents.removeEventListener('load', f); }, []);
  useEffect(() => {
    let dead = false;
    const t = setTimeout(async () => { await ensureFont(s); if (dead || !ed.current) return; setPages(layout(ed.current, s)); saveDraft(s, ed.current.innerHTML); }, 150);
    return () => { dead = true; clearTimeout(t); };
  }, [s, ver]);
  useEffect(() => { const f = () => { const r = getSelection(); if (r && r.rangeCount && ed.current?.contains(r.anchorNode)) range.current = r.getRangeAt(0).cloneRange(); }; document.addEventListener('selectionchange', f); return () => document.removeEventListener('selectionchange', f); }, []);

  const restore = () => { ed.current!.focus(); if (range.current) { const r = getSelection()!; r.removeAllRanges(); r.addRange(range.current); } };
  const cmd = (c: string, v?: string) => { restore(); document.execCommand(c, false, v); bump(); };
  const keep = (e: React.MouseEvent) => e.preventDefault();
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault(); const h = e.clipboardData.getData('text/html');
    if (h) document.execCommand('insertHTML', false, clean(normalizeMath(h))); else document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); bump();
  };
  const pasteAI = async () => { try { const t = await navigator.clipboard.readText(); restore(); document.execCommand('insertHTML', false, clean(normalizeMath(t))); bump(); say('Pasted'); } catch { say('Clipboard access was blocked'); } };
  const copyPrompt = async () => { try { await navigator.clipboard.writeText(AI_PROMPT); say('AI prompt copied'); } catch { say('Copy was blocked by the browser'); } };
  const insertMath = (t: string, d: boolean) => { setMath(false); restore(); document.execCommand('insertText', false, d ? `$$${t}$$` : `$${t}$`); bump(); };
  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { setImg(await fileToDataUrl(f)); } catch (x: any) { say(x.message); } };
  const insertImage = (r: string, w: string, f: string) => {
    const src = img!; setImg(null); restore();
    document.execCommand('insertHTML', false, `<img src="${src}" data-ratio="${RATIOS[r]}" data-w="${IMG_WIDTHS[w]}" data-fit="${f}" style="width:${Math.min(IMG_WIDTHS[w], 360)}px;max-width:100%;aspect-ratio:${RATIOS[r]};object-fit:${f};display:block"><p><br></p>`); bump();
  };
  const table = () => { restore(); document.execCommand('insertHTML', false, '<table><tr><th>Head 1</th><th>Head 2</th></tr><tr><td>Cell</td><td>Cell</td></tr></table><p><br></p>'); bump(); };
  const clear = () => { if (!sure) { setSure(true); setTimeout(() => setSure(false), 3000); return; } setSure(false); ed.current!.innerHTML = '<p><br></p>'; bump(); say('Cleared'); };
  const openProject = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { const p = await readProject(f); setS(p.s); ed.current!.innerHTML = clean(p.html); bump(); say('Project loaded'); } catch (x: any) { say(x.message); } };
  const theme = () => { const r = document.documentElement, dark = r.dataset.theme === 'dark' || (!r.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches); r.dataset.theme = dark ? 'light' : 'dark'; };
  const pdf = async () => { say('Building PDF…'); await ensureFont(s); await exportPdf(layout(ed.current!, s), s); say('PDF saved'); };

  return <>
    <header>
      <h1>LazyScript</h1>
      <button onClick={() => fileIn.current!.click()}>Open</button>
      <button onClick={() => downloadProject(s, ed.current!.innerHTML)}>Save</button>
      <button onClick={theme} aria-label="Toggle dark mode">Theme</button>
      <button className="pri" onClick={pdf}>Download PDF</button>
      <input ref={fileIn} type="file" accept=".lazy,.json" hidden onChange={openProject} />
      <input ref={imgIn} type="file" accept="image/*" hidden onChange={pickImage} />
    </header>
    <div className="tabs"><button className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}>Write</button><button className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Preview</button></div>
    <main className={tab === 'preview' ? 'v-pv' : ''}>
      <section className="ed">
        <div className="bar">
          {['#14213d', '#1f3fb8', '#b3261e', '#1b6b3a'].map(c => <button key={c} className="sw" style={{ background: c }} aria-label={'Ink ' + c} onMouseDown={keep} onClick={() => { set('ink', c); cmd('foreColor', c); }} />)}
          <button onMouseDown={keep} onClick={() => cmd('bold')}><b>B</b></button><button onMouseDown={keep} onClick={() => cmd('underline')}><u>U</u></button>
          <button onMouseDown={keep} onClick={() => setMath(true)}>∑ Formula</button><button onMouseDown={keep} onClick={() => imgIn.current!.click()}>Image</button>
          <button onMouseDown={keep} onClick={table}>Table</button><button onClick={copyPrompt}>Copy AI prompt</button><button onClick={pasteAI}>Paste AI HTML</button><button onClick={clear}>{sure ? 'Click again to clear' : 'New page'}</button>
        </div>
        <div id="ed" ref={ed} contentEditable suppressContentEditableWarning spellCheck onInput={bump} onPaste={onPaste} aria-label="Your text" />
        <div className="set">
          <label>Messiness <input type="range" min="0" max="3" step=".25" value={s.mess} onChange={e => set('mess', +e.target.value)} /></label>
          <label>Font size <input type="range" min="12" max="26" step="1" value={s.size} onChange={e => set('size', +e.target.value)} /></label>
          <label>Letter spacing <input type="range" min="-1" max="4" step=".25" value={s.sp} onChange={e => set('sp', +e.target.value)} /></label>
          <label>Ruling opacity <input type="range" min="0" max="1" step=".1" value={s.op} onChange={e => set('op', +e.target.value)} /></label>
          <div className="full">
            <select value={s.fi} onChange={e => set('fi', +e.target.value)} aria-label="Handwriting font">{FONTS.map((f, i) => <option key={f.label} value={i}>{f.label}</option>)}</select>
            <select value={s.paper} onChange={e => set('paper', e.target.value as any)} aria-label="Paper"><option value="lined">Lined</option><option value="grid">Grid</option><option value="blank">Blank</option></select>
            <button className={s.scan ? 'on' : ''} onClick={() => set('scan', !s.scan)}>Scanner look</button>
          </div>
        </div>
      </section>
      <section className="pv" aria-label="Preview">{pages.map((p, i) => <PageView key={i} page={p} idx={i} s={s} />)}</section>
    </main>
    {math && <MathDialog s={s} onInsert={insertMath} onClose={() => setMath(false)} />}
    {img && <ImageDialog src={img} onInsert={insertImage} onClose={() => setImg(null)} />}
    <div id="toast" className={toast ? 's' : ''} role="status">{toast}</div>
  </>;
}
