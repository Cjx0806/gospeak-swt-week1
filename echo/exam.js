(() => {
  const bank=JSON.parse(document.querySelector('#bank').textContent);
  const panel=document.querySelector('#practice'), note=document.querySelector('#note'), voice=document.querySelector('#voice');
  const poolExam=new URLSearchParams(location.search).get('examiner')==='pool';
  const store=poolExam?'pool-exam-session-1':'echo-exam-session-1';
  const history=poolExam?'pool-exam-variants-1':'echo-exam-variants-1';
  const count=poolExam?8:7;
  if(poolExam){
    document.title='Alex · 救生员复测考官';
    document.querySelector('h1').textContent=document.title;
  }
  const rows=poolExam?bank.pool:[...bank.main,...bank.follow];
  const row=k=>rows.find(r=>r.key===k);
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const btn=(action,label,primary=false)=>'<button type="button" data-action="'+action+'" class="'+(primary?'primary':'')+'">'+label+'</button>';
  const read=k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
  const pick=(arr,except)=>{const options=arr.filter(x=>x!==except);return (options.length?options:arr)[Math.floor(Math.random()*(options.length||arr.length))];};
  let session=read(store), rec=null, ticket=0;
  if(!session || session.turns?.length!==count || !session.turns.every(t=>row(t.key)?.options[t.variant])||!session.turns[session.index])session=null;
  const save=()=>write(store,session);
  function make(){
    const last=read(history)||{}, choices={};
    const turn=r=>{const variant=pick(r.options.map((_,i)=>i),last[r.key]);choices[r.key]=variant;return {key:r.key,variant};};
    if(poolExam){
      const keys=['intro','hire','duties','priority'];
      const first=pick(['rescue','running'],last.first);
      choices.first=first;
      for(const key of [first,first==='rescue'?'running':'rescue']){
        keys.push(key,key==='rescue'?'first':'say');
      }
      const turns=keys.map(key=>turn(row(key)));
      write(history,choices);session={start:Date.now(),index:0,turns,end:false};save();return;
    }
    const turns=bank.main.map(turn);
    const follow=bank.main.slice(1).map(r=>{
      const k=pick(bank.follow.filter(f=>f.parent===r.key).map(f=>f.key),last['next-'+r.key]);
      choices['next-'+r.key]=k;return turn(row(k));
    });
    for(let i=follow.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[follow[i],follow[j]]=[follow[j],follow[i]];}
    write(history,choices);session={start:Date.now(),index:0,turns:[...turns,...follow],end:false};save();
  }
  function silence(){
    ticket++;voice.pause();voice.loop=false;voice.playbackRate=1;note.textContent='';
    if(session?.end)panel.querySelectorAll('[aria-pressed="true"]').forEach(b=>b.setAttribute('aria-pressed','false'));
  }
  function say(){
    if(rec?.isRecording()){note.textContent='先完成当前回答，再重听。';return;}
    silence();const token=ticket,t=session.turns[session.index],q=row(t.key).options[t.variant];
    voice.src='echo/audio/'+q.id+'.mp3';
    voice.onended=()=>{if(token===ticket)note.textContent='轮到你了。说完后再进下一题。';};
    voice.play().catch(()=>{if(token===ticket)note.textContent='请点「重听考官」播放本题。';});
  }
  function dispose(){silence();if(rec){rec.destroy().catch(()=>{});rec=null;}}
  function lobby(){
    dispose();
    if(poolExam){
      panel.innerHTML='<h2>从自我介绍到泳池现场</h2><p>开场沿用豆包热身问句。后续根据你回忆的职责难点设计，由 Alex 用英语提问。两道现场题各有一次追问。</p><p>共 8 题。听完点「开始回答」，说完点「完成回答」。交卷后看逐题反馈和 10 分制估分，6 分通过。</p><div class="steps">'+(session?btn('resume',session.end?'查看上次成绩':'继续上次考试',true):'')+btn('start',session?'重新开考':'开始模拟口测',!session)+'</div>';
      return;
    }
    panel.innerHTML='<a href="./echo-exam.html?examiner=pool">换考官：Alex · 救生员复测</a><h2>自我介绍之后，接三组提问</h2><p>先介绍自己，再回答工作经历、项目动机、救生员岗位。随后考官从这三组各抽一道追问，共 7 题。</p><p>每题听完点「开始回答」。你决定什么时候答完和进入下一题。7 题等权，平均分达到 6 / 10 即通过。</p><div class="steps">'+(session?btn('resume',session.end?'查看上次成绩':'继续上次考试',true):'')+btn('start',session?'重新开考':'开始模拟口测',!session)+'</div>';
  }
  function render(){
    dispose();const t=session.turns[session.index],r=row(t.key),q=r.options[t.variant];
    panel.innerHTML='<small>第 '+(session.index+1)+' / '+count+' 题 · '+(poolExam?(session.index===0?'开场':'救生员口测'):(session.index<4?'主问题':'随机追问'))+'</small><h2>听考官，自己答</h2>'+btn('repeat','重听考官')+'<details><summary>没听懂？看问句</summary><p lang="en">'+esc(q.en)+'</p><p>'+esc(q.zh)+'</p></details><div id="take"></div><div class="steps">'+btn('next',session.review||session.index===count-1?'完成并看成绩':'我答完了，下一题',true)+btn('skip','跳过本题')+'</div>';
    rec=window.SamRecorder.mount(document.querySelector('#take'),{
      id:'sam-v25:echo-exam:'+session.start+':'+t.key,title:'脱稿回答',kind:'answer',assessmentMode:'free',expectedText:'',
      onStart:silence,onTake(take){
        if(session.turns[session.index]!==t || session.end)return;
        if(!take.complete&&!take.hasAudio&&!take.transcript && !take.duration)return;
        t.heard=String(take.transcript||'').slice(0,8000);
        t.complete=!!take.complete&&!!t.heard&&t.heard===take.transcript;
        t.attempt=true;delete t.skipped;save();
        note.textContent=t.complete?'已收到回答，可以进入下一题。':'已记录这次尝试，缺少完整转写。可以重答。';
      }});
    if(t.attempt)note.textContent='已保留本题上次回答，可以重答或继续。';
  }
  function reviewCard(t,i,mark){
    const r=row(t.key), q=r.options[t.variant];
    const listen=(clip,label,rate)=>'<button type="button" data-clip="'+clip.id+'" data-rate="'+rate+'" aria-pressed="false">'+label+'</button>';
    const examples=r.answers.map(a=>'<li><strong lang="en">'+esc(a.en)+'</strong><p>'+esc(a.zh)+'</p>'+
      '<div class="steps">'+listen(a,'慢速循环',0.76)+listen(a,'正常循环',1)+'</div></li>').join('');
    return '<article><h3>'+(i+1)+' · '+esc(r.title)+'</h3><b>'+mark.label+' · '+(mark.score===null?'待评':mark.score+' / 10')+'</b>'+
      '<p lang="en">'+esc(q.en)+'</p><p>'+esc(q.zh)+'</p>'+listen(q,'重听这道题',1)+
      '<p>我的回答（识别文字）</p><blockquote>'+esc(t.heard || (t.skipped?'本题已跳过':'还没有识别文字'))+'</blockquote><p>'+esc(mark.tip)+'</p>'+
      '<details class="reference"><summary>看参考回答</summary>'+(r.note?'<p>'+esc(r.note)+'</p>':'')+
      '<ol>'+examples+'</ol></details><div class="steps">'+btn('retry-'+i,'重答这题')+'</div></article>';
  }
  function report(){
    dispose();const work=session.turns.find(x=>x.key==='sales')?.heard||'';
    const marks=session.turns.map(t=>window.EchoExamRubric.mark(t.key,t,work));
    const grade=window.EchoExamRubric.total(marks), pending=marks.filter(x=>x.score===null).length;
    const result=grade===null?'总分待定 · '+pending+' 题需要重新识别':grade.toFixed(1)+' / 10 · '+(grade>=6?'通过':'未通过');
    panel.innerHTML='<h2>'+result+'</h2><p>脱稿练习估分，按识别文字核对每题要点。可以用自己的词回答。识别遗漏时可以重答该题。</p>'+
      session.turns.map((t,i)=>reviewCard(t,i,marks[i])).join('')+btn('start','换问法再考一次')+(poolExam?'<p><a href="echo-review.html?course=lifeguard5">回到救生员五题逐句练</a></p>':'');
  }
  panel.onclick=e=>{
    const clipButton=e.target.closest('[data-clip]');
    if(clipButton && session?.end){
      const active=clipButton.getAttribute('aria-pressed')==='true';
      silence();
      if(active)return;
      const token=ticket;
      voice.src='echo/audio/'+clipButton.dataset.clip+'.mp3';
      voice.playbackRate=Number(clipButton.dataset.rate);
      voice.loop=!!clipButton.closest('.reference');
      clipButton.setAttribute('aria-pressed','true');
      note.textContent=voice.loop?'正在循环，点同一按钮停止。':'正在播放问句。';
      voice.onended=()=>{if(token===ticket)silence();};
      voice.play().catch(()=>{if(token===ticket){silence();note.textContent='音频没有播放，请再点一次。';}});
      return;
    }
    const b=e.target.closest('[data-action]');if(!b)return;
    if(rec?.isRecording()){note.textContent='请先点「完成回答」，等本次回答保存后再继续。';return;}
    const a=b.dataset.action;
    if(a==='start'){make();render();say();return;}
    if(a==='resume'){if(session.end)report();else{render();say();}return;}
    if(a==='repeat'){say();return;}
    if(a.startsWith('retry-')){session.index=Number(a.slice(6));session.review=true;session.end=false;save();render();say();return;}
    if(a==='next'||a==='skip'){
      const t=session.turns[session.index];
      if(!t.attempt&&a==='next'){note.textContent='先开麦回答，或点「跳过本题」。';return;}
      if(a==='skip'&&!t.attempt)t.skipped=true;
      if(session.review||session.index===count-1){session.end=true;session.review=false;save();report();}
      else{
        if(poolExam && (t.key==='running'||t.key==='rescue')){
          const heard=t.complete?t.heard:'';
          const key=t.key==='running'?( /\b(walk|slow down|stop running)\b/i.test(heard)?'persists':'say'):
            (/\b(signal|alert|whistle|call|shout)\b/i.test(heard)?'teammate':'first');
          session.turns[session.index+1]={key,variant:0};
        }
        session.index++;save();render();say();
      }
    }
  };
  panel.addEventListener('toggle',e=>{
    if(!e.target.open && e.target.matches('.reference') && e.target.querySelector('[aria-pressed="true"]'))silence();
  },true);
  window.addEventListener('pagehide',silence);lobby();
})();
