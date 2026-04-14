const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const imports = `import katex from 'katex';
import html2canvas from 'html2canvas';\n`;
content = content.replace("import DOMPurify from 'dompurify';", "import DOMPurify from 'dompurify';\n" + imports);

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
   - Use KaTeX syntax.
   - You MUST wrap EVERY formula block (inline or display) inside a <pre class="math"> tag.
   - **Pretext**: For better text visuals and layout, use plain text where possible, but for complex math (fractions, sums) use the <pre class="math"> tag.
   - Example: <pre class="math">c = \\\\pm\\\\sqrt{a^2 + b^2}</pre>
   - NEVER use $$ or \\\\(\\\\) directly without the <pre class="math"> tag.

5. **Tables:**
   - Use <table style="border-collapse: collapse; width: 100%; border: 1px solid black; margin: 10px 0;">
   - Cells: <td style="border: 1px solid black; padding: 5px; color: #000f55;">

6. Do NOT use markdown. formatting must be inline CSS.
Here is the question:
[PASTE QUESTION HERE]\`;`;

content = content.replace(/const AI_SYSTEM_PROMPT = `[\s\S]*?\[PASTE QUESTION HERE\]`;/, new_prompt);

fs.writeFileSync('src/App.tsx', content);

let index_html = fs.readFileSync('index.html', 'utf8');
if (!index_html.includes('katex.min.css')) {
  index_html = index_html.replace('</head>', '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css" />\n  </head>');
  fs.writeFileSync('index.html', index_html);
}
