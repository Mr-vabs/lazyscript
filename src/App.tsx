import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import DOMPurify from 'dompurify';
import { 
    Download, Bold, Underline, ScanLine, FileUp, Save, Image as ImageIcon, 
    Table as TableIcon, Grid3X3, AlignJustify, Moon, Sun, Type, Plus, Trash2, 
    Columns, Rows, ArrowRightFromLine, ArrowDownFromLine, Delete, 
    AlignLeft, AlignCenter, AlignRight, Type as FontIcon, ChevronDown, 
    ArrowUpNarrowWide, CaseUpper, CaseLower, CaseSensitive, Bot, FilePlus, X,
    PenTool, Undo2, RefreshCw
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
<li>Click the <b>Robot Icon</b> to copy a prompt for AI.</li>
</ul>
<p><strong>Code Example:</strong></p>
<pre style="white-space: pre-wrap; border-left: 3px solid #000; padding-left: 10px; color: #000000;">
#include &lt;stdio.h&gt;

int main() {
   printf("Hello World");
   return 0;
}
</pre>
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
  isCodeLine?: boolean; // New flag for code pagination
};
type PageData = { lines: TextSegment[][]; };

// --- DRAWING TYPES ---
type Point = { x: number, y: number };
type Stroke = { points: Point[], color: string, width: number };
type DrawingData = { [pageIndex: number]: Stroke[] };

