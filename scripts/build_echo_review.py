"""Build the screenshot crosswalk and add its entry to the interview study view."""
from html import escape
from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
site = root / "_site"
curriculum = json.loads((site / "interview-v21.json").read_text())
topics = {q["id"]: q for q in curriculum["real"]["topics"]}
# Each group's first question comes from the existing course. Subsequent turns
# separate paraphrases from prompts that call for a different answer.
groups = [
 ("r35-home","家乡","where / from 问来自哪里；describe 要再介绍一句。",[
 ("1","同一题","Where do you come from?","你来自哪里？","I'm from Yulin, Guangxi.","我来自广西玉林。"),
 ("1","接着问","Can you describe your hometown?","能介绍一下你的家乡吗？","It's a city in southern China.","它是中国南方的一座城市。")]),
 ("r30-sales","工作经历","work experience 问做过什么；similar work 问做没做过眼前这个岗位。",[
 ("9","同一题","Have you had a part-time job?","你做过兼职吗？","Yes. I bought and sold used phones.","做过。我买卖过二手手机。"),
 ("9","接着问","What else did you do?","你还做过什么？","I also helped a driving school find students.","我还帮驾校招过学员。"),
 ("25","接着问","Have you worked as a lifeguard before?","你以前当过救生员吗？","","先按事实回答做过或没做过。你已经确认的是持有中国救生员证；实际任职经历待确认。")]),
 ("r30-major","专业","major / study 问学什么；why did you choose it 问选择的原因。",[
 ("2","同一题","What do you study?","你学什么专业？","My major is physical fitness training.","我的专业是体育体能训练。"),
 ("2","接着问","Why did you choose it?","你为什么选这个专业？","I like sports, and I want to be a swimming coach.","我喜欢运动，也想当游泳教练。（如果这就是你当时选专业的原因，可以这样说。）")]),
 ("r30-purpose","为什么参加 SWT","why 问动机；gain most 要说最想得到什么；why the US 要回答这个国家吸引你的地方。",[
 ("16","同一题","Why do you want to take part in SWT?","为什么想参加 SWT？","I want to experience American culture.","我想体验美国文化。"),
 ("17","接着问","What do you hope to gain from it?","你希望从中收获什么？","I want to feel more comfortable speaking English.","我希望说英语时更自在。"),
 ("18","接着问","Why did you choose the US?","为什么选择美国？","I want to see what daily life is like there.","我想亲身看看美国人平时怎样生活。")]),
 ("r30-hire","救生员岗位","hire / good fit 问录用理由；duties 问上班做什么；outdoors 问工作环境。",[
 ("已有","同一题","Why are you a good fit for this job?","你为什么适合这份工作？","I have a Chinese lifeguard certificate. I swim one kilometer at school every day.","我有中国的救生员证。我每天在学校游一公里。"),
 ("23","接着问","What does a lifeguard do?","救生员有什么职责？","I watch the swimmers and make sure they follow the pool rules.","我留意游泳者，确保他们遵守泳池规则。"),
 ("27","接着问","Can you work outside when it's hot?","天气热时你能在户外工作吗？","Yes. I'm comfortable working in the sun.","可以。我能接受在太阳下工作。"),
 ("43","接着问","What if your supervisor asks you to do something unsafe?","主管让你做不安全的事怎么办？","I'd say it's unsafe and ask for a safer way.","我会说明这样不安全，并询问更安全的做法。")]),
 ("r30-challenge","听不懂与求助","English level 问现在的水平；what would you do 要说行动；考官当场说得太快，可以直接请他重复。",[
 ("15","接着问","How good is your English?","你的英语水平怎么样？","My English is basic. I'm practicing short answers.","我的英语还在基础阶段。我在练习简短回答。"),
 ("35","接着问","What if you can't understand a guest?","如果你听不懂客人的话，怎么办？","I'd ask them to say it again more slowly.","我会请对方再慢一点说一遍。"),
 ("35","当场能说","Could you say that again, more slowly?","您能再慢一点说一遍吗？","","需要考官重复时，直接说上面这句话。")]),
 ("r30-return","项目结束与毕业","after the program 问这个夏天结束后；after graduation 才问毕业后的职业。",[
 ("44","同一主题","Will you stay in the US after the program?","项目结束后你会留在美国吗？","No. I'll go back to China to finish college.","不会。我会回中国完成学业。"),
 ("45","同一主题","Will you return to China after the program?","项目结束后你会回中国吗？","Yes. I'll go back to school in China.","会。我会回中国继续上学。"),
 ("已有","接着问","When will you graduate?","你什么时候毕业？","I'll graduate in 2029.","我将在 2029 年毕业。"),
 ("11","接着问","What job would you like after graduation?","毕业后你想做什么工作？","I want to be a swimming coach.","我想当游泳教练。")]),
]
# Remaining numbers are mapped to a precise destination or set aside explicitly.
index = [
 ("同题并入或复用已有练习","1 家乡（后半问描述）｜2 专业（后半问原因）｜5 爱好，用游泳和骑行｜9 工作经历｜10 出国旅行，用独自去韩国的经历｜11 毕业后的职业｜13 家人支持｜16 项目动机｜17 项目收获｜18 为什么选美国｜20 分享中国文化｜21 休息日想去的地方，用纽约观光直升机｜27 户外岗位（遇雨要按现场安全安排）｜35 听不懂怎么办｜36 难沟通的顾客｜37 迟到｜44、45 项目结束回国"),
 ("留在相关题后追问","6 性格→一个优点和一个不足｜7 团队合作→个人偏好｜8 独立生活→是否真的离家居住过｜15 英语困难→目前水平及信心｜19 为什么选美国→对美国文化的看法｜22 文化交流→日常生活差异｜23 意向岗位→日常职责｜24 选岗地点→对那个城市的了解｜25 工作经历→有无同岗经验｜26 岗位条件→周末或节假日上班｜28 户外工作→体力透支怎么办｜29 工作压力→快节奏工作｜30 旅行→工作与旅行冲突｜34 独立生活→与室友发生矛盾｜38 独立生活→想家｜43 岗位职责→遇到不安全的指令"),
 ("有余力再练","3 喜欢的科目｜4 校园生活｜12 兄弟姐妹｜14 学生社团｜31 社会安全号码｜32 生病｜33 银行开户｜39 遗失护照或钱包｜40 延迟发薪｜41 遇到歧视｜42 迷路"),
]
css = """*{box-sizing:border-box}body{font:17px/1.6 system-ui,sans-serif;margin:auto;max-width:760px;padding:22px;color:#182339;background:#fbfaff}a,.q{color:#204fb5}h1{font-size:1.65em}h2{font-size:1.15em}details{background:white;border:1px solid #ccd4e2;border-radius:12px;margin:12px 0;padding:12px 16px}summary{cursor:pointer;font-weight:700}article+article{border-top:1px solid #e2e4e9;margin-top:14px;padding-top:12px}small{color:#625370}p{margin:.35em 0}.q{font-size:1.08em;font-weight:650}article .zh{color:#465367}"""
page = ['<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>周日口测 · Echo 题目对照</title><style>'+css+'</style><main><a href="./index.html#route">返回 SWT 顺序练题</a><h1>自我介绍之后，练这七组</h1><p>先用手遮住回答，听出问什么，再说一句。标有题号的内容按 Echo 截图整理，英文采用适合初学者的短问法。</p>']
for i,(topic,title,cue,turns) in enumerate(groups,1):
    q=topics[topic]
    page.append(f'<details{" open" if i==1 else ""}><summary>{i}　{escape(title)}</summary><p class="q" lang="en">{escape(q["question"])}</p><p>{escape(q["questionZh"])}</p><p>{escape(cue)}</p>')
    for num,kind,en,zh,ans,trans in turns:
        label='课程原有' if num=='已有' else 'Echo '+num
        page.append(f'<article><small>{label} · {kind}</small><p class="q" lang="en">{escape(en)}</p><p class="zh">{escape(zh)}</p><details><summary>{"看短答" if ans else "练习提示"}</summary><p lang="en">{escape(ans)}</p><p>{escape(trans)}</p></details></article>')
    page.append('</details>')
