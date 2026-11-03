import '@fontsource/caveat/400.css'; import '@fontsource/caveat/700.css';
import '@fontsource/kalam/400.css'; import '@fontsource/kalam/700.css';
import '@fontsource/dancing-script/400.css'; import '@fontsource/dancing-script/700.css';
import '@fontsource/indie-flower/400.css'; import '@fontsource/reenie-beanie/400.css'; import '@fontsource/homemade-apple/400.css';
import { Settings, fontStr } from './config';
// Canvas only measures correctly once the face is loaded - wait for it before every layout.
export async function ensureFont(s: Settings) {
  try {
    await document.fonts.load(fontStr(s, false, 20), 'Aa अआ');
    await document.fonts.load(fontStr(s, true, 20), 'Aa');
  } catch { /* fall back to whatever is available */ }
}