type ProjectFile = {
    version: string;
    htmlContent: string;
    drawings?: DrawingData;
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
  
  // --- DRAWING STATE ---
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawings, setDrawings] = useState<DrawingData>({});
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [inkColor, setInkColor] = useState('#000000'); 

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
      showToast("AI Prompt copied!", "success");
  };
  
  const pasteAIHtml = async () => {
      try {
          const text = await navigator.clipboard.readText();
          if (text.includes('<') && text.includes('>')) {
              if (editorRef.current) {
                  editorRef.current.focus();
                  document.execCommand('insertHTML', false, text);
                  triggerParse();
                  showToast("AI Code pasted!", "success");
              }
          } else {
              showToast("Clipboard doesn't look like HTML code.", "error");
          }
      } catch (err) {
          showToast("Failed to read clipboard.", "error");
      }
  };

  const clearEditor = () => {
      if (clearConfirmStage === 0) { setClearConfirmStage(1); setTimeout(() => setClearConfirmStage(0), 4000); return; }
      if (clearConfirmStage === 1) { setClearConfirmStage(2); setTimeout(() => setClearConfirmStage(0), 4000); return; }
      if (clearConfirmStage === 2) {
          if (editorRef.current) { editorRef.current.innerHTML = "<p><br></p>"; triggerParse(); }
          setDrawings({});
          setClearConfirmStage(0);
          showToast("New Page Created!", "info");
      }
  };

  const applyFormat = (command: string, value?: string) => {
    if (command === 'foreColor' && value) setInkColor(value);
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
      if (type === 'title') newText = content.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      document.execCommand('insertText', false, newText);
      setIsCaseMenuOpen(false);
      triggerParse();
  };

  const preventFocusLoss = (e: React.MouseEvent) => {
      e.preventDefault();
  };

  // --- DRAWING LOGIC ---
  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const renderSmoothStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length - 1; i++) {
          const p1 = stroke.points[i];
          const p2 = stroke.points[i + 1];
          const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
          ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
  };

  const startDrawing = (pageIndex: number, e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingMode) return;
      const canvas = canvasRefs.current[pageIndex];
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      const point = getCanvasCoordinates(e, canvas);
      setCurrentStroke({ points: [point], color: inkColor, width: 2 * SCALE });
  };

  const drawMove = (pageIndex: number, e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingMode || !currentStroke) return;
      const canvas = canvasRefs.current[pageIndex];
      if (!canvas) return;
      const point = getCanvasCoordinates(e, canvas);
      const newPoints = [...currentStroke.points, point];
      const updatedStroke = { ...currentStroke, points: newPoints };
      setCurrentStroke(updatedStroke);
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.beginPath();
          ctx.strokeStyle = updatedStroke.color;
          ctx.lineWidth = updatedStroke.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (newPoints.length > 2) {
              const last = newPoints[newPoints.length - 2];
              const secondLast = newPoints[newPoints.length - 3];
              const mid1 = { x: (secondLast.x + last.x)/2, y: (secondLast.y + last.y)/2 };
              const mid2 = { x: (last.x + point.x)/2, y: (last.y + point.y)/2 };
              ctx.moveTo(mid1.x, mid1.y);
              ctx.quadraticCurveTo(last.x, last.y, mid2.x, mid2.y);
              ctx.stroke();
          } else if (newPoints.length === 2) {
              ctx.moveTo(newPoints[0].x, newPoints[0].y);
              ctx.lineTo(newPoints[1].x, newPoints[1].y);
              ctx.stroke();
          }
      }
  };

  const stopDrawing = (pageIndex: number, e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingMode || !currentStroke) return;
      const canvas = canvasRefs.current[pageIndex];
      if(canvas) canvas.releasePointerCapture(e.pointerId);
      setDrawings(prev => {
          const pageDrawings = prev[pageIndex] || [];
          return { ...prev, [pageIndex]: [...pageDrawings, currentStroke] };
      });
      setCurrentStroke(null);
  };

  const undoDrawing = () => {
      const pageIndices = Object.keys(drawings).map(Number).sort((a,b) => b-a);
      if (pageIndices.length === 0) return;
      const lastPage = pageIndices[0];
      const pageDrawings = drawings[lastPage];
      if (pageDrawings && pageDrawings.length > 0) {
          const newDrawings = pageDrawings.slice(0, -1);
          setDrawings({ ...drawings, [lastPage]: newDrawings });
      }
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
          triggerParse(); 
      } else {
          document.execCommand('delete'); // Fallback to standard delete if no image selected
      }
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
          
          if (editorRef.current) {
              editorRef.current.focus();
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
                 const range = sel.getRangeAt(0);
                 range.deleteContents();
                 range.insertNode(img);
                 range.collapse(false);
              } else {
                 editorRef.current.appendChild(img);
              }
              editorRef.current.appendChild(document.createElement('br'));
              triggerParse();
          }
      };
      reader.readAsDataURL(file);
      e.target.value = ''; 
  };

  // --- TABLE LOGIC (MATRIX ALGORITHM) ---
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

  const modifyTable = (action: string) => {
      const cell = getSelectedCell();
      if (!cell) { showToast("Click inside a table cell first!", "error"); return; }
      const row = cell.parentElement as HTMLTableRowElement;
      const table = row.parentElement?.parentElement as HTMLTableElement;
      if (!table) return;

      if (action === 'addRow') {
          const newRow = table.insertRow(row.rowIndex + 1);
          // Insert matching number of cells based on current row
          for(let i=0; i<row.cells.length; i++) {
              const newCell = newRow.insertCell();
              newCell.style.border = "1px solid #000"; newCell.innerHTML = "New";
          }
      } 
      else if (action === 'delRow') { 
          table.deleteRow(row.rowIndex); 
          if (table.rows.length === 0) table.remove(); 
      }
      else if (action === 'addCol') {
          for(let r=0; r<table.rows.length; r++) {
             const tr = table.rows[r];
             const newCell = tr.insertCell();
             newCell.style.border = "1px solid #000"; newCell.innerHTML = "New";
          }
      }
      else if (action === 'delCol') {
          const cellIndex = cell.cellIndex;
          for (let r=0; r<table.rows.length; r++) {
              const tr = table.rows[r];
              if (tr.cells.length > cellIndex) tr.deleteCell(cellIndex);
          }
          if (table.rows.length > 0 && table.rows[0].cells.length === 0) table.remove();
      }
      else if (action === 'mergeRight') {
          const nextCell = cell.nextElementSibling as HTMLTableCellElement;
          if (nextCell) {
              cell.colSpan = (cell.colSpan || 1) + (nextCell.colSpan || 1);
              cell.innerHTML += " " + nextCell.innerHTML;
              nextCell.remove();
          }
      }
      else if (action === 'mergeDown') {
          const nextRow = row.nextElementSibling as HTMLTableRowElement;
          if (nextRow) {
              // Simple logic for visual merging; complex logic is handled by Parser
              const cellBelow = nextRow.cells[cell.cellIndex];
              if (cellBelow) {
                  cell.rowSpan = (cell.rowSpan || 1) + (cellBelow.rowSpan || 1);
                  cell.innerHTML += "<br/>" + cellBelow.innerHTML;
                  cellBelow.remove();
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
  
  // DRAG AND DROP FIX: Force re-parse on drop
  useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const observer = new MutationObserver(() => triggerParse());
      observer.observe(editor, { childList: true, subtree: true, characterData: true, attributes: true });
      
      const handleDrop = (e: DragEvent) => {
          setTimeout(triggerParse, 100); // Slight delay to allow DOM to settle
      };
      editor.addEventListener('drop', handleDrop);
      return () => {
          observer.disconnect();
          editor.removeEventListener('drop', handleDrop);
      };
  }, []);

  const parseContentToPages = (root: HTMLElement) => {
    const ctx = document.createElement('canvas').getContext('2d')!;
    const segments: TextSegment[] = [];
    
    const measureTextWithSpacing = (text: string, font: string, spacing: number) => {
        ctx.font = font;
        let width = 0;
        for (const char of text) width += ctx.measureText(char).width + (spacing * SCALE);
        return width;
    };

    // --- ROBUST TABLE PARSER (2D Grid) ---
    const processTable = (tableEl: HTMLElement): TextSegment | null => {
        const rows = Array.from(tableEl.querySelectorAll('tr'));
        if (rows.length === 0) return null;

        // 1. Calculate dimensions
        let maxCols = 0;
        rows.forEach(tr => {
            const cells = Array.from(tr.querySelectorAll('td, th'));
            let colsInRow = 0;
            cells.forEach(c => colsInRow += (c as HTMLTableCellElement).colSpan || 1);
            if (colsInRow > maxCols) maxCols = colsInRow;
        });

        // 2. Build Grid
        const grid: (HTMLTableCellElement | null)[][] = Array(rows.length).fill(null).map(() => Array(maxCols).fill(null));
        const cellOrigins = new Map<HTMLTableCellElement, {r: number, c: number}>();

        rows.forEach((tr, r) => {
            const cells = Array.from(tr.querySelectorAll('td, th'));
            let c = 0;
            cells.forEach((cell) => {
                const el = cell as HTMLTableCellElement;
                // Find next empty slot
                while (c < maxCols && grid[r][c] !== null) c++;
                if (c >= maxCols) return;

                const rs = el.rowSpan || 1;
                const cs = el.colSpan || 1;

                // Mark grid slots
                for (let i = 0; i < rs; i++) {
                    for (let j = 0; j < cs; j++) {
                        if (r + i < rows.length && c + j < maxCols) {
                            grid[r + i][c + j] = el;
                        }
                    }
                }
                cellOrigins.set(el, {r, c});
                c += cs;
            });
        });

        // 3. Calculate Column Widths
        const colWidthsRaw = new Array(maxCols).fill(0);
        cellOrigins.forEach((pos, el) => {
            const text = el.innerText.trim();
            const w = measureTextWithSpacing(text, `normal ${CURRENT_FONT_SIZE}px ${CURRENT_FONT.family}`, spacingFactor) + (20 * SCALE);
            // Distribute width across spanned columns
            const spanW = w / (el.colSpan || 1);
            for(let k=0; k < (el.colSpan || 1); k++) {
                if (spanW > colWidthsRaw[pos.c + k]) colWidthsRaw[pos.c + k] = spanW;
            }
        });

        const MAX_TABLE_WIDTH = CANVAS_WIDTH - (MARGIN_X * 2);
        const totalMeasuredWidth = colWidthsRaw.reduce((a, b) => a + b, 0);
        const finalColWidths = [...colWidthsRaw];
        if (totalMeasuredWidth > MAX_TABLE_WIDTH) {
            const ratio = MAX_TABLE_WIDTH / totalMeasuredWidth;
            for(let i=0; i<finalColWidths.length; i++) finalColWidths[i] *= ratio;
        }

        // 4. Generate Render Data
        const tableRows: TableRow[] = [];
        for (let r = 0; r < rows.length; r++) {
            const rowData: (CellStyle | null)[] = [];
            for (let c = 0; c < maxCols; c++) {
                const el = grid[r][c];
                // Only add data if this is the top-left origin of the cell
                const origin = el ? cellOrigins.get(el) : null;
                if (el && origin && origin.r === r && origin.c === c) {
                     rowData.push({
                        text: el.innerText.trim(),
                        color: '#000000',
                        isBold: el.tagName === 'TH',
                        isUnderline: false,
                        align: 'left',
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

    // --- CODE SPLITTER (Lines) ---
    const processCodeLines = (preEl: HTMLElement) => {
        const text = preEl.innerText;
        if (!text) return;
        const lines = text.split('\n');
        lines.forEach(line => {
             segments.push({ type: 'text', text: line, color: '#000000', isCodeLine: true });
             segments.push({ type: 'text', text: '\n', isCodeLine: true }); // Ensure break
        });
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
        if (tagName === 'PRE') {
            processCodeLines(el);
            return;
        }
        // Skip empty BRs often left by drag-drop
        if (tagName === 'BR' && !node.nextSibling && !node.previousSibling) return; 
        
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
    
    // --- ROBUST PAGINATION ---
    const checkPageBreak = (neededHeight: number) => {
        if (currentY + neededHeight > CANVAS_HEIGHT - MARGIN_Y) {
            finalPages.push({ lines: currentLines });
            currentLines = [];
            currentY = MARGIN_Y; // Reset cleanly to top margin
            return true;
        }
        return false;
    };

    const flushLine = () => {
        if (currentLine.length === 0) return;
        
        // Calculate Line Height
        let maxH = CURRENT_LINE_HEIGHT;
        currentLine.forEach(s => {
            if (s.type === 'image' && s.height) maxH = Math.max(maxH, s.height + 20);
            if (s.type === 'table' && s.tableData) maxH = Math.max(maxH, s.tableData.rows.length * CURRENT_LINE_HEIGHT * 1.5);
        });

        checkPageBreak(maxH); // Push page if needed

        currentLines.push(currentLine);
        currentLine = [];
        currentX = MARGIN_X;
        currentY += maxH; 
    };

    segments.forEach(seg => {
      if (seg.text === '\n') { flushLine(); return; }
      
      if (seg.type === 'table' || seg.type === 'image') {
          if (currentLine.length > 0) flushLine();
          
          let height = 0;
          if (seg.type === 'table') height = (seg.tableData!.rows.length * (CURRENT_LINE_HEIGHT * 1.2)) + 20;
          else if (seg.type === 'image') height = seg.height! + 20;

          checkPageBreak(height);
          
          currentLines.push([seg]); 
          currentY += height;
          return;
      }
      
      if (seg.type === 'text') {
        // If it's a code line, we might need to handle indentation visually in renderer
        // For text wrapping:
        const words = seg.text!.split(/(\s+)/); 
        words.forEach(word => {
            if (word === "") return;
            // Handle Code indentation preservation
            const effectiveFont = seg.isCodeLine 
                ? `normal ${CURRENT_FONT_SIZE}px monospace` 
                : `${seg.isBold ? 'bold' : 'normal'} ${CURRENT_FONT_SIZE}px ${CURRENT_FONT.family}`;
            
            ctx.font = effectiveFont;
            const wordWidth = measureTextWithSpacing(word, ctx.font, spacingFactor);
            
            if (currentX + wordWidth > CANVAS_WIDTH - MARGIN_X) {
                flushLine();
            }
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
        let isCodeBlockLine = false;

        let dominantAlign: AlignType = 'left';
        let lineTextWidth = 0;
        line.forEach(seg => {
            if (seg.isCodeLine) isCodeBlockLine = true;
            if (seg.type === 'text' && seg.width) {
                lineTextWidth += seg.width;
                if (seg.align) dominantAlign = seg.align as AlignType;
            }
        });
        
        // --- DRAW CODE LEFT BORDER ---
        if (isCodeBlockLine) {
            ctx.beginPath();
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 3 * SCALE;
            ctx.moveTo(MARGIN_X, cursorY);
            ctx.lineTo(MARGIN_X, cursorY + CURRENT_LINE_HEIGHT);
            ctx.stroke();
            cursorX += 15 * SCALE; // Indent for code
        }

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
                 // Selection handles
                 ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
                 ctx.fillRect(cursorX - 5, cursorY - 5, 10, 10);
                 ctx.fillRect(cursorX + drawW - 5, cursorY + drawH - 5, 10, 10);
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
                           ctx.rect(tableX, tableY, fullWidth, fullHeight);
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

      // --- RENDER DRAWINGS ---
      const pageDrawings = drawings[index] || [];
      if (pageDrawings.length > 0) {
          pageDrawings.forEach(stroke => renderSmoothStroke(ctx, stroke));
      }

      // --- SCANNER EFFECT (Preview) ---
      if (scanEffect) {
          const grad = ctx.createLinearGradient(0, 0, 100 * SCALE, 0);
          grad.addColorStop(0, "rgba(0,0,0,0.1)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0,0, 100 * SCALE, CANVAS_HEIGHT);
      }
    });
  }, [pages, skewFactor, lineOpacity, scanEffect, baseFontSize, paperType, activeFontIndex, spacingFactor, drawings]);

  const saveProject = () => {
      const project: ProjectFile = {
          version: '18.2',
          htmlContent: editorRef.current?.innerHTML || '',
          drawings: drawings,
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
              if (project.drawings) setDrawings(project.drawings);
              triggerParse();
              showToast("Loaded successfully!", "success");
          } catch (err) { showToast("Invalid project file.", "error"); }
      };
      reader.readAsText(file);
  };

  const processScanEffect = (originalCanvas: HTMLCanvasElement): string => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = originalCanvas.width;
      tempCanvas.height = originalCanvas.height;
      const tCtx = tempCanvas.getContext('2d')!;
      
      // Draw original
      tCtx.drawImage(originalCanvas, 0, 0);
      
      const imgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imgData.data;

      // Apply High Contrast & Noise
      for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          if (gray > 180) gray = 255; 
          else gray = gray * 0.8; 

          // Heavier Noise for PDF Export to prevent OCR
          const noise = (Math.random() - 0.5) * 40;
          gray += noise;

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
      }
      tCtx.putImageData(imgData, 0, 0);
      return tempCanvas.toDataURL('image/jpeg', 0.6); 
  };

  const downloadPDF = () => {
    const doc = new jsPDF('p', 'pt', [A4_WIDTH, A4_HEIGHT]);
    showToast("Generating PDF...", "info");
    
    setTimeout(() => {
        pages.forEach((_, i) => {
            const canvas = canvasRefs.current[i];
            if (canvas) {
                if (i > 0) doc.addPage();
                
                let imgData;
                if (scanEffect) {
                    imgData = processScanEffect(canvas);
                    // Slight Rotation to break OCR
                    doc.addImage(imgData, 'JPEG', -5, 0, A4_WIDTH + 10, A4_HEIGHT, undefined, 'FAST', 0.5); 
                } else {
                    imgData = canvas.toDataURL('image/jpeg', 0.8);
                    doc.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT); 
                }
            }
        });
        doc.save('assignment.pdf');
        showToast("PDF Downloaded!", "success");
    }, 100);
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

      <header className={`fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-4 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200'} border-b backdrop-blur-md flex justify-between items-center shadow-sm`}>
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center">
            {/* Title Section */}
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
               <span className="text-blue-600 text-2xl sm:text-3xl">😴</span> 
               <span>LazyScript</span>
               <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 hidden sm:inline">v18.2</span>
               {isProcessing && <span className="text-xs text-blue-500 animate-pulse ml-2 hidden sm:inline">Processing...</span>}
            </h1>

            {/* Header Actions */}
            <div className="flex gap-2">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full transition-colors bg-slate-100 hover:bg-slate-200 text-slate-600">
                    {isDarkMode ? <Sun size={18} className="text-yellow-500"/> : <Moon size={18}/>}
                </button>
                
                <div className="w-px h-8 bg-slate-300 mx-1 opacity-50 hidden sm:block"></div>
                
                <div className="flex gap-1 sm:gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-200'}`}>
                        <FileUp size={16}/> <span className="hidden sm:inline">Import</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={loadProject} accept=".lazy,.json,.azm" className="hidden" />
                    
                    <button onClick={saveProject} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-200'}`}>
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
                        {['#000000', '#000f55', '#cc0000', '#1a5c20'].map(c => ( <button key={c} onMouseDown={preventFocusLoss} onClick={() => applyFormat('foreColor', c)} className="w-8 h-8 hover:opacity-80 transition-opacity" style={{backgroundColor: c}} title="Ink Color" /> ))}
                    </div>
                    <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'} hidden sm:block`}></div>
                    <button onMouseDown={preventFocusLoss} onClick={() => applyFormat('bold')} className={`p-2 rounded hover:bg-opacity-20 hover:bg-slate-500 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`} title="Bold"><Bold size={18}/></button>
                    <button onMouseDown={preventFocusLoss} onClick={() => applyFormat('underline')} className={`p-2 rounded hover:bg-opacity-20 hover:bg-slate-500 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`} title="Underline"><Underline size={18}/></button>
                    
                    <button onMouseDown={preventFocusLoss} onClick={() => setIsDrawingMode(!isDrawingMode)} className={`p-2 rounded transition-colors ml-2 ${isDrawingMode ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`} title="Toggle Pen Mode"><PenTool size={16}/></button>
                    <button onMouseDown={preventFocusLoss} onClick={undoDrawing} className="p-2 rounded hover:bg-slate-100 text-slate-600" title="Undo Last Stroke"><Undo2 size={16}/></button>

                    <button onMouseDown={preventFocusLoss} onClick={copyAIPrompt} className="p-2 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors ml-2 flex gap-1 items-center font-bold text-xs" title="Copy AI Prompt"><Bot size={16}/> Prompt</button>
                    <button onMouseDown={preventFocusLoss} onClick={pasteAIHtml} className="p-2 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors ml-1 flex gap-1 items-center font-bold text-xs" title="Paste AI HTML Code"><FilePlus size={16}/> Paste AI</button>
                    
                    
                 </div>
                 
                 <div className="flex gap-2 items-center mt-2 sm:mt-0">
                    <div className="relative case-selector">
                        <button onMouseDown={preventFocusLoss} onClick={() => setIsCaseMenuOpen(!isCaseMenuOpen)} className={`flex items-center gap-1 px-3 py-1.5 rounded border text-sm font-medium ${isDarkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                            <ArrowUpNarrowWide size={14}/> 
                            <span className="hidden sm:inline">Case</span>
                            <ChevronDown size={12} className="opacity-50"/>
                        </button>
                        {isCaseMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-32 bg-white border rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                <button onMouseDown={preventFocusLoss} onClick={() => changeCase('upper')} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-black flex items-center gap-2"><CaseUpper size={14}/> UPPER</button>
                                <button onMouseDown={preventFocusLoss} onClick={() => changeCase('lower')} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-black flex items-center gap-2"><CaseLower size={14}/> lower</button>
                                <button onMouseDown={preventFocusLoss} onClick={() => changeCase('title')} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-black flex items-center gap-2"><CaseSensitive size={14}/> Title</button>
                            </div>
                        )}
                    </div>

                    <div className="relative font-selector">
                        <button onMouseDown={preventFocusLoss} onClick={() => setIsFontMenuOpen(!isFontMenuOpen)} className={`flex items-center gap-1 px-3 py-1.5 rounded border text-sm font-medium ${isDarkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                            <FontIcon size={14}/> 
                            <span className="max-w-[80px] truncate">{CURRENT_FONT.label}</span>
                            <ChevronDown size={12} className="opacity-50"/>
                        </button>
                        {isFontMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white border rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                {FONT_OPTIONS.map((f, idx) => (
                                    <button key={f.id} onMouseDown={preventFocusLoss} onClick={() => { setActiveFontIndex(idx); setIsFontMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center justify-between group ${activeFontIndex === idx ? 'bg-blue-50 text-blue-600' : 'text-slate-700'}`}>
                                        <span style={{ fontFamily: f.family }}>{f.label}</span>
                                        {activeFontIndex === idx && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onMouseDown={preventFocusLoss} onClick={deleteSelectedImage} className={`p-2 rounded border hover:bg-red-100 text-red-500 ${isDarkMode ? 'border-slate-600 hover:bg-red-900' : 'border-slate-200'} ${selectedImage ? 'ring-2 ring-red-400' : ''}`} title="Delete Selected Item"><Delete size={18}/></button>
                    <label className={`p-2 rounded border cursor-pointer hover:bg-opacity-10 ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-white' : 'border-slate-200 text-slate-700 hover:bg-black'}`} title="Insert Image"><ImageIcon size={18}/><input type="file" onChange={insertImage} className="hidden"/></label>
                    <button onMouseDown={preventFocusLoss} onClick={clearEditor} className={`p-2 rounded transition-all ml-1 flex gap-1 items-center font-bold text-xs ${clearConfirmStage === 0 ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : clearConfirmStage === 1 ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600 ring-2 ring-red-400'}`} title="Reset/New Page">
                        {clearConfirmStage === 0 ? <><RefreshCw size={16}/></> : clearConfirmStage === 1 ? "New Page?" : "Really??"}
                    </button>
                 </div>
             </div>

             <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100 flex-wrap">
                <span className="text-xs font-bold text-blue-800 px-2">Table:</span>
                <button onMouseDown={preventFocusLoss} onClick={insertTable} className="p-1.5 rounded hover:bg-blue-100 text-blue-800" title="New Table"><TableIcon size={16}/></button>
                <div className="w-px h-4 bg-blue-200"></div>
                <button onMouseDown={preventFocusLoss} onClick={() => modifyTable('addRow')} className="p-1.5 rounded hover:bg-blue-100 text-blue-800 flex gap-1 text-xs items-center" title="Add Row"><Rows size={14}/><Plus size={10}/></button>
                <button onMouseDown={preventFocusLoss} onClick={() => modifyTable('delRow')} className="p-1.5 rounded hover:bg-red-100 text-red-600 flex gap-1 text-xs items-center" title="Delete Row"><Rows size={14}/><Trash2 size={10}/></button>
                <div className="w-px h-4 bg-blue-200"></div>
                <button onMouseDown={preventFocusLoss} onClick={() => modifyTable('addCol')} className="p-1.5 rounded hover:bg-blue-100 text-blue-800 flex gap-1 text-xs items-center" title="Add Col"><Columns size={14}/><Plus size={10}/></button>
                <button onMouseDown={preventFocusLoss} onClick={() => modifyTable('delCol')} className="p-1.5 rounded hover:bg-red-100 text-red-600 flex gap-1 text-xs items-center" title="Delete Col"><Columns size={14}/><Trash2 size={10}/></button>
                <div className="w-px h-4 bg-blue-200"></div>
                <button onMouseDown={preventFocusLoss} onClick={() => modifyTable('mergeRight')} className="p-1.5 rounded hover:bg-purple-100 text-purple-800 flex gap-1 text-xs items-center" title="Merge Right"><ArrowRightFromLine size={14}/></button>
                <button onMouseDown={preventFocusLoss} onClick={() => modifyTable('mergeDown')} className="p-1.5 rounded hover:bg-purple-100 text-purple-800 flex gap-1 text-xs items-center" title="Merge Down"><ArrowDownFromLine size={14}/></button>
                <div className="w-px h-4 bg-blue-200"></div>
                <button onMouseDown={preventFocusLoss} onClick={() => applyAlignment('left')} className="p-1.5 rounded hover:bg-blue-100 text-blue-800" title="Align Left"><AlignLeft size={14}/></button>
                <button onMouseDown={preventFocusLoss} onClick={() => applyAlignment('center')} className="p-1.5 rounded hover:bg-blue-100 text-blue-800" title="Align Center"><AlignCenter size={14}/></button>
                <button onMouseDown={preventFocusLoss} onClick={() => applyAlignment('right')} className="p-1.5 rounded hover:bg-blue-100 text-blue-800" title="Align Right"><AlignRight size={14}/></button>
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
                        <button onMouseDown={preventFocusLoss} onClick={() => setPaperType(prev => prev === 'lined' ? 'grid' : prev === 'grid' ? 'blank' : 'lined')} className={`flex-1 py-1.5 rounded text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${isDarkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-100'}`}>
                             {paperType === 'lined' ? <><AlignJustify size={14}/> Lined</> : paperType === 'grid' ? <><Grid3X3 size={14}/> Grid</> : <><Type size={14}/> Blank</>}
                        </button>
                        <button onMouseDown={preventFocusLoss} onClick={() => setScanEffect(!scanEffect)} className={`flex-1 py-1.5 rounded text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${scanEffect ? 'bg-blue-600 text-white border-blue-600 shadow-inner' : (isDarkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-100')}`}>
                             <ScanLine size={14}/> {scanEffect ? 'Scanner ON' : 'Scanner'}
                        </button>
                    </div>
                </div>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white text-slate-900 relative" onClick={handleEditorClick}>
             <div ref={editorRef} contentEditable className="min-h-full p-8 outline-none font-sans text-lg leading-relaxed"></div>
          </div>
        </div>
        
        <div className={`w-full lg:w-1/2 overflow-y-auto rounded-xl shadow-inner border p-8 flex flex-col items-center gap-8 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-200 border-slate-300'}`}>
           {pages.map((_, i) => (
             <div key={i} className="relative group shrink-0 max-w-full">
               <span className={`absolute -left-10 top-0 font-bold text-xs opacity-50 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Pg {i+1}</span>
               <canvas 
                  ref={el => { canvasRefs.current[i] = el; }} 
                  width={CANVAS_WIDTH} 
                  height={CANVAS_HEIGHT} 
                  className={`bg-white shadow-2xl rounded-sm transition-transform duration-300 max-w-full h-auto ${isDrawingMode ? 'cursor-crosshair touch-none' : 'hover:scale-[1.02]'}`}
                  onPointerDown={(e) => startDrawing(i, e)}
                  onPointerMove={(e) => drawMove(i, e)}
                  onPointerUp={(e) => stopDrawing(i, e)}
                  onPointerLeave={(e) => stopDrawing(i, e)}
               />
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default App;