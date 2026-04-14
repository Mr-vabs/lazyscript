// Ah, the user's issue is: "image is not positioned where it should be, instead its showing all the images (formulas) at the end of the page which we do not want."
// Wait, if it pushes all images to the end, it means `isInline` is false, and it runs into:
// `if (seg.type === 'table' || (seg.type === 'image' && !seg.isInline)) {`
// And `currentLines.push([seg]); currentY += height; return;`
// This puts it immediately after `flushLine()`. But wait, if it pushes it to `currentLines`, it appears immediately! Why would it appear "at the end of the page"?
// Oh! Because `img.onload = () => { ctx.drawImage(...) }`.
// `ctx.drawImage` is async! If we draw the image asynchronously after everything is done, the cursor positions have moved! Wait, no, `cursorY` is captured in the closure `const renderX = cursorX; const renderY = cursorY;`.
// But wait! If the image is not cached, `img.onload` happens asynchronously.
// Does it appear at the end of the page because of `img.onload` closure scoping, or because of how React renders it?
// The problem is `img.onload` executes asynchronously. By the time it executes, `cursorX` and `cursorY` have been mutated by the outer loops if they aren't properly scoped!
// Let's check the drawing loop!
