const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add latekatex to querySelectorAll
content = content.replace("const mathElements = Array.from(editorRef.current.querySelectorAll('pre.math, span.math'));", "const mathElements = Array.from(editorRef.current.querySelectorAll('pre.math, span.math, latekatex'));");

// 2. When rendering math, displayMode should be false for inline span, true for pre. For latekatex, we can check if it contains block math characters. Or just set it to displayMode: true.
content = content.replace(/displayMode: el\.tagName === 'PRE'/g, "displayMode: el.tagName === 'PRE' || el.tagName === 'LATEKATEX'");

// Wait, the user wants `latekatex` tag.
// If DOMPurify runs, it strips custom tags. `pasteAIHtml` does NOT use DOMPurify!
// It uses `document.execCommand('insertHTML', false, text);`.
// But when loading projects, `DOMPurify.sanitize(project.htmlContent)` IS used.
// We must add `ADD_TAGS: ['latekatex']` to DOMPurify.
content = content.replace(/DOMPurify\.sanitize\(project\.htmlContent\)/g, "DOMPurify.sanitize(project.htmlContent, { ADD_TAGS: ['latekatex'] })");

// AI_SYSTEM_PROMPT:
const old_prompt_math = `4. **Mathematical Formulas:**
   - Use KaTeX syntax.
   - You MUST wrap EVERY formula block (inline or display) inside a <pre class="math"> tag.
   - **Pretext**: For better text visuals and layout, use plain text where possible, but for complex math (fractions, sums) use the <pre class="math"> tag.
   - Example: <pre class="math">c = \\\\\\\\pm\\\\\\\\sqrt{a^2 + b^2}</pre>
   - NEVER use $$ or \\\\\\\\(\\\\\\\\) directly without the <pre class="math"> tag.`;

const new_prompt_math = `4. **Mathematical Formulas:**
   - Use KaTeX syntax.
   - You MUST wrap EVERY formula block (inline or display) inside a <LateKatex> tag.
   - Example: <LateKatex>c = \\\\pm\\\\sqrt{a^2 + b^2}</LateKatex>
   - NEVER use $$ or \\\\(\\\\) directly without the <LateKatex> tag.`;

content = content.replace(/4\. \*\*Mathematical Formulas:\*\*[\s\S]*?- NEVER use \$\$ or \\\\\\\\(\\\\\\\\) directly without the <pre class="math"> tag\./g, new_prompt_math);

fs.writeFileSync('src/App.tsx', content);
