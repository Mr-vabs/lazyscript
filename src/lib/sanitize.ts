import DOMPurify from 'dompurify';
// images are only allowed as data: URLs, so remote images can never taint the canvas and break export
DOMPurify.addHook('afterSanitizeAttributes', (n: Element) => { if (n.tagName === 'IMG' && !/^data:image\//.test(n.getAttribute('src') || '')) n.remove(); });
const TAGS = ['p', 'div', 'br', 'b', 'strong', 'u', 'i', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'pre', 'table', 'tbody', 'thead', 'tr', 'td', 'th', 'span', 'img'];
export const clean = (h: string) => DOMPurify.sanitize(h, { ALLOWED_TAGS: TAGS, ALLOWED_ATTR: ['style', 'src', 'data-ratio', 'data-w', 'data-fit'] });
// Copied KaTeX / MathML maths carries its LaTeX in an <annotation>: turn it back into $...$ before sanitising.
export function normalizeMath(html: string) {
  const d = new DOMParser().parseFromString(html, 'text/html');
  const tex = (e: Element) => e.querySelector('annotation[encoding="application/x-tex"]')?.textContent?.trim();
  d.querySelectorAll('.katex-display').forEach(e => { const t = tex(e); if (t) e.replaceWith(d.createTextNode('$$' + t + '$$')); });
  d.querySelectorAll('.katex, math').forEach(e => { const t = tex(e); if (t) e.replaceWith(d.createTextNode('$' + t + '$')); });
  return d.body.innerHTML;
}
