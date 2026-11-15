const assert=require('node:assert/strict');
require('../echo/exam-rubric.js');
const {mark,total}=globalThis.EchoExamRubric;
const m=(key,heard,also='')=>mark(key,{complete:true,heard},also).score;
for(const [k,s] of [
 ['intro',"My name is Felix. I am a student."],['sales','I bought and sold used phones.'],
 ['purpose','I want to experience American culture.'],['hire','I have a Chinese lifeguard certificate.'],
 ['other','I also helped a driving school find students.'],['prior',"No, I haven't."],
 ['gain','I want to improve my English.'],['usa','I want to see what daily life is like there.'],
 ['duties','I watch the swimmers.'],['outdoor',"I'm comfortable working in the sun."],
 ['unsafe',"I'd say it's unsafe and ask for a safer way."]])assert.equal(m(k,s),10,k);
assert.equal(m('sales','I want to be a lifeguard.'),0);
assert.equal(m('hire','I want to experience American culture.'),0);
assert.equal(m('other','I sold phones.','I sold used phones.'),4);
assert.equal(mark('hire',{complete:false,heard:'certificate'}).score,null);
assert.equal(mark('sales',{skipped:true}).score,0);
assert.equal(total([{score:6},{score:6}]),6);
assert.equal(total([{score:null},{score:10}]),null);

for(const [key,answer] of Object.entries({
  priority:'Keeping swimmers safe.',rescue:"I'd signal for help and follow the emergency plan.",
  first:"I'd blow my whistle.",teammate:"Please call 911.",running:"I'd tell the child to walk.",
  say:'Please walk.',persists:"I'd ask another staff member to help."
})){
  assert.equal(m(key,answer),10,key);
  assert.equal(m(key,'I have a Chinese lifeguard certificate.'),0,key);
}
assert.equal(m('say',"I would tell the child to walk."),7);
assert.equal(m('rescue',"I would call for help."),7);
