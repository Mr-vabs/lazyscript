const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// For "huge gaps", we check `img.style.margin = '10px 0'` in `triggerParse`. It might cause issues. We should just draw it tightly.
content = content.replace("img.style.margin = '10px 0';", "img.style.margin = '0px';");

// "if I select the text and try to change the messiness and font size for selected text only then its applying to whole text not just the selected text"
// The user wants partial messiness/font size. We would need to apply `<span data-fontsize="XX" data-skew="X">...</span>`
// But this implies we need a way to wrap selected text in custom spans for those sliders!
// The sliders are UI inputs. Let's see where they are defined.

fs.writeFileSync('src/App.tsx', content);
