const assert = require('node:assert/strict');
const { webkit, devices } = require('playwright');
(async () => {
  const browser = await webkit.launch();
  try {
    const page = await browser.newPage(devices['iPad (gen 7)']);
    const response = await page.goto(new URL('echo-review.html', process.argv[2]).href);
    assert.equal(response.status(), 200);
    await page.getByRole('heading', {name: '自我介绍之后，练这七组'}).waitFor();
    const row = page.locator('article').first();
    await row.getByText('看短答').tap();
    assert.ok(await row.getByText("I'm from Yulin, Guangxi.", {exact:true}).isVisible());
    await page.getByText('全部 45 题分别放在哪里？').tap();
    const numbers = (await page.locator('main > details').last().locator('p').allTextContents()).join(' ').match(/\d+/g).map(Number).sort((a,b) => a-b);
    assert.deepEqual(numbers, Array.from({length:45}, (_,i) => i+1));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('link', {name:'返回 SWT 顺序练题'}).tap();
    await page.getByRole('link', {name:'周日口测 · Echo 同题与追问'}).tap();
    await page.getByRole('heading', {name:'自我介绍之后，练这七组'}).waitFor();
    console.log('PASS iPad WebKit: direct link, touch, 45 questions, viewport and course round trip');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