page.append('<details><summary>全部 45 题分别放在哪里？</summary>')
for heading,body in index:
    page.append(f'<h2>{heading}</h2><p>{body}</p>')
page.append('</details></main></html>')
(site/'echo-review.html').write_text('\n'.join(page))
hook = "if(stage===1&&!follow&&['r30-intro','r35-home','r35-personality','r30-sales'].includes(item.id))content+=btn('opening-lobby'"
player = site/'assets/mainline-v21.js'
code = player.read_text()
if 'href="./echo-review.html"' not in code:
    if code.count(hook)!=1: raise ValueError('Study view anchor changed')
    player.write_text(code.replace(hook,'''if(stage===1&&!follow)content+='<p class="r30-hint"><a href="./echo-review.html">周日口测 · Echo 同题与追问</a></p>';
    '''+hook))

# Install a fresh player URL so a returning iPad can see the new course entry.
import re
index_file = site / "index.html"
index_file.write_text(re.sub(r"(mainline-v21\.js\?v=22&design=)\d+", r"\g<1>38", index_file.read_text()))
worker = site / "sw.js"
sw = worker.read_text()
if "echo-review.html" not in sw:
    sw = re.sub(r"(const VERSION = '[^']+)';", r"\g<1>-echo38';", sw, count=1)
    sw = re.sub(r"(if\(u.pathname.endsWith\('/mainline-v21.js'\)\)u.searchParams.set\('design',')\d+", r"\g<1>38", sw)
    sw = sw.replace("self.addEventListener('install'", "core.push(new URL('echo-review.html', BASE).href);\nself.addEventListener('install'", 1)
    worker.write_text(sw)
