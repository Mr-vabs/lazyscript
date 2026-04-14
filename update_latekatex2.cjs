const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Prompt substitution didn't work because of backslashes or something. Let's do it directly.

content = content.replace(/4\. \*\*Mathematical Formulas:\*\*[\s\S]*?NEVER use \$\$ or \\\\\\\\(\\\\\\\\) directly without the <pre class="math"> tag\./, `4. **Mathematical Formulas:**
   - Use KaTeX syntax.
   - You MUST wrap EVERY formula block (inline or display) inside a <LateKatex> tag.
   - Example: <LateKatex>c = \\\\pm\\\\sqrt{a^2 + b^2}</LateKatex>
   - NEVER use $$ or \\\\(\\\\) directly without the <LateKatex> tag.`);

content = content.replace("const mathElements = Array.from(editorRef.current.querySelectorAll('pre.math, span.math'));", "const mathElements = Array.from(editorRef.current.querySelectorAll('pre.math, span.math, latekatex'));");
content = content.replace(/displayMode: el\.tagName === 'PRE'/g, "displayMode: el.tagName === 'PRE' || el.tagName === 'LATEKATEX'");
content = content.replace(/DOMPurify\.sanitize\(project\.htmlContent\)/g, "DOMPurify.sanitize(project.htmlContent, { ADD_TAGS: ['latekatex'] })");

// Wait, the block handling in `triggerParse` sets `display = block` vs `inline-block`:
const blockCheck = `
            if (el.tagName === 'SPAN') {
                img.style.display = 'inline-block';
                img.style.verticalAlign = 'middle';
            } else {
                img.style.display = 'block';
                img.style.margin = '0';
            }
`;
const newBlockCheck = `
            if (el.tagName === 'SPAN' || el.tagName === 'LATEKATEX') {
                img.style.display = 'inline-block';
                img.style.verticalAlign = 'middle';
            } else {
                img.style.display = 'block';
                img.style.margin = '0';
            }
`;
content = content.replace(blockCheck, newBlockCheck);

fs.writeFileSync('src/App.tsx', content);
