const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/for \(const el of mathElements as HTMLElement\[\]\) \{/g, `
    // Add processed class early so we don't infinitely re-process. The parsing itself can trigger changes.
    for (const el of mathElements as HTMLElement[]) {
        if (el.classList.contains('processed-math')) continue;
        el.classList.add('processed-math');
`);
fs.writeFileSync('src/App.tsx', content);
