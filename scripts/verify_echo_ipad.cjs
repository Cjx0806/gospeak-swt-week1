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
    await page.getByRole('heading', {name: 'SWT 口测听说练习'}).waitFor();
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
      await page.locator('.swt-score').waitFor();
      const supported = await page.evaluate(()=>!!(window.SpeechRecognition||window.webkitSpeechRecognition||(navigator.mediaDevices?.getUserMedia&&window.MediaRecorder)));
      if(supported) await page.locator('.sam-recorder__start').waitFor();
      else await page.getByText('当前浏览器无法识别英文。',{exact:true}).waitFor();
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
    for(const [key,firstAnswer] of [['pool-rescue',"I'd signal for help right away."],['pool-running',"I'd tell the child to walk."]]){
      await page.goto(new URL('echo-review.html#'+key,process.argv[2]).href);
      await page.waitForFunction(k=>document.querySelector('#topic')?.value===k,key);
      const button=name=>page.getByRole('button',{name,exact:true});
      await button('慢速循环').tap();
      await page.waitForFunction(()=>{const a=document.querySelector('#demo');return a.loop&&a.playbackRate<1&&a.currentTime>0;});
      await button('开始逐句跟读').tap();
      assert.equal(await page.locator('#practice .spoken').innerText(),firstAnswer);
      await page.locator('.swt-score').waitFor();
      await button('下一句').tap();
      await button('正常循环').tap();
      await page.waitForFunction(()=>{const a=document.querySelector('#demo');return a.loop&&a.playbackRate===1&&a.currentTime>0;});
      await page.getByRole('button',{name:'3 · 随机追问'}).tap();
      const prompt=await audio.getAttribute('src');
      await button('换一道追问').tap();
      assert.notEqual(await audio.getAttribute('src'),prompt);
      await button('看短答并逐句练').tap();
      await page.locator('.swt-score').waitFor();
    }
    await page.getByText('全部 45 题分别放在哪里？').tap();
    const numbers = (await page.locator('main > details').last().locator('p').allTextContents()).join(' ').match(/\d+/g).map(Number).sort((a,b) => a-b);
    assert.deepEqual(numbers, Array.from({length:45}, (_,i) => i+1));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('link', {name:'返回 SWT 顺序练题'}).tap();
    await page.getByRole('link', {name:'周日口测 · Echo 同题与追问'}).tap();
    await page.getByRole('heading', {name:'SWT 口测听说练习'}).waitFor();
    // Exercise the real Echo score panel with a controlled recognition result.
    // Linux WebKit does not have Apple's microphone or online speech service.
    await page.addInitScript(()=>{
      Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:undefined});
      window.SpeechRecognition=class {
        start(){setTimeout(()=>{
          this.onstart?.();
          const result=[{transcript:'I bought and sold used phones.'}];result.isFinal=true;
          this.onresult?.({results:[result]});
        },80);}
        stop(){setTimeout(()=>this.onend?.(),0);}
        abort(){this.stop();}
      };
    });
    await page.reload();
    await page.getByRole('button',{name:'开始逐句跟读'}).tap();
    await page.getByRole('button',{name:'开始跟读评分',exact:true}).tap();
    await page.waitForFunction(()=>document.querySelector('.swt-score strong')?.textContent.startsWith('100'));
    await page.goto(new URL('echo-review.html?course=lifeguard5',process.argv[2]).href);
    await page.getByRole('heading',{name:'救生员五题 · 复测主线'}).waitFor();
    assert.equal(await topic.locator('option').count(),5);
    const b=name=>page.getByRole('button',{name,exact:true});
    await b('轮流听全部问法').tap();
    await page.waitForFunction(()=>document.querySelector('#practice small').textContent.includes('2 /'),{},{timeout:15000});
    await b('停止').tap();
    await topic.selectOption('pool-priority');
    await b('开始逐句跟读').tap();
    assert.equal(await page.locator('#practice .spoken').innerText(),'Keeping swimmers safe.');
    await page.locator('.swt-score').waitFor();
    await b('下一句').tap();
    await b('下一题 · 先听考官').tap();
    assert.equal(await topic.inputValue(),'pool-rescue');
    await b('3 · 五题连续追问').tap();
    const heard=new Set();
    for(let i=0;i<5;i++){
      assert.ok(await topic.isHidden());
      assert.equal(await page.locator('#practice .spoken').count(),0);
      const src=await audio.getAttribute('src');
      const key=await page.evaluate(src=>JSON.parse(document.querySelector('#retest-lessons').textContent)
        .find(l=>l.questions.some(q=>src.endsWith(q.id+'.mp3')))?.key,src);
      assert.ok(key && !heard.has(key));heard.add(key);
      await b(i===4?'结束并核对五题':'我答完了，听下一题').tap();
    }
    await page.getByRole('heading',{name:'五题已结束'}).waitFor();
    assert.equal(await page.locator('#practice details').count(),5);
    await b('加练：你会对孩子说什么？').tap();
    assert.equal(await page.locator('#practice .spoken').innerText(),'Please walk.');
    console.log('PASS iPad WebKit: direct link, touch, 45 questions, viewport and course round trip');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
