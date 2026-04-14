const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Imports
const imports = `import katex from 'katex';
import html2canvas from 'html2canvas';\n`;
content = content.replace("import DOMPurify from 'dompurify';", "import DOMPurify from 'dompurify';\n" + imports);

// 2. Prompt update
const new_prompt = `const AI_SYSTEM_PROMPT = \`You are an assignment writer for a handwriting tool.
1. Output ONLY the raw HTML body content. Do not wrap in markdown \\\`\\\`\\\` blocks.
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

4. **Mathematical Formulas:**
   - Use KaTeX syntax wrapped inside a <span class="math"> tag.
   - Example: <span class="math">c = \\\\pm\\\\sqrt{a^2 + b^2}</span>
   - NEVER use $ or \\\\(\\\\) directly without the span tag.

5. **Tables:**
   - Use <table style="border-collapse: collapse; width: 100%; border: 1px solid black; margin: 10px 0;">
   - Cells: <td style="border: 1px solid black; padding: 5px; color: #000f55;">

6. Do NOT use markdown. formatting must be inline CSS.
Here is the question:
[PASTE QUESTION HERE]\`;`;

content = content.replace(/const AI_SYSTEM_PROMPT = `[\s\S]*?\[PASTE QUESTION HERE\]`;/, new_prompt);

// 3. triggerParse Update
const parseCode = `
  // --- PARSER ---
  const triggerParse = async () => {
    if (!editorRef.current) return;
    setIsProcessing(true);
    if (parseTimeoutRef.current) window.clearTimeout(parseTimeoutRef.current);

    // Process math elements before parsing
    const mathElements = Array.from(editorRef.current.querySelectorAll('.math'));
    for (const el of mathElements as HTMLElement[]) {
        if (el.classList.contains('processed-math')) continue;
        el.classList.add('processed-math');

        try {
            const formula = el.textContent || '';
            const html = katex.renderToString(formula, { throwOnError: false });
            el.innerHTML = html;

            // Render to canvas
            const canvas = await html2canvas(el as HTMLElement, { backgroundColor: null, scale: 2 });
            const dataUrl = canvas.toDataURL('image/png');

            // Replace with image
            const img = document.createElement('img');
            img.src = dataUrl;
            img.className = 'math-rendered';
            img.style.height = (canvas.height / 2) + 'px';
            img.style.display = 'inline-block';
            img.style.verticalAlign = 'middle';

            el.parentNode?.replaceChild(img, el);
        } catch (_e) {
            console.error("Math rendering error:", _e);
        }
    }

    parseTimeoutRef.current = window.setTimeout(() => {
      parseContentToPages(editorRef.current!);
      setIsProcessing(false);
      parseTimeoutRef.current = null;
    }, 300);
  };
`;

content = content.replace(/  \/\/ --- PARSER ---\n  const triggerParse = \(\) => {[\s\S]*?  \};\n/m, parseCode);

// 4. TypeScript fixes for measureText
content = content.replace(/\(ctx as any\)\.letterSpacing/g, "(ctx as CanvasRenderingContext2D & {letterSpacing: string}).letterSpacing");
content = content.replace(/'letterSpacing' in \(ctx as any\)/g, "'letterSpacing' in ctx");
content = content.replace(/for \(let i = 0; i < text\.length; i\+\+\) width \+= ctx\.measureText\(text\[i\]\)\.width \+ \(spacing \* SCALE\);/g, "for (let i = 0; i < text.length; i++) width += (ctx as CanvasRenderingContext2D).measureText(text[i]).width + (spacing * SCALE);");
content = content.replace(/for \(let i = 0; i < line\.length; i\+\+\) textWidth \+= ctx\.measureText\(line\[i\]\)\.width \+ \(spacingFactor \* SCALE\);/g, "for (let i = 0; i < line.length; i++) textWidth += (ctx as CanvasRenderingContext2D).measureText(line[i]).width + (spacingFactor * SCALE);");
content = content.replace(/textWidth \+= ctx\.measureText\(seg\.text\[i\]\)\.width \+ \(spacingFactor \* SCALE\);/g, "textWidth += (ctx as CanvasRenderingContext2D).measureText(seg.text[i]).width + (spacingFactor * SCALE);");
content = content.replace(/let newColor = el.style.color/g, "const newColor = el.style.color");
content = content.replace(/let wordWidth = ctx\.measureText\(word\)\.width/g, "const wordWidth = (ctx as CanvasRenderingContext2D).measureText(word).width");
content = content.replace(/const testWidth = measureTextWithSpacing\(testLine, \`normal \$\{CURRENT_FONT_SIZE\}px \$\{CURRENT_FONT\.family\}\`, spacingFactor\);/g, "const testWidth = measureTextWithSpacing(testLine, `normal ${CURRENT_FONT_SIZE}px ${CURRENT_FONT.family}`, spacingFactor);");
content = content.replace(/const w = measureTextWithSpacing\(text, \`normal \$\{CURRENT_FONT_SIZE\}px \$\{CURRENT_FONT\.family\}\`, spacingFactor\) \+ \(20 \* SCALE\);/g, "const w = measureTextWithSpacing(text, `normal ${CURRENT_FONT_SIZE}px ${CURRENT_FONT.family}`, spacingFactor) + (20 * SCALE);");
content = content.replace(/catch \(err\)/g, "catch (_err)");
content = content.replace(/const handleDrop = \(_e: DragEvent\) => \{/g, "const handleDrop = () => {");

fs.writeFileSync('src/App.tsx', content);

let index_html = fs.readFileSync('index.html', 'utf8');
if (!index_html.includes('katex.min.css')) {
  index_html = index_html.replace('</head>', '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css" />\n  </head>');
  fs.writeFileSync('index.html', index_html);
}
