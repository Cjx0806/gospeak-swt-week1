"""Merge the six bilingual retest lessons into the main interview player's curriculum."""
import json
import re
from pathlib import Path
from echo_lesson import clip

WORDS = {
    "earned":("ɝnd","获得了"),"taught":("tɔt","教会了"),"spot":("spɑt","发现、识别"),
    "swimmers":("ˈswɪmərz","泳客们"),"trouble":("ˈtrʌbəl","危险、困难"),"duties":("ˈdutiz","职责"),
    "watch":("wɑtʃ","留意、看护"),"area":("ˈɛriə","区域"),"remind":("rɪˈmaɪnd","提醒"),
    "pool":("pul","泳池"),"child":("tʃaɪld","孩子"),"running":("ˈrʌnɪŋ","奔跑"),
    "exact":("ɪɡˈzækt","确切的"),"walk":("wɔk","走"),"slip":("slɪp","滑倒"),
    "fall":("fɔl","跌倒"),"drowning":("ˈdraʊnɪŋ","正在溺水"),"swimmer":("ˈswɪmər","泳客"),
    "water":("ˈwɔtər","水"),"i'd":("aɪd","我会／我想（I would）"),"signal":("ˈsɪɡnəl","发信号"),
    "use":("juz","使用"),"rescue":("ˈrɛskju","救援"),"tube":("tub","管；rescue tube 指救生浮标"),
    "teammate":("ˈtimmeɪt","队友"),"911":("naɪn wʌn wʌn","美国紧急电话"),"break":("breɪk","假期"),
    "i'll":("aɪl","我会（I will）"),"classes":("ˈklæsɪz","课程"),"start":("stɑrt","开始")
}

# Each list follows the order of the displayed English. Existing dictionary entries
# supply the remaining words and audio; these segments describe their role in context.
STRUCTURES = """
W:Why|U:should|S:we|V:hire|O:you|G:as a lifeguard
W:Why|K:are|S:you|P:a good fit|G:for this job
S:I|V:earned|O:my lifeguard certificate|L:in China
S:My training|V:taught|I:me|D:to spot swimmers in trouble
S:I|V:swim|MEASURE:a kilometer|T:every day|L:at school
O:What|U:does|S:a lifeguard|V:do
O:What|U:does|S:being a lifeguard|V:mean|G:to you
P:What|K:are|S:your duties|G:as a lifeguard
S:I|V:watch|O:the swimmers|L:in my area
S:I|V:remind|O:people|G:of the pool rules
C:If someone is in trouble|S:I|V:help|T:right away
O:What|U:would|S:you|V:say|G:to the child
S:A child|V:is running|L:by the pool|P:What|K:are|S:your exact words
X:Please|V:walk
S:You|U:could|V:slip|J:and|V:fall
O:What|U:would|S:you|V:do|C:if someone was drowning
S:A swimmer|K:is|P:in trouble|L:in the water|O:What|U:would|S:you|V:do
S:I'd|V:signal|G:for help|T:right away
S:I'd|V:use|O:my rescue tube|PUR:to help the swimmer
S:I'd|V:ask|O:a teammate|B:to call 911
W:Why|U:do|S:you|V:want to take part|G:in SWT
S:I|V:want|O:to experience American culture|T:during my summer break
S:I'd|V:like|O:to meet people|G:through my summer job
S:I'll|V:go back|L:to China|TIME:before classes start
S:I'll|V:continue|O:my studies|L:in Guangxi
"""
TITLES = ["为什么录用我", "救生员的职责", "对奔跑的孩子说什么", "有人溺水怎么办", "为什么参加 SWT", "项目结束后回哪里"]
BRIDGES = ["先说持证，再说明培训教会了你什么，最后补训练习惯。","先说看护区域，再说提醒规则。用 If 引出紧急情况。","先对孩子说 Please walk，停一拍，再告诉他可能滑倒。","先说发信号，然后说你的救援动作，再交代队友做什么。","说完暑假想体验什么，再说希望通过工作认识当地人。","先说开学前回中国，再说在广西继续读书。"]
RELATED = [["pool-duties","r30-swim"],["pool-say","pool-rescue"],["pool-duties","pool-rescue"],["pool-duties","r30-hire"],["r30-return","r30-job"],["r30-grad","r30-plans"]]
def tokens(s):
    return re.findall(r"[A-Za-z0-9]+(?:'[A-Za-z]+)?",s)
