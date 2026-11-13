const assert = require('node:assert/strict');
const { webkit, devices } = require('playwright');
(async () => {
  const browser = await webkit.launch();
  try {
    const page = await browser.newPage(devices['iPad (gen 7)']);
    page.on('pageerror',error=>console.error('page error', error.message));
    page.on('requestfailed',request=>console.error('failed request',request.url(),request.failure()));
    const response = await page.goto(new URL('echo-review.html', process.argv[2]).href);
    assert.equal(response.status(), 200);
    await page.getByRole('heading', {name: '自我介绍之后，练这七组'}).waitFor();
    const topic=page.locator('#topic'), audio=page.locator('#demo');
    assert.deepEqual((await topic.locator('option').allTextContents()).slice(0,3),['工作经历','为什么参加 SWT','救生员岗位']);
    for(const id of ['r30-sales','r30-purpose','r30-hire']){
      await topic.selectOption(id);
      const btn=label=>page.getByRole('button',{name:label,exact:true});
      await btn('慢速循环').tap();
      await page.waitForFunction(()=>{const a=document.querySelector('#demo');return a.currentTime>0&&a.loop&&a.playbackRate<1});
      const first=await audio.getAttribute('src');
      await btn('显示问句与中文').tap();
      assert.ok(await page.locator('.transcript').isVisible());
      await btn('正常循环').tap();
      await page.waitForFunction(()=>{const a=document.querySelector('#demo');return a.currentTime>0&&a.loop&&a.playbackRate===1});
      await btn('换个问法听').tap();
      assert.notEqual(await audio.getAttribute('src'),first);
      await btn('停止').tap();
      assert.ok(await audio.evaluate(a=>a.paused&&!a.loop));
      await btn('开始逐句跟读').tap();
      await page.locator('.sam-recorder__start').waitFor({timeout:7000}).catch(async error=>{
        console.error('recording step',id,await page.locator('#practice').innerText(),await page.evaluate(()=>typeof window.SamRecorder));
        throw error;
      });
      const line=await page.locator('#practice .spoken').innerText();
      await btn('慢速循环').tap();
      await page.waitForFunction(()=>document.querySelector('#demo').currentTime>0);
      await btn('下一句').tap();
      assert.notEqual(await page.locator('#practice .spoken').innerText(),line);
      await btn('听随机追问').tap();
      assert.equal(await page.locator('#practice .spoken').count(),0);
      const asked=await audio.getAttribute('src');
      await btn('换一道追问').tap();
      assert.notEqual(await audio.getAttribute('src'),asked);
      await btn('看短答并逐句练').tap();
      await page.locator('#practice .spoken').waitFor();
    }
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
