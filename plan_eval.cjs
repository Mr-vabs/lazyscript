console.log("User reported: 'image is not positioned where it should be, instead its showing all the images (formulas) at the end of the page'.");
console.log("This happens because the parser (`traverse`) probably processes images out of order, or the DOM structure puts them at the end.");
console.log("Actually, `traverse` visits nodes recursively. If the images are pushed to the end, it's likely because `childNodes.forEach` might be skipping them or adding them after the text.");
console.log("Let's look at `traverse` for `IMG` tags!");
