const fs = require('fs');

// We have `pasteAIHtml` doing: `document.execCommand('insertHTML', false, text);`
// But what if the user literally pastes `% Q1 \n\n \[ \bar{X} = \dots \]`?
// The user asked "can you add <LateKatex> name type tag to handle the latex code for forumla? and include it into the prompt and paste Ai so that they handle it correctly as well".
// This implies they might also just paste LaTeX code directly into "Paste AI" and want it wrapped if they forgot the tag?
// No, they said "include it into the prompt and paste Ai so that they handle it correctly".
// Wait, when you copy from ChatGPT it might contain newlines and brackets like `\[ ... \]`.
// We can preprocess the `text` in `pasteAIHtml` to automatically convert `\[ ... \]` and `\( ... \)` into `<latekatex> ... </latekatex>`. That's a great UX improvement!

let content = fs.readFileSync('src/App.tsx', 'utf8');

const pasteHandling = `
  const pasteAIHtml = async () => {
      try {
          let text = await navigator.clipboard.readText();

          // Auto-convert standard LaTeX delimiters to <latekatex> tags if they exist
          text = text.replace(/\\\\\\[([\\s\\S]*?)\\\\\\]/g, '<latekatex>$1</latekatex>');
          text = text.replace(/\\\\\\(([\\s\\S]*?)\\\\\\)/g, '<latekatex>$1</latekatex>');

          if (text.includes('<') && text.includes('>')) {
`;
content = content.replace(/const pasteAIHtml = async \(\) => \{\n      try \{\n          const text = await navigator\.clipboard\.readText\(\);\n          if \(text\.includes\('<'\) && text\.includes\('>'\)\) \{/, pasteHandling);

fs.writeFileSync('src/App.tsx', content);
