import { DEFAULTS } from '../engine/config';
import type { Settings } from '../engine/config';
const KEY = 'lazyscript:v2';
export function loadDraft(): { s: Settings; html: string } | null {
  try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); return o ? { s: { ...DEFAULTS, ...o.s }, html: o.html || '' } : null; } catch { return null; }
}
export function saveDraft(s: Settings, html: string) { try { localStorage.setItem(KEY, JSON.stringify({ s, html })); } catch { /* storage full or blocked */ } }
export function downloadProject(s: Settings, html: string) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ v: 2, s, html })], { type: 'application/json' }));
  a.download = 'assignment.lazy'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export async function readProject(f: File): Promise<{ s: Settings; html: string }> {
  const o = JSON.parse(await f.text()); if (typeof o.html !== 'string') throw new Error('Not a LazyScript project');
  return { s: { ...DEFAULTS, ...(o.s || o.settings) }, html: o.html };
}
