// Let's modify the TextSegment and the rendering logic to support individual text selection formatting.
// But wait, the user's issue was "if I select the text and try to change the messiness and font size for selected text only then its applying to whole text not just the selected text".
// This is because the sliders for Messiness and Font Size are global variables, not part of `document.execCommand` or text segments!
// The parser relies on `el.style.fontSize` or something?
// Actually, `traverse` doesn't read font-size or messiness right now.
console.log("Analyzing text segment font size capabilities...");
