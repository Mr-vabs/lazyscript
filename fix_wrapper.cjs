const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const mathParseLoop = `
    // Process math elements before parsing
    const mathElements = Array.from(editorRef.current.querySelectorAll('pre.math, span.math, latekatex'));
    for (const el of mathElements as HTMLElement[]) {
        if (el.classList.contains('processed-math')) continue;
        el.classList.add('processed-math');

        // Ensure the element has a proper box model so html2canvas captures it fully without clipping.
        // Inline elements (like <latekatex> natively) will clip KaTeX's absolutely positioned nodes.
        el.style.display = 'inline-block';
        el.style.verticalAlign = 'middle';
        // Add a slight padding to accommodate deep descending fractions or tall integrals
        el.style.padding = '0 2px';

        try {
            const formula = el.textContent || '';
            const html = katex.renderToString(formula, { throwOnError: false, displayMode: el.tagName === 'PRE' || el.tagName === 'LATEKATEX' });
            el.innerHTML = html;

            // To ensure the math doesn't overlap text, we need to correctly handle its dimensions.
            // HTML2Canvas needs time to render the fonts. We can await a small timeout or use font loading.
            await new Promise(r => setTimeout(r, 100)); // wait for KaTeX font layout

            const canvas = await html2canvas(el as HTMLElement, {
                backgroundColor: scanEffect ? "#f4f4f4" : "#fffdf0", // paper background
                scale: 2,
                logging: false,
                useCORS: true
            });
            const dataUrl = canvas.toDataURL('image/png');
`;

content = content.replace(/    \/\/ Process math elements before parsing[\s\S]*?const dataUrl = canvas\.toDataURL\('image\/png'\);/, mathParseLoop);

fs.writeFileSync('src/App.tsx', content);
