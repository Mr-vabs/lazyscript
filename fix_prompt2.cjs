const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const searchString = `4. **Mathematical Formulas:**
   - Use KaTeX syntax.
   - You MUST wrap EVERY formula block (inline or display) inside a <pre class="math"> tag.
   - **Pretext**: For better text visuals and layout, use plain text where possible, but for complex math (fractions, sums) use the <pre class="math"> tag.
   - Example: <pre class="math">c = \\\\pm\\\\sqrt{a^2 + b^2}</pre>
   - NEVER use $ or \\\\(\\\\) directly without the <pre class="math"> tag.`;

const newString = `4. **Mathematical Formulas:**
   - Use KaTeX syntax.
   - You MUST wrap EVERY formula block (inline or display) inside a <LateKatex> tag.
   - Example: <LateKatex>c = \\\\pm\\\\sqrt{a^2 + b^2}</LateKatex>
   - NEVER use $$ or \\\\[\\\\] or \\\\(\\\\) directly without the <LateKatex> tag.`;

content = content.replace(searchString, newString);
fs.writeFileSync('src/App.tsx', content);