def audio(c):
    path = "./echo/audio/"+c["id"]+".mp3"
    return {"normal":path,"slow":path,"slowRate":0.76}
def install(site, curriculum, lessons):
    real = curriculum["real"]
    lex = curriculum["lexicon"] | real["lexicon"]
    for en,(ipa,zh) in WORDS.items():
        path=audio(clip(en,""))["normal"]
        if not (site/path).is_file(): raise ValueError("Missing word audio "+en)
        lex[en]=real["lexicon"][en]={"ipa":ipa,"zh":zh,"src":path}
    structures={}
    for line in STRUCTURES.strip().splitlines():
        parts=[seg.split(":",1) for seg in line.split("|")]
        structures[" ".join(tokens(" ".join(x[1] for x in parts))).lower()]=parts
    def add_note(c):
        en=c["en"]
        if en in real["notes"] or en in curriculum["languageNotes"]:return
        parts=structures[" ".join(tokens(en)).lower()]
        expanded=[]
        for role,phrase in parts:
            if phrase in ("I'd","I'll"):
                expanded.extend([["S","I"],["U",phrase[1:]]])
            else: expanded.append([role,phrase])
        real["notes"][en]={"words":[[w,lex[w.lower()]["zh"]] for w in tokens(en)],
            "parts":expanded,"inner":[],"tips":[],"mod":[]}
    by_id={t["id"]:t for t in real["topics"]}
    for i,lesson in enumerate(lessons):
        key=lesson["key"]
        row=by_id.get(key, {"id":key,"category":"救生员复试","branches":[],"followups":[],"extra":[]})
        # Keep old question indices stable for previously saved mock examinations.
        qs=lesson["questions"]
        if key in by_id:
            old=[row["question"]]+[v["en"] for v in row["variants"]]
            qs=sorted(qs,key=lambda q: old.index(q["en"]) if q["en"] in old else len(old))
        for c in qs+lesson["answers"]:add_note(c)
        q=qs[0]
        def spoken(c): return {**c,"audio":audio(c)}
        row.update(title=TITLES[i],question=q["en"],questionZh=q["zh"],questionAudio=audio(q),
                   variants=[spoken(v) for v in qs[1:]], short=[spoken(a) for a in lesson["answers"]],
                   fullAudio=audio(lesson["whole"]),related=RELATED[i],cue=lesson["cue"],bridge=BRIDGES[i],
                   retest=True)
        by_id[key]=row
    new_ids=["pool-duties","pool-say","pool-rescue"]
    group=next(g for g in real["sequence"] if "r30-hire" in g["ids"])
    where=group["ids"].index("r30-hire")+1
    group["ids"][where:where]=new_ids
    real["topics"]=[by_id[key] for g in real["sequence"] for key in g["ids"]]
    real["mainCount"]+=len(new_ids)
    real["retestIds"]=[l["key"] for l in lessons]
    (site/"interview-retest.json").write_text(json.dumps(curriculum,ensure_ascii=False,separators=(",",":")))

