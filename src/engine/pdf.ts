import { Settings } from './config';
import { Item } from './layout';
import { renderPage } from './render';
export async function exportPdf(pages: Item[][], s: Settings) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' }), cv = document.createElement('canvas');
  pages.forEach((p, i) => { renderPage(p, i, cv, 2, s, true); if (i) doc.addPage(); doc.addImage(cv.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, 595.28, 841.89); });
  doc.save('assignment.pdf');
}
