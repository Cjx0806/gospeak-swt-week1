from echo_lesson import clip
from pathlib import Path
import json

def build_exam(site, lessons, retest):
    by_key = {g['key']:g for g in lessons}
    intro = [
        clip("Please introduce yourself.", "请介绍一下自己。"),
        clip("Could you tell me a little about yourself?", "能简短介绍一下你自己吗？"),
    ]
    groups = [('intro','自我介绍',intro)]
    for key,title in [('sales','工作经历'),('purpose','为什么参加 SWT'),('hire','为什么适合做救生员')]:
        groups.append((key,title,by_key['r30-'+key]['questions']))
    follow = [
        ('sales', 'other', '另一项工作经历', clip("You mentioned your work experience. What other work have you done?", "你刚才提到了工作经历。你还做过什么工作？")),
        ('sales', 'prior', '实际救生员经历', by_key['r30-sales']['followups'][1]['question']),
        ('purpose','gain','最想收获什么',clip("What do you hope to gain from the SWT program?", "你希望从 SWT 项目中收获什么？")),
        ('purpose','usa','为什么选美国',by_key['r30-purpose']['followups'][1]['question']),
        ('hire','duties','救生员职责',by_key['r30-hire']['followups'][0]['question']),
        ('hire','outdoor','户外岗位',by_key['r30-hire']['followups'][1]['question']),
        ('hire','unsafe','不安全的指令',by_key['r30-hire']['followups'][2]['question']),
    ]
    data={'main':[dict(key=k,title=t,options=o) for k,t,o in groups],
          'follow':[dict(parent=p,key=k,title=t,options=[o]) for p,k,t,o in follow]}
    intro_answer = [
        clip("Hi, I'm Felix.", "你好，我叫 Felix。"),
        clip("I'm a first-year college student.", "我是一名大一学生。"),
        clip("My major is physical fitness training.", "我的专业是体育体能训练。")]
    for item in data["main"]:
        item["answers"] = intro_answer if item["key"] == "intro" else by_key["r30-"+item["key"]]["answers"]
    for item in data["follow"]:
        group = by_key["r30-"+item["parent"]]
        key = item["key"]
        if key == "other":
            item["answers"] = group["answers"] + [clip("Those are the two jobs I've done.", "我做过的就是这两份工作。")]
            item["note"] = "选刚才还没提到的一份工作。如果两份都说过，只说最后一句。"
        else:
            positions = {"prior":1, "gain":0, "usa":1, "duties":0, "outdoor":1, "unsafe":2}
            source = group["followups"][positions[key]]
            item["answers"], item["note"] = source["answers"], source["note"]
    opening = clip("Hi, thanks for joining today. First, could you tell me a little about yourself?",
                   "你好，感谢你今天参加。首先，能简单介绍一下自己吗？")
    pool = [dict(key="intro", title="自我介绍", options=[opening], answers=intro_answer)]
    for key, lesson in zip(["hire", "duties", "priority", "rescue", "running"], retest):
        pool.append(dict(key=key, title=lesson["title"], options=lesson["questions"], answers=lesson["answers"]))
    for lesson, keys in [(retest[3], ["first", "teammate"]), (retest[4], ["say", "persists"])]:
        for key, prompt in zip(keys, lesson["followups"]):
            question = prompt["question"]
            pool.append(dict(key=key, title=question["zh"], options=[question], answers=prompt["answers"]))
    for key in ["purpose","return"]:
        lesson = by_key["r30-"+key]
        pool.append(dict(key=key,title=lesson["title"],options=lesson["questions"],answers=lesson["answers"]))
    data["pool"] = pool
    for row in data['main']+data['follow']+pool:
        if not row['answers']: raise ValueError('Missing review answer: '+row['key'])
        for line in row['options'] + row['answers']:
            if not (site/'echo/audio'/(line['id']+'.mp3')).is_file():raise ValueError(line['en'])
    page=(Path(__file__).resolve().parents[1]/'echo/exam-template.html').read_text()
    (site/'echo-exam.html').write_text(page.replace('<!-- QUESTIONS -->',json.dumps(data,ensure_ascii=False).replace('<','\\u003c')))
