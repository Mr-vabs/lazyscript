const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, timeout: 60000 });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  const html = `<p>Here is a formula: <span class="math">c = \\pm\\sqrt{a^2 + b^2}</span></p>`;
  await page.evaluate(`document.querySelector('div[contenteditable]').innerHTML = '${html}'`);

  // Directly call parse content to pages to trigger the logic.
  // Wait, triggerParse does the parsing
  await page.evaluate(`
    const editor = document.querySelector('div[contenteditable]');
    const mathSpan = editor.querySelector('.math');
    console.log("Math span text:", mathSpan.textContent);

    // We can also click to trigger
    editor.click();
  `);

  await page.keyboard.type(' ');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: '/home/jules/verification/screenshots/test_eval.png' });
  await browser.close();
  console.log("DONE");
})();
