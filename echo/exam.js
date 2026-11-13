(() => {
  const bank=JSON.parse(document.querySelector('#bank').textContent);
  const panel=document.querySelector('#practice'), note=document.querySelector('#note'), voice=document.querySelector('#voice');
  const store='echo-exam-session-1', history='echo-exam-variants-1';
  const rows=[...bank.main,...bank.follow];
  const row=k=>rows.find(r=>r.key===k);
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const btn=(action,label,primary=false)=>'<button type="button" data-action="'+action+'" class="'+(primary?'primary':'')+'">'+label+'</button>';
  const read=k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
  const pick=(arr,except)=>{const options=arr.filter(x=>x!==except);return (options.length?options:arr)[Math.floor(Math.random()*(options.length||arr.length))];};
  let session=read(store), rec=null, ticket=0;
  if(!session || session.turns?.length!==7 || !session.turns.every(t=>row(t.key)?.options[t.variant])||!session.turns[session.index])session=null;
  const save=()=>write(store,session);
  function make(){
    const last=read(history)||{}, choices={};
    const turn=r=>{const variant=pick(r.options.map((_,i)=>i),last[r.key]);choices[r.key]=variant;return {key:r.key,variant};};
    const turns=bank.main.map(turn);
    const follow=bank.main.slice(1).map(r=>{
      const k=pick(bank.follow.filter(f=>f.parent===r.key).map(f=>f.key),last['next-'+r.key]);
      choices['next-'+r.key]=k;return turn(row(k));
    });
    for(let i=follow.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[follow[i],follow[j]]=[follow[j],follow[i]];}
    write(history,choices);session={start:Date.now(),index:0,turns:[...turns,...follow],end:false};save();
  }
  function silence(){ticket++;voice.pause();note.textContent='';}
  function say(){
    if(rec?.isRecording()){note.textContent='先完成当前回答，再重听。';return;}
    silence();const token=ticket,t=session.turns[session.index],q=row(t.key).options[t.variant];
    voice.src='echo/audio/'+q.id+'.mp3';
    voice.onended=()=>{if(token===ticket)note.textContent='轮到你了。说完后再进下一题。';};
    voice.play().catch(()=>{if(token===ticket)note.textContent='请点「重听考官」播放本题。';});
  }
  function dispose(){silence();if(rec){rec.destroy().catch(()=>{});rec=null;}}
  function lobby(){
    dispose();panel.innerHTML='<h2>自我介绍之后，接三组提问</h2><p>先介绍自己，再回答工作经历、项目动机、救生员岗位。随后考官从这三组各抽一道追问，共 7 题。</p><p>每题听完点「开始回答」。你决定什么时候答完和进入下一题。7 题等权，平均分达到 6 / 10 即通过。</p><div class="steps">'+(session?btn('resume',session.end?'查看上次成绩':'继续上次考试',true):'')+btn('start',session?'重新开考':'开始模拟口测',!session)+'</div>';
  }
  function render(){
    dispose();const t=session.turns[session.index],r=row(t.key),q=r.options[t.variant];
    panel.innerHTML='<small>第 '+(session.index+1)+' / 7 题 · '+(session.index<4?'主问题':'随机追问')+'</small><h2>听考官，自己答</h2>'+btn('repeat','重听考官')+'<details><summary>没听懂？看问句</summary><p lang="en">'+esc(q.en)+'</p><p>'+esc(q.zh)+'</p></details><div id="take"></div><div class="steps">'+btn('next',session.review||session.index===6?'完成并看成绩':'我答完了，下一题',true)+btn('skip','跳过本题')+'</div>';
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
  function report(){
    dispose();const work=session.turns.find(x=>x.key==='sales')?.heard||'';
    const marks=session.turns.map(t=>window.EchoExamRubric.mark(t.key,t,work));
    const grade=window.EchoExamRubric.total(marks), pending=marks.filter(x=>x.score===null).length;
    const result=grade===null?'总分待定 · '+pending+' 题需要重新识别':grade.toFixed(1)+' / 10 · '+(grade>=6?'通过':'未通过');
    panel.innerHTML='<h2>'+result+'</h2><p>脱稿练习估分，按识别文字核对每题要点。可以用自己的词回答。识别遗漏时可以重答该题。</p>'+
      session.turns.map((t,i)=>{const r=row(t.key),q=r.options[t.variant],m=marks[i];return '<article><h3>'+ (i+1)+' · '+esc(r.title)+'</h3><b>'+m.label+' · '+(m.score===null?'待评':m.score+' / 10')+'</b><p lang="en">'+esc(q.en)+'</p><p>'+esc(q.zh)+'</p>'+(t.heard?'<blockquote>'+esc(t.heard)+'</blockquote>':'')+'<p>'+esc(m.tip)+'</p>'+btn('retry-'+i,'重答这题')+'</article>';}).join('')+btn('start','换问法再考一次');
  }
  panel.onclick=e=>{
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
      if(session.review||session.index===6){session.end=true;session.review=false;save();report();}
      else{session.index++;save();render();say();}
    }
  };
  window.addEventListener('pagehide',silence);lobby();
})();
