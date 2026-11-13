from echo_lesson import clip
from pathlib import Path
import json

def build_exam(site, lessons):
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
    for row in data['main']+data['follow']:
        for line in row['options']:
            if not (site/'echo/audio'/(line['id']+'.mp3')).is_file():raise ValueError(line['en'])
    page=(Path(__file__).resolve().parents[1]/'echo/exam-template.html').read_text()
    (site/'echo-exam.html').write_text(page.replace('<!-- QUESTIONS -->',json.dumps(data,ensure_ascii=False).replace('<','\\u003c')))
