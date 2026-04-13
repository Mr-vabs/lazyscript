const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  const html = `<p>Here is a formula: <span class="math">c = \\pm\\sqrt{a^2 + b^2}</span></p>`;
  await page.evaluate(`document.querySelector('div[contenteditable]').innerHTML = '${html}'`);

  await page.click('div[contenteditable]');
  await page.keyboard.type(' ');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: '/home/jules/verification/screenshots/test_eval.png' });
  await browser.close();
})();
