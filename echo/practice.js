(() => {
  'use strict';
  const retest = new URLSearchParams(location.search).get('course') === 'lifeguard5';
  const lessons = JSON.parse(document.querySelector(retest?'#retest-lessons':'#lessons').textContent);
  const select = document.querySelector('#topic'), stages = document.querySelector('#stages');
  const panel = document.querySelector('#practice'), demo = document.querySelector('#demo');
  const status = document.querySelector('#audio-status');
  const labels = ['听考官问法','逐句跟读',retest?'五题连续追问':'随机追问'];
  let deck = [], turn = 0;
  if(retest){
    document.title='救生员五题 · SWT 复测';
    document.querySelector('h1').textContent='救生员五题 · 复测主线';
    select.replaceChildren(...lessons.map((l,i)=>new Option((i+1)+' · '+l.title,l.key)));
    document.querySelector('main > details').hidden=true;
  }
  function startDeck(){
    deck=lessons.map(l=>({question:l.questions[Math.floor(Math.random()*l.questions.length)],lesson:l}));
    for(let i=deck.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [deck[i],deck[j]]=[deck[j],deck[i]];
    }
    turn=0;
  }
  let lesson = lessons.find(row=>row.key===location.hash.slice(1)) || lessons[0], stage = 0, index = 0, visible = false;
  let follow = null, remaining = [], model = false, playerTurn = 0, recorder = null;
  const esc = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button = (action,label,style='') => '<button type="button" data-action="'+action+'" class="'+style+'">'+label+'</button>';
  const controls = () => '<div class="play-row">'+button('slow','慢速循环')+button('normal','正常循环')+button('stop','停止')+'</div>';
  const words = line => '<p class="spoken" lang="en">'+esc(line.en)+'</p><p>'+esc(line.zh)+'</p>';
  function stop() {
    playerTurn++; demo.pause(); demo.loop=false; status.textContent='';
    panel.querySelectorAll('[data-action="normal"],[data-action="slow"]').forEach(b=>b.setAttribute('aria-pressed','false'));
  }
  function play(line,rate,repeat) {
    if (!line || recording()) return;
    stop();
    const token = playerTurn;
    demo.src='echo/audio/'+line.id+'.mp3';
    demo.loop=repeat; demo.defaultPlaybackRate=rate; demo.playbackRate=rate;
    demo.preservesPitch=true;
    if(repeat)panel.querySelector('[data-action="'+(rate===1?'normal':'slow')+'"]')?.setAttribute('aria-pressed','true');
    status.textContent=repeat?(rate===1?'正常速度循环中':'慢速循环中'):'考官正在提问…';
    demo.onended=()=>{if(token===playerTurn)status.textContent='轮到你回答了。';};
    demo.play().catch(()=>{if(token===playerTurn){stop();status.textContent='音频未能播放，请再点一次。';}});
  }
  function cycleQuestions(){
    if(recording())return;
    const ask=()=>{
      play(lesson.questions[index],1,false);
      const token=playerTurn;
      const label=panel.querySelector('small');
      label.textContent='轮流听问法 · '+(index+1)+' / '+lesson.questions.length;
      status.textContent='正在轮流播放问法，点停止结束。';
      const transcript=panel.querySelector('.transcript');
      if(transcript)transcript.innerHTML=words(lesson.questions[index])+'<p>'+esc(lesson.cue)+'</p>';
      demo.onended=()=>{
        if(token!==playerTurn)return;
        index=(index+1)%lesson.questions.length;
        ask();
      };
    };
    ask();
  }
  function recording() {
    if(recorder?.isRecording()){status.textContent='请先完成当前录音，再切换练习。';return true;}
    return false;
  }
  function drawFollow() {
    if(!remaining.length)remaining=lesson.followups.filter(t=>t!==follow);
    if(!remaining.length)remaining=lesson.followups.slice();
    follow=remaining.splice(Math.floor(Math.random()*remaining.length),1)[0];
    index=0;model=false;visible=false;
  }
  function render() {
    stop();
    const old=recorder; recorder=null;
    if(old)old.destroy().catch(()=>{});
    stages.innerHTML=labels.map((l,i)=>'<button data-stage="'+i+'" aria-pressed="'+(i===stage)+'">'+(i+1)+' · '+l+'</button>').join('');
    let html='', target=null, line=null;
    const blind=retest&&stage===2;
    select.hidden=blind;
    document.querySelector('label[for="topic"]').hidden=blind;
    if(blind){
      if(turn===deck.length){
        html='<h2>五题已结束</h2><p>点开任一题核对刚才的问法和回答。</p>'+
          deck.map(({lesson,question})=>'<details><summary>'+esc(lesson.title)+'</summary>'+words(question)+lesson.answers.map(words).join('')+'</details>').join('')+
          '<div class="steps">'+button('restart','打乱再练一次','primary')+button('child-say','加练：你会对孩子说什么？')+'</div>';
      }else{
        html='<small>第 '+(turn+1)+' / '+deck.length+' 题</small><h2>听完题，自己答</h2>'+
          button('replay','重听考官')+button('show','没听清？看问句')+'<div id="take"></div><div class="steps">'+
          button('advance',turn===deck.length-1?'结束并核对五题':'我答完了，听下一题','primary')+'</div>';
        target={id:'sam-v25:retest:'+deck[turn].question.id,title:'脱稿回答',kind:'answer',assessmentMode:'free',expectedText:''};
      }
    }else if(stage===0){
      line=lesson.questions[index];
      html='<small>同一题 · 问法 '+(index+1)+' / '+lesson.questions.length+'</small><h2>听听考官怎么问</h2>'+controls()+
        button('show',visible?'收起问句':'显示问句与中文')+(visible?words(line)+'<p>'+esc(lesson.cue)+'</p>':'')+
        '<div class="steps">'+(retest?button('cycle','轮流听全部问法'):'')+button('next','换个问法听')+button('answer','开始逐句跟读','primary')+'</div>';
    }else if(stage===1 || model){
      const lines=model?follow.answers:lesson.answers;
      line=lines[index];
      html='<small>'+ (model?'追问参考':'我的回答')+' · 第 '+(index+1)+' / '+lines.length+' 句</small>'+
        (model?'<p class="q">'+esc(follow.question.zh)+'</p>':'')+
        (model&&follow.note?'<p>'+esc(follow.note)+'</p>':'')+words(line)+controls()+'<div id="take"></div>'+
        '<div class="steps">'+(index?button('prev','上一句'):'')+
        (index+1<lines.length?button('next','下一句','primary'):retest?button('next-topic',lessons.indexOf(lesson)===lessons.length-1?'开始五题连续追问':'下一题 · 先听考官','primary'):button('draw','听随机追问','primary'))+'</div>';
      if(!retest && model && lesson.key==='r30-hire' && follow===lesson.followups[0]){
        html+='<div class="steps"><a href="#pool-rescue">接着练：有人溺水</a><a href="#pool-running">接着练：小孩在池边跑</a></div>';
      }
      target={id:'sam-v25:echo:'+lesson.key+':'+line.id,title:'逐句跟读',kind:'sentence',assessmentMode:'scripted',expectedText:line.en};
    }else{
      html='<h2>听题，脱稿回答</h2>'+controls()+button('show',visible?'收起问句':'显示问句与中文')+
        (visible?words(follow.question):'')+'<div id="take"></div><div class="steps">'+button('model','看短答并逐句练')+button('draw','换一道追问','primary')+'</div>';
      target={id:'sam-v25:echo:free:'+follow.question.id,title:'脱稿回答',kind:'answer',assessmentMode:'free',expectedText:''};
    }
    panel.innerHTML=html;
    if(target){
      const el=panel.querySelector('#take');
      if(window.SamRecorder){
        recorder=window.SamRecorder.mount(el,{...target,onStart:stop});
        const save=el.querySelector('.swt-with-audio');
        if(save){
          const bar=el.querySelector('.sam-recorder__controls');
          save.textContent=target.expectedText?'录音并评分（可回听）':'脱稿录音（可回听）';
          bar.prepend(save);
        }
      }
      else el.textContent='录音组件未加载，请刷新重试。';
    }
  }
  function enter(i){
    stage=i;index=0;visible=false;model=false;
    if(stage===2){if(retest)startDeck();else drawFollow();}
    render();
    if(stage===2)play(retest?deck[turn].question:follow.question,1,false);
  }
  stages.onclick=e=>{const b=e.target.closest('[data-stage]');if(b&&!recording())enter(Number(b.dataset.stage));};
  select.onchange=()=>{if(recording()){select.value=lesson.key;return;}lesson=lessons.find(l=>l.key===select.value);remaining=[];follow=null;history.replaceState(null,'','#'+lesson.key);enter(0);};
  panel.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;
    const action=b.dataset.action;
    if(action==='stop'){stop();return;}
    if(recording())return;
    if(retest&&stage===2){
      if(action==='restart'){enter(2);return;}
      if(action==='child-say'){
        lesson=lessons.find(l=>l.key==='pool-running');select.value=lesson.key;
        follow=lesson.followups[0];stage=1;index=0;model=true;visible=false;render();play(follow.question,1,false);return;
      }
      if(action==='advance'){
        turn++;visible=false;render();if(turn<deck.length)play(deck[turn].question,1,false);return;
      }
      if(action==='replay'){play(deck[turn].question,1,false);return;}
      if(action==='show'){
        if(visible)panel.querySelector('.transcript')?.remove();
        else b.insertAdjacentHTML('afterend','<div class="transcript">'+words(deck[turn].question)+'</div>');
        visible=!visible;b.textContent=visible?'收起问句':'没听清？看问句';return;
      }
      return;
    }
    if(action==='next-topic'){
      const next=lessons[lessons.indexOf(lesson)+1];
      if(next){select.value=next.key;select.onchange();play(lesson.questions[0],1,false);}
      else enter(2);
      return;
    }
    const lines=stage===0?lesson.questions:model?follow.answers:stage===1?lesson.answers:[follow.question];
    if(action==='normal'||action==='slow'){play(lines[stage===2&&!model?0:index],action==='slow'?0.76:1,true);return;}
    if(action==='show'){
      // Keep the question playing when its transcript is opened.
      const open=!visible;
      if(open){b.insertAdjacentHTML('afterend','<div class="transcript">'+words(lines[index])+(stage===0?'<p>'+esc(lesson.cue)+'</p>':'')+'</div>');}
      else panel.querySelector('.transcript')?.remove();
      visible=open;b.textContent=open?'收起问句':'显示问句与中文';return;
    }
    if(action==='cycle'){cycleQuestions();return;}
    if(action==='answer'){enter(1);return;}
    if(action==='draw'){enter(2);return;}
    if(action==='model'){model=true;index=0;visible=false;}
    if(action==='next')index=(index+1)%lines.length;
    if(action==='prev')index=Math.max(0,index-1);
    visible=false;render();
    if(stage===0&&action==='next')play(lesson.questions[index],1,true);
  });
  window.addEventListener('pagehide',stop);
  window.addEventListener('hashchange',()=>{
    const next=lessons.find(row=>row.key===location.hash.slice(1));
    if(!next || recording())return;
    select.value=next.key;select.onchange();
  });
  select.value=lesson.key;render();
})();
