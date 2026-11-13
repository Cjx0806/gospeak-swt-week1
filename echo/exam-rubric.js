// Each rule describes the intent of one spoken question. Score short answers
// by the information they convey. Silence and missing recognition are distinct.
(function(root){
  const tips={
    intro:'先说自己的身份，再补专业、家乡或兴趣中的一个。',
    sales:'说过去做过的一项具体工作，例如买卖二手手机或帮驾校招生。',
    other:'补一项刚才没有提到的工作。如果已经说完，可以直接说这就是你做过的两项工作。',
    prior:'直接说你有没有实际当过救生员。持证和任职是两个问题。',
    purpose:'先说报名的原因。可以说想体验美国文化，再补想在工作中练英语。',
    gain:'说一项你希望带走的收获，例如说英语更自信，或获得工作经验。',
    usa:'说美国吸引你的地方，例如想看看美国人平时怎样生活。',
    hire:'说一个能胜任的理由。可以用中国救生员证，再补平时的游泳训练。',
    duties:'说上班时具体做什么，例如留意游泳者、提醒他们遵守泳池规则。',
    outdoor:'先说你能否接受户外高温工作，再补一句原因或态度。',
    unsafe:'先说你会怎样处理不安全的要求，再说怎样向主管说明或求助。'
  };
  function normalized(text){return text.toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();}
  function evidence(key,s,previous){
    const phone=/\b(phones?|cellphones?|smartphones?)\b/.test(s);
    const school=/\b(driving school|recruited students|find students)\b/.test(s);
    const job=/\b(sold|bought|sell|selling|worked|work at|work as|work in|helped|help|recruited|was a|was an|part time job|experience in|experience with|volunteered|i used to)\b/.test(s);
    const detail=phone||school||/\b(sales|shop|restaurant|cashier|customers?|store|coach|assistant|hotel|lifeguard|camp|cafe)\b/.test(s);
    const cert=/\b(certified|licensed|qualified|certificate|certification|license)\b/.test(s);
    const swim=/\b(swim|swimmer|swimming|trained|training)\b/.test(s);
    const training=swim&&/\b(daily|every day|regularly|kilomet(er|re)|meters|metres|strong|well|practice|practise|train)\b/.test(s);
    const english=/\benglish\b/.test(s);
    const culture=/\b(culture|cultural|daily life|american life|people live|life in (the )?(us|america)|local people|american people)\b/.test(s);
    const aim=/\b(want|like to|hope|wish|interested|because|learn|experience|improve|practice|practise|understand|see|meet|gain|become)\b/.test(s);
    const yes=/^(yes|sure|of course|absolutely)\b/.test(s),no=/^(no|not yet|never)\b/.test(s);
    switch(key){
      case 'intro':{
        const who=/\b(my name is|you can call me|i go by|i'm felix|i am felix)\b/.test(s);
        const student=/\b(student|my major|i study|i'm studying|i am studying)\b/.test(s);
        return [who||student,(who&&student)||((who||student)&&/\b(guangxi|yulin|swimming|college|fitness|outgoing)\b/.test(s))];
      }
      case 'other':
        if(/\b(only|just|those are|that's all|no other|nothing else)\b/.test(s))return [true,true];
        if(previous && (phone||school) && (!phone||/phone/.test(previous))&&(!school||/driving school|recruited students/.test(previous)))return [false,false];
        // The follow-up and the main work question both need actual experience.
      case 'sales':
        return [job&&detail||/\b(no|never|haven't|have not)\b.*\b(job|worked|experience)\b/.test(s),job&&detail];
      case 'prior':{
        const explicit=/\b(never|haven't|have not|worked|been|was|work as)\b.*\blifeguard\b|\blifeguard\b.*\b(before|in china)\b/.test(s);
        return [yes||no||explicit,explicit||/^(yes i have|no i haven't|no i have not|not yet)$/.test(s)];
      }
      case 'purpose': return [aim&&(english||culture||/\b(work experience|cultural exchange|work abroad)\b/.test(s)),aim&&(english||culture)];
      case 'gain': return [aim&&(english||culture||/\b(confidence|skills?|experience|friends|independence)\b/.test(s)),aim&&(english||culture||/\b(work experience|new friends|communication skills)\b/.test(s))];
      case 'usa': return [culture||/\b(the us|america|american)\b/.test(s)&&aim,culture&&aim];
      case 'hire': return [cert||training||/\b(trained lifeguard|lifeguard experience|worked as a lifeguard|first aid|good swimmer)\b/.test(s),cert&&(/\b(lifeguard|lifeguarding)\b/.test(s)||training)||training];
      case 'duties':{
        const watch=/\b(watch|monitor|check|supervise|keep an eye on|protect|help|rescue)\b.*\b(swimmers?|people|pool|water|guests?)\b/.test(s);
        const rules=/\b(rules|safe|safety)\b/.test(s)&&/\b(follow|enforce|remind|keep|make sure|check)\b/.test(s);
        return [watch||rules,watch||rules];
      }
      case 'outdoor':{
        const environment=/\b(outside|outdoors?|sun|heat|hot)\b/.test(s);
        return [yes||no||environment&&/\b(can|can't|comfortable|fine|okay|mind|worry|willing)\b/.test(s),environment];
      }
      case 'unsafe':{
        const action=/\b(refuse|decline|stop|wouldn't|won't|not do|say no|speak up|report|tell|explain|ask)\b/.test(s);
        const safety=/\b(unsafe|dangerous|safer|safety|not safe|supervisor|manager|sponsor)\b/.test(s);
        return [action,action&&safety];
      }
    }
    return [false,false];
  }
  function mark(key,t,previous=''){
    const tip=tips[key];
    if(t.skipped)return {score:0,label:'未作答',tip};
    if(!t.complete||!t.heard?.trim())return {score:null,label:'识别不完整',tip:'重答并取得完整转写后再计分。'};
    const s=normalized(t.heard);
    const [hit,specific]=evidence(key,s,normalized(previous));
    if(hit)return {score:specific?10:7,label:specific?'答到重点':'已切题，可补细节',tip:specific?'回答中听到了这题需要的信息。':tip};
    if(key==='other' && evidence('sales',s,'')[0])return {score:4,label:'还没补出另一项经历',tip};
    const partial= key==='hire'&&/\b(swim|swimming|responsible|careful)\b/.test(s)||key==='sales'&&/^(yes|yes i have|yes i do)$/.test(s);
    if(partial)return {score:4,label:'要点不完整',tip};
    return {score:0,label:'转写中未找到本题要点',tip};
  }
  function total(marks){
    if(!marks.length||marks.some(x=>x.score===null))return null;
    return marks.reduce((sum,x)=>sum+x.score,0)/marks.length;
  }
  root.EchoExamRubric={mark,total};
})(typeof window==='undefined'?globalThis:window);
