import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import DOMPurify from 'dompurify';
import { 
    Download, Bold, Underline, ScanLine, FileUp, Save, Image as ImageIcon, 
    Table as TableIcon, Grid3X3, AlignJustify, Moon, Sun, Type, Plus, Trash2, 
    Columns, Rows, ArrowRightFromLine, ArrowDownFromLine, ImageMinus, 
    AlignLeft, AlignCenter, AlignRight, Type as FontIcon, ChevronDown, 
    ArrowUpNarrowWide, CaseUpper, CaseLower, CaseSensitive, Bot, FilePlus, X
} from 'lucide-react';

// --- CONFIGURATION ---
const SCALE = 2; 
const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const CANVAS_WIDTH = A4_WIDTH * SCALE;
const CANVAS_HEIGHT = A4_HEIGHT * SCALE;
const MARGIN_X = 50 * SCALE;
const MARGIN_Y = 60 * SCALE;

// --- CONTENT TEMPLATES ---
const DEFAULT_CONTENT = `
<h3>Welcome to LazyScript!</h3>
<p>This tool converts typed text into realistic handwriting.<br/>
<strong>How to use:</strong></p>
<ul>
<li>Type directly here or paste text.</li>
<li>Use the toolbar for <b>Bold</b>, <u>Underline</u>, or Text Color.</li>
<li>Click the <b>Robot Icon</b> to copy a prompt for AI (ChatGPT/Gemini).</li>
</ul>
<p><strong>Table Example:</strong></p>
<table style="width: 100%; border-collapse: collapse; border: 1px solid black;">
    <tr><th style="border: 1px solid black; padding: 5px;">Feature</th><th style="border: 1px solid black; padding: 5px;">Status</th></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Handwriting</td><td style="border: 1px solid black; padding: 5px;">Realistic</td></tr>
    <tr><td style="border: 1px solid black; padding: 5px;">Export</td><td style="border: 1px solid black; padding: 5px;">PDF High Res</td></tr>
</table>
<p><br></p>
`;

const AI_SYSTEM_PROMPT = `You are an assignment writer for a handwriting tool.
1. Output ONLY the raw HTML body content. Do not wrap in markdown \`\`\` blocks.
2. **Q&A Format:**
   - Questions: BLACK (#000000) and Bold.
   - Answers: BLUE (#000f55) and Standard weight.
   - Structure:
     <p>
       <span style="color: #000000; font-weight: bold;">Ques 1:</span> <span style="color: #000000;">[Question text]</span><br/>
       <span style="color: #000f55; font-weight: bold;">Ans 1:</span> <span style="color: #000f55;">[Answer text]</span>
     </p>

3. **Code Snippets (CRITICAL):**
   - If the answer involves code (C, C++, Python, SQL), YOU MUST wrap it in a <pre> block.
   - Style: <pre style="white-space: pre-wrap; border-left: 3px solid #000; padding-left: 10px; margin: 10px 0; color: #000000;">
   - **ESCAPING:** You MUST replace all '<' with '&lt;' and '>' with '&gt;' inside the code.
   - Example:
     <pre style="white-space: pre-wrap; border-left: 3px solid #000; padding-left: 10px; color: #000000;">
     #include &lt;iostream&gt;
     
     int main() {
         cout << "Hello";
         return 0;
     }
     </pre>

4. **Tables:**
   - Use <table style="border-collapse: collapse; width: 100%; border: 1px solid black; margin: 10px 0;">
   - Cells: <td style="border: 1px solid black; padding: 5px; color: #000f55;">

5. Do NOT use markdown. formatting must be inline CSS.
Here is the question:
[PASTE QUESTION HERE]`;

// --- FONTS REGISTRY ---
const FONT_OPTIONS = [
    { id: 'default', label: 'Standard Script', family: "'Segoe Script', 'Caveat', cursive" },
    { id: 'hand',    label: 'Just Another Hand', family: "'Just Another Hand', cursive" }, 
    { id: 'allura',  label: 'Autography Style',  family: "'Allura', cursive" },            
    { id: 'apple',   label: 'Andelion Style',    family: "'Homemade Apple', cursive" },    
    { id: 'cedar',   label: 'Katalish Style',    family: "'Cedarville Cursive', cursive" },
    { id: 'indie',   label: 'Student Messy',     family: "'Indie Flower', cursive" },
];

// --- TYPES ---
type SegmentType = 'text' | 'image' | 'table';
type PaperType = 'lined' | 'grid' | 'blank';
type AlignType = 'left' | 'center' | 'right';

type CellStyle = { 
    text: string; color: string; isBold: boolean; isUnderline: boolean; align: AlignType;
    rowSpan: number; colSpan: number; 
};
type TableRow = { cells: (CellStyle | null)[]; maxHeight?: number }; 
type TableData = { rows: TableRow[]; colWidths: number[]; totalWidth: number };
type TextSegment = {
  type: SegmentType;
  text?: string; color?: string; isBold?: boolean; isUnderline?: boolean; align?: AlignType; width?: number;
  src?: string; height?: number;
  tableData?: TableData;
};
type PageData = { lines: TextSegment[][]; };
type ProjectFile = {
    version: string;
    htmlContent: string;
    settings: { skew: number; lineOpacity: number; scanEffect: boolean; fontSize: number; paperType: PaperType; activeFontIndex: number; spacing: number; }
};
type ToastType = { id: number; message: string; type: 'info' | 'error' | 'success' };