def install_player(site):
    player=site/"assets/mainline-v21.js"
    s=player.read_text()
    if "function retestPicker(" not in s:
        def edit(a,b):
            nonlocal s
            if s.count(a)!=1: raise ValueError("Mainline integration anchor: "+a)
            s=s.replace(a,b)
        edit("interview-v21.json?v='+VERSION+'&course=35","interview-retest.json?v=46")
        edit("'#opening-exam'].includes(location.hash)", "'#opening-exam','#retest'].includes(location.hash)")
        edit("let openingMode=", "let retestMode=!location.hash || location.hash==='#retest';\n  let openingMode=")
        edit("state.selected=typeof location", "state.selected=retestMode?'r30-hire':typeof location")
        edit('  function realHeader(item){', '''  function retestPicker(item){
    return '<nav class="swt-retest-picker" aria-label="复试六题">'+realData().retestIds.map(id=>
      '<button type="button" data-sam-action="retest-topic" data-value="'+esc(id)+'" aria-pressed="'+(item.id===id)+'">'+esc(realTopic(id).title)+'</button>').join('')+'</nav>';
  }
  function realHeader(item){''')
        edit("btn('real-study','顺序练题',null,study?'current':'')+",
             "btn('retest-topic','复试六题',state.selected&&realData().retestIds.includes(state.selected)?state.selected:'r30-hire',study&&retestMode?'current':'')+btn('real-study','顺序练题',null,study&&!retestMode?'current':'')+")
        edit("return '<header class=\"r30-header\"><div><h1>按口测顺序练</h1>", """return (retestMode?retestPicker(item):'')+'<header class="r30-header"><div><h1>'+esc(retestMode?item.title:'按口测顺序练')+'</h1>""")
        edit("esc(group.title)+' · '+(index", "(retestMode?'复试六题 · '+(realData().retestIds.indexOf(item.id)+1)+' / 6':esc(group.title)+' · '+(index")
        edit(":'延伸追问')+'</p></div>",":'延伸追问'))+'</p></div>")
        edit("    const tail=item.seam.split", """    if(item.retest)return '<p class="r30-hint">'+esc(item.bridge)+'</p>';
    const tail=item.seam.split""")
        edit("const rows=realData().topics, pos=", "const rows=retestMode?realData().retestIds.map(realTopic):realData().topics, pos=")
        edit("return realHeader(item)+'<p class=\"r30-actions\"><a href=\"./echo-review.html?course=swt\">复试重点 · 六题听说</a> · <a href=\"./echo-review.html?course=lifeguard5\">复测主线 · 救生员五题</a></p>'+",
             """return realHeader(item)+(retestMode?'<p class="r30-actions"><a href="./echo-exam.html?examiner=pool">进入 Alex 救生员模拟考场</a></p>':'')+""")
        edit("if(action==='real-study'){","if(action==='retest-topic'){retestMode=true;chooseReal(value);}\n    else if(action==='real-study'){retestMode=false;")
        edit("    room='study';follow=null;model=false;reveal=false;", "    if(!realData().retestIds.includes(id))retestMode=false;\n    room='study';follow=null;model=false;reveal=false;")
        edit("speakOnce({en:v.en,audio:realData().profiles[session.profile].audio[v.en]});", "speakOnce({en:v.en,audio:realData().profiles[session.profile].audio[v.en]||v.audio});")
        edit("clip=profile.audio[v.en];","clip=profile.audio[v.en]||v.audio;")
        player.write_text(s)
    s=player.read_text()
    if 'function openRetest()' not in s:
        s=s.replace("  function init(){", """  function openRetest(){
    if(location.hash!=='#retest' || !safeToChange())return;
    retestMode=true;
    const nav=document.querySelector('.app-nav [data-view="coach"]');
    if(nav&&!nav.classList.contains('active'))nav.click();
    if(realData())chooseReal('r30-hire');
  }
  window.addEventListener('hashchange',openRetest);
  document.addEventListener('click',function(e){
    if(e.target.closest('#retest-entry')&&location.hash==='#retest')openRetest();
  });
  function init(){""")
        s=s.replace("if(!follow&&(stage===1||", "if(!retestMode&&!follow&&(stage===1||")
        s=s.replace("if(stage===1&&!follow)content+='<p class=", "if(!retestMode&&stage===1&&!follow)content+='<p class=")
        player.write_text(s)
    index=site/"index.html"
    html=index.read_text()
    if 'id="retest-entry"' not in html:
        html=html.replace('<a class="cards-listen-link"', '<a id="retest-entry" href="./?v=46#retest">SWT 复试六题</a><a class="cards-listen-link"',1)
        html=html.replace("</head>",'<style>.swt-retest-picker{display:flex;flex-wrap:wrap;gap:6px;margin:.8rem 0}.swt-retest-picker button{min-height:44px;padding:6px 10px}.swt-retest-picker [aria-pressed=true],#retest-entry{background:#244996;color:white;border-radius:8px}#retest-entry{display:inline-flex;align-items:center;min-height:44px;padding:0 12px;text-decoration:none}</style></head>')
    html=html.replace('V36 · 快乐出村计划','V46 · 快乐出村计划').replace('mainline-v21.js?v=22&design=45','mainline-v21.js?v=22&design=46')
    index.write_text(html)
    worker=site/'sw.js'
    sw=worker.read_text().replace('-echo45\'', '-echo46\'').replace("set('design','45')","set('design','46')")
    if 'interview-retest.json?v=46' not in sw:
        sw=sw.replace("self.addEventListener('install'", "core.push(new URL('interview-retest.json?v=46', BASE).href);\nself.addEventListener('install'",1)
    worker.write_text(sw)
