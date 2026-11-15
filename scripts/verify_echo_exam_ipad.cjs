const {webkit,devices}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await webkit.launch();
 try{
  const page=await browser.newPage(devices['iPad (gen 7)']);
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'mediaDevices',{value:undefined,configurable:true});
   window.SpeechRecognition=class{
    start(){setTimeout(()=>{this.onstart?.();const result=[{transcript:window.testAnswer}];result.isFinal=true;this.onresult?.({results:[result]});},60);}
    stop(){setTimeout(()=>this.onend?.(),0);}
    abort(){this.stop();}
   };
  });
  const base=process.argv[2];await page.goto(new URL('index.html#exam',base).href);
  await page.getByRole('link',{name:/Echo 三主题模拟口测/}).tap();
  const btn=s=>page.getByRole('button',{name:s,exact:true});
  await btn('开始模拟口测').tap();
  const current=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('echo-exam-session-1')));
  const first=await current();
  assert.deepEqual(first.turns.slice(0,4).map(t=>t.key),['intro','sales','purpose','hire']);
  assert.equal(new Set(first.turns.map(t=>t.key)).size,7);
  const answers={intro:"My name is Felix. I'm a student.",sales:"I sold used phones.",purpose:"I want to experience American culture.",hire:"I sold used phones.",other:"I also helped a driving school find students.",prior:"No, I haven't.",gain:"I want to improve my English.",usa:"I want to see what daily life is like there.",duties:"I watch the swimmers.",outdoor:"I can work in the sun.",unsafe:"I would refuse and ask for a safer way."};
  for(const [i,t] of first.turns.entries()){
   await page.waitForFunction(()=>document.querySelector('#voice').currentTime>0);
   await page.evaluate(a=>window.testAnswer=a,answers[t.key]);await btn('开始回答').tap();
   await page.getByRole('button',{name:'完成回答',exact:true}).waitFor();
   await page.waitForTimeout(150);await btn('完成回答').tap();
   await page.waitForFunction(()=>document.querySelector('#note').textContent.includes('已收到回答'));
   await btn(i===6?'完成并看成绩':'我答完了，下一题').tap();
  }
  await page.getByRole('heading',{name:'8.6 / 10 · 通过'}).waitFor();
  const hire=page.locator('article').nth(3);assert.match(await hire.innerText(),/未找到本题要点/);
  await btn('换问法再考一次').tap();const second=await current();
  for(let i=0;i<4;i++)assert.notEqual(first.turns[i].variant,second.turns[i].variant);
  await page.goto(new URL('index.html#exam',base).href);
  await page.getByRole('link',{name:'Alex · 救生员复测考官',exact:true}).tap();
  await btn('开始模拟口测').tap();
  const poolSession=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pool-exam-session-1')));
  const poolAnswers={...answers,hire:answers.duties,duties:'I watch the swimmers.',priority:'Keeping swimmers safe.',
    say:'Please walk.',return:"I'll return to China to finish college.",running:'I tell the child to walk.',persists:'I ask another staff member for help.',
    rescue:'I signal for help and rescue the swimmer.',teammate:'Call 911.'};
  const visited=[];
  for(let i=0;i<10;i++){
    const turn=(await poolSession()).turns[i];
    assert.ok(poolAnswers[turn.key],turn.key);
    visited.push(turn.key);assert.equal(await page.locator('.reference').count(),0);
    await page.waitForFunction(()=>document.querySelector('#voice').currentTime>0);
    assert.equal(await page.locator('#practice details[open]').count(),0);
    if(i===0)assert.match(await page.locator('#practice details [lang=en]').textContent(),/Hi, thanks for joining today/);
    await page.evaluate(a=>window.testAnswer=a,poolAnswers[turn.key]);
    await btn('开始回答').tap();await btn('完成回答').waitFor();await page.waitForTimeout(150);await btn('完成回答').tap();
    await page.waitForFunction(()=>document.querySelector('#note').textContent.includes('已收到回答'));
    await btn(i===9?'完成并看成绩':'我答完了，下一题').tap();
  }
  assert.equal(visited[visited.indexOf('rescue')+1],'teammate');
  assert.equal(visited[visited.indexOf('running')+1],'say');
  assert.equal(await page.locator('article').count(),10);
  await page.getByRole('heading',{name:'9.0 / 10 · 通过'}).waitFor();
  assert.equal(await page.locator('.reference').count(),10);
  const card=page.locator('article').nth(visited.indexOf('teammate'));
  await card.getByText('看参考回答',{exact:true}).tap();
  assert.match(await card.locator('.reference').innerText(),/call 911/);
  await card.getByRole('button',{name:'慢速循环'}).first().tap();
  await page.waitForFunction(()=>{const a=document.querySelector('#voice');return a.loop&&a.playbackRate<1&&a.currentTime>0;});
  await card.getByRole('button',{name:'慢速循环'}).first().tap();
  assert.ok(await page.locator('#voice').evaluate(a=>a.paused&&!a.loop));
  await page.reload();await btn('查看上次成绩').tap();
  assert.equal(await page.locator('.reference').count(),10);
  await btn('重答这题').nth(visited.indexOf('hire')).tap();
  await page.evaluate(()=>window.testAnswer='I have a Chinese lifeguard certificate.');
  await btn('开始回答').tap();await btn('完成回答').waitFor();await page.waitForTimeout(150);await btn('完成回答').tap();
  await page.waitForFunction(()=>document.querySelector('#note').textContent.includes('已收到回答'));
  await btn('完成并看成绩').tap();
  await page.getByRole('heading',{name:'10.0 / 10 · 通过'}).waitFor();
  console.log('PASS Echo exam: seven spoken rounds, four varied prompts, free-response scoring, off-topic feedback and retake on iPad WebKit');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