const App = () => {
  // --- STATE ---
  const [pages, setPages] = useState<PageData[]>([]);
  const [skewFactor, setSkewFactor] = useState(1.5);
  const [spacingFactor, setSpacingFactor] = useState(0); 
  const [scanEffect, setScanEffect] = useState(false);
  const [lineOpacity, setLineOpacity] = useState(0.4); 
  const [baseFontSize, setBaseFontSize] = useState(18);
  const [paperType, setPaperType] = useState<PaperType>('lined');
  const [activeFontIndex, setActiveFontIndex] = useState(0); 
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null); 
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false); 
  const [isCaseMenuOpen, setIsCaseMenuOpen] = useState(false); 
  const [clearConfirmStage, setClearConfirmStage] = useState(0);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parseTimeoutRef = useRef<number | null>(null);

  const CURRENT_FONT_SIZE = baseFontSize * SCALE;
  const CURRENT_LINE_HEIGHT = CURRENT_FONT_SIZE * 1.5;
  const CURRENT_FONT = FONT_OPTIONS[activeFontIndex];

  // --- TOAST SYSTEM ---
  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
  };

  const removeToast = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- EDITOR ACTIONS ---
  const copyAIPrompt = () => {
      navigator.clipboard.writeText(AI_SYSTEM_PROMPT);
      showToast("AI Prompt copied! Paste it in ChatGPT/Gemini.", "success");
  };
  
  const pasteAIHtml = async () => {
      try {
          // Read text from clipboard
          const text = await navigator.clipboard.readText();
          
          // Simple check to see if it looks like HTML (contains tags)
          if (text.includes('<') && text.includes('>')) {
              if (editorRef.current) {
                  editorRef.current.focus();
                  // This command inserts the text AS HTML, not as strings
                  document.execCommand('insertHTML', false, text);
                  triggerParse();
                  showToast("AI Code pasted & rendered!", "success");
              }
          } else {
              showToast("Clipboard doesn't look like HTML code.", "error");
          }
      } catch (err) {
          showToast("Failed to read clipboard. Allow permissions.", "error");
      }
  };

  const clearEditor = () => {
      if (clearConfirmStage === 0) {
          setClearConfirmStage(1);
          setTimeout(() => setClearConfirmStage(0), 4000); // Reset if inactive
          return;
      }
      if (clearConfirmStage === 1) {
          setClearConfirmStage(2);
          setTimeout(() => setClearConfirmStage(0), 4000);
          return;
      }
      if (clearConfirmStage === 2) {
          if (editorRef.current) {
              editorRef.current.innerHTML = "<p><br></p>";
              triggerParse();
          }
          setClearConfirmStage(0);
          showToast("Canvas cleared.", "info");
      }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    triggerParse(); 
  };

  const applyAlignment = (align: 'left' | 'center' | 'right') => {
      const cell = getSelectedCell();
      if (cell) {
          cell.style.textAlign = align; 
      } else {
          document.execCommand(align === 'left' ? 'justifyLeft' : align === 'center' ? 'justifyCenter' : 'justifyRight');
      }
      triggerParse();
  };

  const changeCase = (type: 'upper' | 'lower' | 'title') => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      
      const range = sel.getRangeAt(0);
      const content = range.toString();
      let newText = content;

      if (type === 'upper') newText = content.toUpperCase();
      if (type === 'lower') newText = content.toLowerCase();
      if (type === 'title') {
          newText = content.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }

      document.execCommand('insertText', false, newText);
      setIsCaseMenuOpen(false);
      triggerParse();
  };

  // --- IMAGE MANAGEMENT ---
  const handleEditorClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
          if (selectedImage) selectedImage.style.outline = 'none';
          const img = target as HTMLImageElement;
          img.style.outline = '3px solid #3b82f6'; 
          setSelectedImage(img);
      } else {
          if (selectedImage) {
              selectedImage.style.outline = 'none';
              setSelectedImage(null);
          }
      }
      if (!target.closest('.font-selector')) setIsFontMenuOpen(false);
      if (!target.closest('.case-selector')) setIsCaseMenuOpen(false);
  };

  const deleteSelectedImage = () => {
      if (selectedImage) {
          selectedImage.remove();
          setSelectedImage(null);
      } else {
          document.execCommand('delete');
      }
      triggerParse();
  };

  const insertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const result = event.target?.result as string;
          const img = document.createElement('img');
          img.src = result;
          img.style.maxWidth = "300px"; img.style.display = "block"; img.style.margin = "10px 0";

          const sel = window.getSelection();
          let inserted = false;
          if (sel && sel.rangeCount > 0) {
              const range = sel.getRangeAt(0);
              if (editorRef.current?.contains(range.commonAncestorContainer)) {
                  range.deleteContents(); range.insertNode(img); range.collapse(false); 
                  inserted = true;
              }
          }
          if (!inserted && editorRef.current) {
              editorRef.current.appendChild(img);
              editorRef.current.appendChild(document.createElement('br'));
          }
          triggerParse();
      };
      reader.readAsDataURL(file);
      e.target.value = ''; 
  };

  // --- TABLE LOGIC ---
  const getSelectedCell = (): HTMLTableCellElement | null => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return null;
      let node = sel.anchorNode;
      while (node && node !== editorRef.current) {
          if (node.nodeName === 'TD' || node.nodeName === 'TH') return node as HTMLTableCellElement;
          node = node.parentNode;
      }
      return null;
  };

  const getTableGrid = (table: HTMLTableElement) => {
      const grid: { cell: HTMLTableCellElement, isOrigin: boolean }[][] = [];
      for (let r = 0; r < table.rows.length; r++) grid[r] = [];
      for (let r = 0; r < table.rows.length; r++) {
          const row = table.rows[r];
          let cIdx = 0;
          for (let c = 0; c < row.cells.length; c++) {
              while (grid[r][cIdx]) cIdx++;
              const cell = row.cells[c];
              const rs = cell.rowSpan || 1;
              const cs = cell.colSpan || 1;
              for (let i = 0; i < rs; i++) {
                  for (let j = 0; j < cs; j++) {
                      if (!grid[r + i]) grid[r + i] = [];
                      grid[r + i][cIdx + j] = { cell, isOrigin: i === 0 && j === 0 };
                  }
              }
              cIdx += cs;
          }
      }
      return grid;
  };

  const modifyTable = (action: string) => {
      const cell = getSelectedCell();
      if (!cell) { showToast("Click inside a table cell first!", "error"); return; }
      const row = cell.parentElement as HTMLTableRowElement;
      const table = row.parentElement?.parentElement as HTMLTableElement;
      if (!table) return;

      const grid = getTableGrid(table);
      let rIdx = -1, cIdx = -1;
      for(let r=0; r<grid.length; r++) {
          for(let c=0; c<grid[r].length; c++) {
              if (grid[r][c] && grid[r][c].cell === cell && grid[r][c].isOrigin) {
                  rIdx = r; cIdx = c; break;
              }
          }
          if (rIdx !== -1) break;
      }

      if (action === 'addRow') {
          const newRow = table.insertRow(row.rowIndex + 1);
          const colCount = grid[0].length;
          for(let i=0; i<colCount; i++) {
              const newCell = newRow.insertCell();
              newCell.style.border = "1px solid #000"; newCell.innerHTML = "New";
          }
      } 
      else if (action === 'delRow') { if (table.rows.length > 1) table.deleteRow(row.rowIndex); }
      else if (action === 'addCol') {
          for(let r=0; r<table.rows.length; r++) {
             const tr = table.rows[r];
             const newCell = tr.insertCell();
             newCell.style.border = "1px solid #000"; newCell.innerHTML = "New";
          }
      }
      else if (action === 'delCol') { showToast("Column deletion restricted in complex tables.", "error"); }
      else if (action === 'mergeRight') {
          const cellSpan = cell.colSpan || 1;
          const neighborX = cIdx + cellSpan;
          if (neighborX < grid[rIdx].length) {
              const neighbor = grid[rIdx][neighborX]?.cell;
              if (neighbor && neighbor !== cell) {
                  if ((cell.rowSpan || 1) === (neighbor.rowSpan || 1)) {
                      cell.colSpan = (cell.colSpan || 1) + (neighbor.colSpan || 1);
                      cell.innerHTML += " " + neighbor.innerHTML;
                      neighbor.remove();
                  } else showToast("Cannot merge cells of different heights.", "error");
              }
          }
      }
      else if (action === 'mergeDown') {
          const cellSpan = cell.rowSpan || 1;
          const neighborY = rIdx + cellSpan;
          if (neighborY < grid.length) {
              const neighbor = grid[neighborY][cIdx]?.cell;
              if (neighbor && neighbor !== cell) {
                  if ((cell.colSpan || 1) === (neighbor.colSpan || 1)) {
                      cell.rowSpan = (cell.rowSpan || 1) + (neighbor.rowSpan || 1);
                      cell.innerHTML += "<br/>" + neighbor.innerHTML;
                      neighbor.remove();
                  } else showToast("Cannot merge cells of different widths.", "error");
              }
          }
      }
      triggerParse();
  };

  const insertTable = () => {
      const tableHTML = `
        <table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #000;">
            <tbody>
                <tr><td style="border: 1px solid #000; padding: 5px;">Head 1</td><td style="border: 1px solid #000; padding: 5px;">Head 2</td></tr>
                <tr><td style="border: 1px solid #000; padding: 5px;">Cell 1</td><td style="border: 1px solid #000; padding: 5px;">Cell 2</td></tr>
            </tbody>
        </table><p><br></p>
      `;
      document.execCommand('insertHTML', false, tableHTML);
      triggerParse();
  };

  // --- PARSER ---
  const triggerParse = () => {
    if (!editorRef.current) return;
    setIsProcessing(true);
    if (parseTimeoutRef.current) window.clearTimeout(parseTimeoutRef.current);
    parseTimeoutRef.current = window.setTimeout(() => {
      parseContentToPages(editorRef.current!);
      setIsProcessing(false);
      parseTimeoutRef.current = null;
    }, 300);
  };

  useEffect(() => { return () => { if (parseTimeoutRef.current) window.clearTimeout(parseTimeoutRef.current); }; }, []);

  const parseContentToPages = (root: HTMLElement) => {
    const ctx = document.createElement('canvas').getContext('2d')!;
    const segments: TextSegment[] = [];
    
    const measureTextWithSpacing = (text: string, font: string, spacing: number) => {
        ctx.font = font;
        let width = 0;
        for (const char of text) width += ctx.measureText(char).width + (spacing * SCALE);
        return width;
    };

    const processTable = (tableEl: HTMLElement): TextSegment | null => {
        const rows = Array.from(tableEl.querySelectorAll('tr'));
        if (rows.length === 0) return null;

        const grid: (HTMLTableCellElement | null)[][] = [];
        const cellMap = new Map<HTMLTableCellElement, {r:number, c:number}>();
        for(let r=0; r<rows.length; r++) grid[r] = [];

        rows.forEach((tr, rIdx) => {
            const cells = Array.from(tr.querySelectorAll('td, th'));
            let cIdx = 0;
            cells.forEach((cell) => {
                while (grid[rIdx][cIdx]) cIdx++;
                const el = cell as HTMLTableCellElement;
                const rs = el.rowSpan || 1;
                const cs = el.colSpan || 1;
                for(let r = 0; r < rs; r++) {
                    for(let c = 0; c < cs; c++) {
                        if (grid[rIdx + r]) grid[rIdx + r][cIdx + c] = (r===0 && c===0) ? el : null; 
                    }
                }
                cellMap.set(el, {r: rIdx, c: cIdx}); 
                cIdx += cs;
            });
        });

        const maxCols = grid.reduce((max, row) => Math.max(max, row.length), 0);
        const colWidthsRaw = new Array(maxCols).fill(0);

        cellMap.forEach((pos, el) => {
             let text = el.innerText.trim();
             const isBold = el.tagName === 'TH' || el.style.fontWeight === 'bold';
             const fontStr = `${isBold ? 'bold' : 'normal'} ${CURRENT_FONT_SIZE}px ${CURRENT_FONT.family}`;
             const w = measureTextWithSpacing(text, fontStr, spacingFactor) + (20 * SCALE);
             if (w > colWidthsRaw[pos.c]) colWidthsRaw[pos.c] = w;
        });

        const MAX_TABLE_WIDTH = CANVAS_WIDTH - (MARGIN_X * 2);
        const totalMeasuredWidth = colWidthsRaw.reduce((a, b) => a + b, 0);
        const finalColWidths = [...colWidthsRaw];
        if (totalMeasuredWidth > MAX_TABLE_WIDTH) {
            const ratio = MAX_TABLE_WIDTH / totalMeasuredWidth;
            for(let i=0; i<finalColWidths.length; i++) finalColWidths[i] *= ratio;
        }

        const tableRows: TableRow[] = [];
        for (let r = 0; r < rows.length; r++) {
            const rowData: (CellStyle | null)[] = [];
            for (let c = 0; c < maxCols; c++) {
                const el = grid[r][c];
                if (el) {
                    const clone = el.cloneNode(true) as HTMLElement;
                    clone.querySelectorAll('li').forEach(li => { li.prepend("• "); li.append("\n"); });
                    let finalColor = el.style.color || el.getAttribute('color');
                    if (!finalColor) {
                        const sChild = el.querySelector('[color], [style*="color"]');
                        if (sChild) finalColor = sChild.getAttribute('color') || (sChild as HTMLElement).style.color;
                    }
                    const isBold = el.tagName === 'TH' || el.style.fontWeight === 'bold' || !!el.querySelector('b, strong');
                    const isUnderline = el.tagName === 'U' || el.style.textDecoration === 'underline' || !!el.querySelector('u');
                    
                    const rawAlign = (el.style.textAlign || el.getAttribute('align') || '').toLowerCase();
                    let align = 'left' as AlignType; 
                    if (rawAlign === 'center') align = 'center';
                    if (rawAlign === 'right') align = 'right';

                    rowData.push({
                        text: clone.innerText.trim(),
                        color: finalColor || '#000000',
                        isBold: !!isBold,
                        isUnderline: !!isUnderline,
                        align: align,
                        rowSpan: el.rowSpan || 1,
                        colSpan: el.colSpan || 1
                    });
                } else {
                    rowData.push(null);
                }
            }
            tableRows.push({ cells: rowData, maxHeight: CURRENT_LINE_HEIGHT * 1.2 });
        }
        return { type: 'table', tableData: { rows: tableRows, colWidths: finalColWidths, totalWidth: finalColWidths.reduce((a, b) => a + b, 0) } };
    };

    const traverse = (node: Node, style: { color: string, isBold: boolean, isUnderline: boolean }, listContext: { type: string, index: number } | null) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName;
        if (tagName === 'TABLE') {
            const tableSeg = processTable(el);
            if (tableSeg) segments.push(tableSeg);
            return; 
        }
        if (tagName === 'IMG') {
            const imgEl = el as HTMLImageElement;
            segments.push({ type: 'image', src: imgEl.src, width: imgEl.width * SCALE || 200 * SCALE, height: imgEl.height * SCALE || 150 * SCALE });
            return;
        }
        const isBlock = ['DIV', 'P', 'BR', 'LI', 'H1', 'H2', 'TR'].includes(tagName);
        let newListContext = listContext;
        if (tagName === 'UL') newListContext = { type: 'ul', index: 0 };
        if (tagName === 'OL') newListContext = { type: 'ol', index: 1 };
        let newColor = el.style.color || el.getAttribute('color') || style.color;
        const newBold = (tagName === 'B' || tagName === 'STRONG' || tagName === 'TH' || parseInt(el.style.fontWeight) > 600) || style.isBold;
        const newUnderline = (tagName === 'U' || el.style.textDecoration === 'underline') || style.isUnderline;
        if (tagName === 'LI' && listContext) {
            const bullet = listContext.type === 'ul' ? "• " : `${listContext.index}. `;
            segments.push({ type: 'text', text: bullet, color: newColor, isBold: true }); 
            if (listContext.type === 'ol') listContext.index++;
        }
        
        const rawAlign = (el.style.textAlign || el.getAttribute('align') || '').toLowerCase();
        let align = 'left' as AlignType;
        if (rawAlign === 'center') align = 'center';
        if (rawAlign === 'right') align = 'right';

        node.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent || "";
                if (text) segments.push({ type: 'text', text, color: newColor, isBold: newBold, isUnderline: newUnderline, align: align });
            } else {
                traverse(child, { color: newColor, isBold: newBold, isUnderline: newUnderline }, newListContext);
            }
        });
        if (isBlock && tagName !== 'BR') {
           const lastSeg = segments[segments.length - 1];
           if (lastSeg && lastSeg.text !== '\n') segments.push({ type: 'text', text: '\n' });
        }
        if (tagName === 'BR') segments.push({ type: 'text', text: '\n' });
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text) segments.push({ type: 'text', text, color: style.color, isBold: style.isBold, isUnderline: style.isUnderline });
      }
    };

    traverse(root, { color: '#000000', isBold: false, isUnderline: false }, null);

    const finalPages: PageData[] = [];
    let currentLines: TextSegment[][] = [];
    let currentLine: TextSegment[] = [];
    let currentY = MARGIN_Y;
    let currentX = MARGIN_X;
    
    const flushLine = (forceHeight?: number) => {
        currentLines.push(currentLine);
        currentLine = [];
        currentX = MARGIN_X;
        currentY += forceHeight ? forceHeight + 10 : CURRENT_LINE_HEIGHT; 
        if (currentY > CANVAS_HEIGHT - MARGIN_Y) {
            finalPages.push({ lines: currentLines });
            currentLines = [];
            currentY = MARGIN_Y;
        }
    };

    segments.forEach(seg => {
      if (seg.text === '\n') { flushLine(); return; }
      if (seg.type === 'table' || seg.type === 'image') {
          if (currentLine.length > 0) flushLine();
          const height = seg.type === 'table' ? (seg.tableData!.rows.length * (CURRENT_LINE_HEIGHT * 1.2)) + 20 : seg.height! + 20;
          if (currentY + height > CANVAS_HEIGHT - MARGIN_Y) {
             finalPages.push({ lines: currentLines });
             currentLines = [];
             currentY = MARGIN_Y;
          }
          currentLines.push([seg]); 
          currentY += height;
          return;
      }
      if (seg.type === 'text') {
        const words = seg.text!.split(/(\s+)/); 
        words.forEach(word => {
            if (word === "") return;
            ctx.font = `${seg.isBold ? 'bold' : 'normal'} ${CURRENT_FONT_SIZE}px ${CURRENT_FONT.family}`;
            const wordWidth = measureTextWithSpacing(word, ctx.font, spacingFactor);
            if (currentX + wordWidth > CANVAS_WIDTH - MARGIN_X) flushLine();
            currentLine.push({ ...seg, text: word, width: wordWidth });
            currentX += wordWidth; 
        });
      }
    });

    if (currentLine.length > 0) flushLine();
    if (currentLines.length > 0) finalPages.push({ lines: currentLines });
    setPages(finalPages);
  };

  // --- RENDERER ---
  useEffect(() => {
    pages.forEach((pageData, index) => {
      const canvas = canvasRefs.current[index];
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const mulberry32 = (seed: number) => {
        return () => {
          let t = seed += 0x6D2B79F5;
          t = Math.imul(t ^ (t >>> 15), t | 1);
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      };
      const rng = mulberry32(index + baseFontSize + Math.floor(skewFactor * 100));

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = scanEffect ? "#f4f4f4" : "#fffdf0";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (lineOpacity > 0) {
          ctx.strokeStyle = `rgba(100, 149, 237, ${lineOpacity})`; 
          ctx.lineWidth = 1 * SCALE;
          if (paperType === 'grid') {
            ctx.lineWidth = 0.5 * SCALE;
            const gridSize = 25 * SCALE;
            for (let x = MARGIN_X; x < CANVAS_WIDTH; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
            for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }
          } else if (paperType === 'lined') {
            for (let y = MARGIN_Y; y < CANVAS_HEIGHT; y += CURRENT_LINE_HEIGHT) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(CANVAS_WIDTH/2, y + (scanEffect ? 2 : 0), CANVAS_WIDTH, y, CANVAS_WIDTH, y); ctx.stroke();
            }
            ctx.strokeStyle = `rgba(255, 100, 100, ${lineOpacity})`; ctx.beginPath(); ctx.moveTo(MARGIN_X - (15*SCALE), 0); ctx.lineTo(MARGIN_X - (15*SCALE), CANVAS_HEIGHT); ctx.stroke();
          }
      }

      let cursorY = MARGIN_Y;
      pageData.lines.forEach(line => {
        let cursorX = MARGIN_X;
        let maxLineHeight = CURRENT_LINE_HEIGHT;

        let dominantAlign: AlignType = 'left';
        
        let lineTextWidth = 0;
        line.forEach(seg => {
            if (seg.type === 'text' && seg.width) {
                lineTextWidth += seg.width;
                if (seg.align) {
                    dominantAlign = seg.align as AlignType;
                }
            }
        });
        const availableWidth = CANVAS_WIDTH - (MARGIN_X * 2);
        
        if ((dominantAlign as string) === 'center') cursorX = MARGIN_X + (availableWidth - lineTextWidth) / 2;
        else if ((dominantAlign as string) === 'right') cursorX = MARGIN_X + (availableWidth - lineTextWidth);

        line.forEach(seg => {
           if (seg.type === 'image' && seg.src) {
               const img = new Image();
               img.crossOrigin = 'anonymous';
               const drawW = seg.width || (150 * SCALE);
               const drawH = seg.height || (100 * SCALE);
               img.onload = () => {
                 ctx.drawImage(img, cursorX, cursorY, drawW, drawH);
                 ctx.fillStyle = "rgba(255,255,255,0.6)";
                 ctx.fillRect(cursorX - 5, cursorY - 5, 30, 10);
                 ctx.fillRect(cursorX + drawW - 25, cursorY - 5, 30, 10);
               };
               img.src = seg.src;
               maxLineHeight = drawH + 20;
           } 
           else if (seg.type === 'table' && seg.tableData) {
               const { rows, colWidths } = seg.tableData;
               let tableY = cursorY;
               rows.forEach((row) => {
                   let tableX = MARGIN_X; 
                   const rowHeight = row.maxHeight || CURRENT_LINE_HEIGHT;
                   row.cells.forEach((cell, cIdx) => {
                       const cellWidth = colWidths[cIdx];
                       if (cell) {
                           let fullWidth = cellWidth;
                           if (cell.colSpan > 1) for(let k=1; k<cell.colSpan; k++) fullWidth += colWidths[cIdx+k];
                           let fullHeight = rowHeight;
                           if (cell.rowSpan > 1) fullHeight = rowHeight * cell.rowSpan;

                           ctx.beginPath(); ctx.strokeStyle = "#444"; ctx.lineWidth = 1.5;
                           ctx.moveTo(tableX, tableY); ctx.lineTo(tableX + fullWidth, tableY); 
                           ctx.moveTo(tableX, tableY + fullHeight); ctx.lineTo(tableX + fullWidth, tableY + fullHeight); 
                           ctx.moveTo(tableX, tableY); ctx.lineTo(tableX, tableY + fullHeight); 
                           ctx.moveTo(tableX + fullWidth, tableY); ctx.lineTo(tableX + fullWidth, tableY + fullHeight); 
                           ctx.stroke();

                           ctx.font = `${cell.isBold ? 'bold' : 'normal'} ${CURRENT_FONT_SIZE}px ${CURRENT_FONT.family}`;
                           ctx.fillStyle = cell.color;
                           
                           let textWidth = 0;
                           for (const char of cell.text) textWidth += ctx.measureText(char).width + (spacingFactor * SCALE);

                           let textX = tableX + (10*SCALE);
                           if (cell.align === 'center') textX = tableX + (fullWidth/2) - (textWidth/2);
                           if (cell.align === 'right') textX = tableX + fullWidth - textWidth - (10*SCALE);

                           const rY = (rng() - 0.5) * (skewFactor * SCALE);
                           
                           let currentX = textX;
                           for (const char of cell.text) {
                               const rRot = (rng() - 0.5) * (skewFactor * 0.15);
                               ctx.save(); 
                               ctx.translate(currentX, tableY + (rowHeight*0.6) + rY); 
                               ctx.rotate(rRot); 
                               ctx.fillText(char, 0, 0); 
                               ctx.restore();
                               currentX += ctx.measureText(char).width + (spacingFactor * SCALE);
                           }
                           
                           if (cell.isUnderline) {
                               ctx.beginPath(); ctx.strokeStyle = cell.color; ctx.lineWidth = 1.5;
                               ctx.moveTo(textX, tableY + (rowHeight*0.6) + 5);
                               ctx.lineTo(textX + textWidth, tableY + (rowHeight*0.6) + 5 + (rng()*2));
                               ctx.stroke();
                           }
                       }
                       tableX += cellWidth;
                   });
                   tableY += rowHeight;
               });
               maxLineHeight = (tableY - cursorY) + 20;
           }
           else if (seg.type === 'text' && seg.text) {
              ctx.font = `${seg.isBold ? 'bold' : 'normal'} ${CURRENT_FONT_SIZE}px ${CURRENT_FONT.family}`;
              ctx.fillStyle = seg.color || '#000';
              for (let i = 0; i < seg.text.length; i++) {
                const char = seg.text[i];
                const charWidth = ctx.measureText(char).width;
                const rY = (rng() - 0.5) * (skewFactor * SCALE);
                const rRot = (rng() - 0.5) * (skewFactor * 0.15);
                ctx.save(); ctx.translate(cursorX + charWidth/2, cursorY + rY); ctx.rotate(rRot); ctx.fillText(char, -charWidth/2, 0); ctx.restore();
                if (seg.isUnderline) {
                    ctx.beginPath(); ctx.strokeStyle = seg.color || '#000'; ctx.lineWidth = 1.5;
                    ctx.moveTo(cursorX, cursorY + 5); ctx.lineTo(cursorX + charWidth, cursorY + 5 + (rng()*2)); ctx.stroke();
                }
                cursorX += charWidth + (spacingFactor * SCALE); 
              }
           }
        });
        cursorY += maxLineHeight;
      });

      if (scanEffect) {
          const grad = ctx.createLinearGradient(0, 0, 100 * SCALE, 0);
          grad.addColorStop(0, "rgba(0,0,0,0.12)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0,0, 100 * SCALE, CANVAS_HEIGHT);
      }
    });
  }, [pages, skewFactor, lineOpacity, scanEffect, baseFontSize, paperType, activeFontIndex, spacingFactor]);

  const saveProject = () => {
      const project: ProjectFile = {
          version: '17.0',
          htmlContent: editorRef.current?.innerHTML || '',
          settings: { skew: skewFactor, lineOpacity, scanEffect, fontSize: baseFontSize, paperType, activeFontIndex, spacing: spacingFactor }
      };
      const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'assignment.lazy';
      a.click();
      showToast("Project saved!", "success");
  };

  const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const project = JSON.parse(event.target?.result as string) as ProjectFile;
              if (editorRef.current) editorRef.current.innerHTML = DOMPurify.sanitize(project.htmlContent);
              setSkewFactor(project.settings.skew); setLineOpacity(project.settings.lineOpacity);
              setScanEffect(project.settings.scanEffect); setBaseFontSize(project.settings.fontSize || 22);
              setPaperType(project.settings.paperType || 'lined'); setActiveFontIndex(project.settings.activeFontIndex || 0);
              setSpacingFactor(project.settings.spacing || 0);
              triggerParse();
              showToast("Project loaded successfully!", "success");
          } catch (err) { showToast("Invalid project file.", "error"); }
      };
      reader.readAsText(file);
  };

  const downloadPDF = () => {
    const doc = new jsPDF('p', 'pt', [A4_WIDTH, A4_HEIGHT]);
    pages.forEach((_, i) => {
      const canvas = canvasRefs.current[i];
      if (canvas) {
        if (i > 0) doc.addPage();
        doc.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT); 
      }
    });
    doc.save('assignment.pdf');
    showToast("PDF Downloaded!", "success");
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = 'https://upload.wikimedia.org/wikipedia/en/b/bd/Shin_chan_Source.png'; 
    document.head.appendChild(link);

    setTimeout(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = DEFAULT_CONTENT;
            triggerParse();
        }
    }, 100);
  }, []);

  const sliderStyle = `
    input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #3b82f6; border: 2px solid white; cursor: pointer; margin-top: -6px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
    input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: #cbd5e1; border-radius: 2px; }
  `;

  return (
    <div className={`min-h-screen flex flex-col items-center font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-neutral-100 text-slate-800'}`}>
      <style>{sliderStyle}</style>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Caveat:wght@400;700&family=Cedarville+Cursive&family=Dancing+Script:wght@400;700&family=Homemade+Apple&family=Indie+Flower&family=Just+Another+Hand&family=Shadows+Into+Light&display=swap');`}
      </style>

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
              <div key={toast.id} className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 animate-[slideUp_0.3s_ease-out] ${toast.type === 'error' ? 'bg-red-500' : toast.type === 'success' ? 'bg-green-500' : 'bg-slate-800'}`}>
                  {toast.type === 'success' && <span>✅</span>}
                  {toast.type === 'error' && <span>⚠️</span>}
                  {toast.message}
                  <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-50 hover:opacity-100"><X size={14}/></button>
              </div>
          ))}
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-4 transition-colors duration-300 bg-white/90 border-b border-slate-200 backdrop-blur-md flex justify-between items-center shadow-sm">
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center">
            {/* Title Section */}
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
               <span className="text-blue-600 text-2xl sm:text-3xl">😴</span> 
               <span>LazyScript</span>
               <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 hidden sm:inline">v17.6</span>
               {isProcessing && <span className="text-xs text-blue-500 animate-pulse ml-2">Processing...</span>}
            </h1>

            {/* Header Actions */}
            <div className="flex gap-2">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full transition-colors bg-slate-100 hover:bg-slate-200 text-slate-600">
                    {isDarkMode ? <Sun size={18} className="text-yellow-500"/> : <Moon size={18}/>}
                </button>
                
                <div className="w-px h-8 bg-slate-300 mx-1 opacity-50 hidden sm:block"></div>
                
                <div className="flex gap-1 sm:gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors bg-white hover:bg-slate-50 border border-slate-200">
                        <FileUp size={16}/> <span className="hidden sm:inline">Import</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={loadProject} accept=".lazy,.json,.azm" className="hidden" />
                    
                    <button onClick={saveProject} className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors bg-white hover:bg-slate-50 border border-slate-200">
                        <Save size={16}/> <span className="hidden sm:inline">Save</span>
                    </button>
                    
                    <button onClick={downloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-2 rounded-lg shadow-md text-sm font-medium flex gap-2 items-center transition-transform hover:scale-105">
                        <Download size={16}/> <span className="hidden sm:inline">PDF</span>
                    </button>
                </div>
            </div>
        </div>
      </header>


      {/* MOBILE PROCESSING INDICATOR */}
      {isProcessing && <div className="sm:hidden fixed top-[70px] left-0 w-full h-1 bg-blue-100"><div className="h-full bg-blue-500 animate-[loading_1s_infinite_ease-in-out]"></div></div>}

      
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 pb-8 pt-28 lg:h-screen h-auto overflow-y-auto lg:overflow-hidden">

        <div className={`w-full lg:w-1/2 flex flex-col rounded-xl shadow-xl border overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`p-4 border-b transition-colors shrink-0 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} flex flex-col gap-4`}>
             <div className="flex flex-wrap gap-3 justify-between items-center">
                 <div className="flex flex-wrap gap-2 items-center">
                    <div className={`flex rounded-md overflow-hidden border ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>
                        {['#000000', '#000f55', '#cc0000', '#1a5c20'].map(c => ( <button key={c} onClick={() => applyFormat('foreColor', c)} className="w-8 h-8 hover:opacity-80 transition-opacity" style={{backgroundColor: c}} title="Ink Color" /> ))}
                    </div>
                    <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
                    <button onClick={() => applyFormat('bold')} className={`p-2 rounded hover:bg-opacity-20 hover:bg-slate-500 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`} title="Bold"><Bold size={18}/></button>
                    <button onClick={() => applyFormat('underline')} className={`p-2 rounded hover:bg-opacity-20 hover:bg-slate-500 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`} title="Underline"><Underline size={18}/></button>
                    
                    {/* NEW: AI BUTTON */}
                    <button onClick={copyAIPrompt} className="p-2 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors ml-2 flex gap-1 items-center font-bold text-xs" title="Copy AI Prompt"><Bot size={16}/> AI Prompt</button>
                    
{/* NEW PASTE BUTTON */}
<button onClick={pasteAIHtml} className="p-2 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors ml-1 flex gap-1 items-center font-bold text-xs" title="Paste AI HTML Code"><FilePlus size={16}/> Paste AI</button>
                    {/* NEW: CLEAR BUTTON (3 Stage) */}
                    <button onClick={clearEditor} className={`p-2 rounded transition-all ml-1 flex gap-1 items-center font-bold text-xs ${clearConfirmStage === 0 ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : clearConfirmStage === 1 ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600 ring-2 ring-red-400'}`} title="Clear Canvas">
                        {clearConfirmStage === 0 ? <><Trash2 size={16}/></> : clearConfirmStage === 1 ? "Clear?" : "Really??"}
                    </button>
                 </div>
                 
                 <div className="flex gap-2 items-center mt-2 sm:mt-0">
                    <div className="relative case-selector">
                        <button onClick={() => setIsCaseMenuOpen(!isCaseMenuOpen)} className={`flex items-center gap-1 px-3 py-1.5 rounded border text-sm font-medium ${isDarkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                            <ArrowUpNarrowWide size={14}/> 
                            <span className="hidden sm:inline">Case</span>
                            <ChevronDown size={12} className="opacity-50"/>
                        </button>
                        {isCaseMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-32 bg-white border rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                <button onClick={() => changeCase('upper')} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-black flex items-center gap-2"><CaseUpper size={14}/> UPPER</button>
                                <button onClick={() => changeCase('lower')} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-black flex items-center gap-2"><CaseLower size={14}/> lower</button>
                                <button onClick={() => changeCase('title')} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-black flex items-center gap-2"><CaseSensitive size={14}/> Title</button>
                            </div>
                        )}
                    </div>

                    <div className="relative font-selector">
                        <button onClick={() => setIsFontMenuOpen(!isFontMenuOpen)} className={`flex items-center gap-1 px-3 py-1.5 rounded border text-sm font-medium ${isDarkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                            <FontIcon size={14}/> 
                            <span className="max-w-[80px] truncate">{CURRENT_FONT.label}</span>
                            <ChevronDown size={12} className="opacity-50"/>
                        </button>
                        {isFontMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white border rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                {FONT_OPTIONS.map((f, idx) => (
                                    <button key={f.id} onClick={() => { setActiveFontIndex(idx); setIsFontMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center justify-between group ${activeFontIndex === idx ? 'bg-blue-50 text-blue-600' : 'text-slate-700'}`}>
                                        <span style={{ fontFamily: f.family }}>{f.label}</span>
                                        {activeFontIndex === idx && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={deleteSelectedImage} className={`p-2 rounded border hover:bg-red-100 text-red-500 ${isDarkMode ? 'border-slate-600 hover:bg-red-900' : 'border-slate-200'} ${selectedImage ? 'ring-2 ring-red-400' : ''}`} title="Delete Selected Image"><ImageMinus size={18}/></button>
                    <label className={`p-2 rounded border cursor-pointer hover:bg-opacity-10 ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-white' : 'border-slate-200 text-slate-700 hover:bg-black'}`} title="Insert Image"><ImageIcon size={18}/><input type="file" onChange={insertImage} className="hidden"/></label>
                 </div>
             </div>

             <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100 flex-wrap">
                <span className="text-xs font-bold text-blue-800 px-2">Table:</span>
                <button onClick={insertTable} className="p-1.5 rounded hover:bg-blue-100 text-blue-800" title="New Table"><TableIcon size={16}/></button>
                <div className="w-px h-4 bg-blue-200"></div>
                <button onClick={() => modifyTable('addRow')} className="p-1.5 rounded hover:bg-blue-100 text-blue-800 flex gap-1 text-xs items-center" title="Add Row"><Rows size={14}/><Plus size={10}/></button>
                <button onClick={() => modifyTable('delRow')} className="p-1.5 rounded hover:bg-red-100 text-red-600 flex gap-1 text-xs items-center" title="Delete Row"><Rows size={14}/><Trash2 size={10}/></button>
                <div className="w-px h-4 bg-blue-200"></div>
                <button onClick={() => modifyTable('addCol')} className="p-1.5 rounded hover:bg-blue-100 text-blue-800 flex gap-1 text-xs items-center" title="Add Col"><Columns size={14}/><Plus size={10}/></button>
                <button onClick={() => modifyTable('delCol')} className="p-1.5 rounded hover:bg-red-100 text-red-600 flex gap-1 text-xs items-center" title="Delete Col"><Columns size={14}/><Trash2 size={10}/></button>
                <div className="w-px h-4 bg-blue-200"></div>
                <button onClick={() => modifyTable('mergeRight')} className="p-1.5 rounded hover:bg-purple-100 text-purple-800 flex gap-1 text-xs items-center" title="Merge Right"><ArrowRightFromLine size={14}/></button>
                <button onClick={() => modifyTable('mergeDown')} className="p-1.5 rounded hover:bg-purple-100 text-purple-800 flex gap-1 text-xs items-center" title="Merge Down"><ArrowDownFromLine size={14}/></button>
                <div className="w-px h-4 bg-blue-200"></div>
                <button onClick={() => applyAlignment('left')} className="p-1.5 rounded hover:bg-blue-100 text-blue-800" title="Align Left"><AlignLeft size={14}/></button>
                <button onClick={() => applyAlignment('center')} className="p-1.5 rounded hover:bg-blue-100 text-blue-800" title="Align Center"><AlignCenter size={14}/></button>
                <button onClick={() => applyAlignment('right')} className="p-1.5 rounded hover:bg-blue-100 text-blue-800" title="Align Right"><AlignRight size={14}/></button>
             </div>

             <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider opacity-70"><span>Messiness</span> <span>{skewFactor}</span></div>
                    <input type="range" min="0" max="3" step="0.5" value={skewFactor} onChange={(e) => setSkewFactor(parseFloat(e.target.value))} />
                    
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider opacity-70 mt-1"><span>Font Size</span> <span>{baseFontSize}px</span></div>
                    <input type="range" min="14" max="32" step="1" value={baseFontSize} onChange={(e) => setBaseFontSize(parseInt(e.target.value))} />
                </div>
                
                <div className="space-y-3">
                     <div className="flex justify-between text-xs font-semibold uppercase tracking-wider opacity-70"><span>Letter Spacing</span> <span>{spacingFactor}px</span></div>
                     <input type="range" min="-2" max="10" step="0.5" value={spacingFactor} onChange={(e) => setSpacingFactor(parseFloat(e.target.value))} />

                     <div className="flex justify-between text-xs font-semibold uppercase tracking-wider opacity-70 mt-1"><span>Line Opacity</span> <span>{Math.round(lineOpacity*100)}%</span></div>
                     <input type="range" min="0" max="1" step="0.1" value={lineOpacity} onChange={(e) => setLineOpacity(parseFloat(e.target.value))} />
                    
                    <div className="flex gap-2 pt-1">
                        <button onClick={() => setPaperType(prev => prev === 'lined' ? 'grid' : prev === 'grid' ? 'blank' : 'lined')} className={`flex-1 py-1.5 rounded text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${isDarkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-100'}`}>
                             {paperType === 'lined' ? <><AlignJustify size={14}/> Lined</> : paperType === 'grid' ? <><Grid3X3 size={14}/> Grid</> : <><Type size={14}/> Blank</>}
                        </button>
                        <button onClick={() => setScanEffect(!scanEffect)} className={`flex-1 py-1.5 rounded text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${scanEffect ? 'bg-blue-600 text-white border-blue-600' : (isDarkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-100')}`}>
                             <ScanLine size={14}/> {scanEffect ? 'Scanner ON' : 'Scanner OFF'}
                        </button>
                    </div>
                </div>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white text-slate-900 relative" onClick={handleEditorClick}>
             <div ref={editorRef} contentEditable onInput={triggerParse} className="min-h-full p-8 outline-none font-sans text-lg leading-relaxed"></div>
          </div>
        </div>
        
        <div className={`w-full lg:w-1/2 overflow-y-auto rounded-xl shadow-inner border p-8 flex flex-col items-center gap-8 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-200 border-slate-300'}`}>
           {pages.map((_, i) => (
             <div key={i} className="relative group shrink-0 max-w-full">
               <span className={`absolute -left-10 top-0 font-bold text-xs opacity-50 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Pg {i+1}</span>
               <canvas ref={el => { canvasRefs.current[i] = el; }} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="bg-white shadow-2xl rounded-sm transition-transform duration-300 hover:scale-[1.02] max-w-full h-auto" />
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default App;