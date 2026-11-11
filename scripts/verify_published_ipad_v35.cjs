const assert=require('node:assert/strict');
const {webkit,devices}=require('playwright');
(async()=>{
 const browser=await webkit.launch({headless:true});
 try {
  const page=await browser.newPage({...devices['iPad (gen 7)'],viewport:{width:820,height:1180}});
  const root=process.argv[2];page.setDefaultTimeout(20000);
  await page.goto(root+'?v=35&verify='+Date.now()+'#opening');
  await page.getByText('V35 · 快乐出村计划',{exact:true}).waitFor();
  assert.equal(await page.locator('select[data-real-topic]').inputValue(),'r35-home');
  await page.getByRole('button',{name:'同一题，换个问法'}).tap();
  await page.getByRole('button',{name:'没听懂？显示题目'}).tap();
  await page.getByText('Which city are you from?',{exact:true}).first().waitFor();
  await page.getByRole('button',{name:'开始学第1句 →'}).tap();
  assert.match(await page.locator('.sam25-en').innerText(),/Yulin, Guangxi/);
  assert(await page.getByRole('region',{name:'录这一句'}).isVisible());
  await page.getByRole('button',{name:'下一题 · 性格怎么样'}).tap();
  await page.getByRole('button',{name:'下一题 · 做过什么工作'}).tap();
  await page.getByRole('button',{name:'开始学第1句 →'}).tap();
  assert.match(await page.locator('.sam25-en').innerText(),/used phones/);
  await page.getByRole('button',{name:'这句会了，下一句 →'}).tap();
  assert.match(await page.locator('.sam25-en').innerText(),/driving school/);
  await page.goto(root+'opening-listening.html?v=35');
  await page.getByRole('button',{name:'▶ 开始循环听',exact:true}).tap();
  await page.waitForFunction(()=>{let a=document.querySelector('opening-listen audio');return a?.loop&&!a.paused&&a.currentTime>.2&&a.duration>240});
  const a=page.locator('opening-listen audio');const seconds=await a.evaluate(el=>el.duration);
  await a.evaluate(el=>{el.currentTime=el.duration-.6});
  await page.waitForFunction(()=>{let a=document.querySelector('opening-listen audio');return !a.paused&&a.currentTime<3});
  await page.getByRole('button',{name:'停止',exact:true}).tap();
  assert(await a.evaluate(el=>el.paused&&el.currentTime<.2));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  console.log('PASS iPad WebKit: bilingual question, sentence practice, recording control, ordered next questions, one-tap audio playback, automatic return to start, stop, width. Seconds:',seconds);
 } finally {await browser.close();}
})().catch(e=>{console.error(e.message.slice(0,1900));process.exitCode=1});
