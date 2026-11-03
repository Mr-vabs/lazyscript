export const W = 595, H = 842, ML = 50, MR = 30, MT = 64, MB = 46;
export const AVAIL = W - ML - MR;
export type Paper = 'lined' | 'grid' | 'blank';
export interface Settings { fi: number; size: number; mess: number; sp: number; op: number; paper: Paper; scan: boolean; ink: string }
export const DEFAULTS: Settings = { fi: 0, size: 17, mess: 1.25, sp: 0, op: 0.45, paper: 'lined', scan: false, ink: '#1f3fb8' };
// perChar: draw letter-by-letter (print-style hands). Connected hands are drawn word-by-word so joins survive.
export const FONTS = [
  { label: 'Caveat', family: 'Caveat', perChar: false },
  { label: 'Kalam (Hindi + English)', family: 'Kalam', perChar: false },
  { label: 'Indie Flower', family: 'Indie Flower', perChar: true },
  { label: 'Reenie Beanie', family: 'Reenie Beanie', perChar: true },
  { label: 'Homemade Apple', family: 'Homemade Apple', perChar: false },
  { label: 'Dancing Script', family: 'Dancing Script', perChar: false },
];
export const lineH = (s: Settings) => Math.round(s.size * 1.5);
// handwriting font first; maths glyphs (Greek, ∑, ∫ ...) fall back per glyph to a maths-capable font
export const stack = (fi: number) => `"${FONTS[fi].family}", "Noto Sans Math", "Cambria Math", "STIX Two Math", "Times New Roman", serif`;
export const fontStr = (s: Settings, b = false, size = s.size) => `${b ? 700 : 400} ${size}px ${stack(s.fi)}`;
export const RATIOS: Record<string, number> = { '1:1': 1, '4:3': 4 / 3, '3:4': 3 / 4, '16:9': 16 / 9, '3:2': 3 / 2 };
export const IMG_WIDTHS: Record<string, number> = { Small: 150, Medium: 250, Full: AVAIL };
