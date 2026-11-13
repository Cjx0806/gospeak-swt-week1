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
  console.log('PASS Echo exam: seven spoken rounds, four varied prompts, free-response scoring, off-topic feedback and retake on iPad WebKit');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
