"""Convert the screenshot crosswalk to listen, rehearse and follow-up rounds."""
import hashlib
import re

def clip(en, zh):
    return {"en": en, "zh": zh, "id": hashlib.sha256(en.encode()).hexdigest()[:18]}

def build(groups, topics):
    ordered = sorted(groups, key=lambda g: {"r30-sales":0,"r30-purpose":1,"r30-hire":2}.get(g[0],3))
    lessons = []
    for key,title,cue,turns in ordered:
        original = topics[key]
        prompts = [clip(original["question"],original["questionZh"])]
        answer = [clip(row["en"],row["zh"]) for row in original["short"]]
        followups = []
        for num,kind,en,zh,ans,trans in turns:
            if kind == "同一题":
                if en != prompts[0]["en"]:
                    prompts.append(clip(en,zh))
                continue
            turn = {"question":clip(en,zh),"answers":[],"note":""}
            if key == "r30-sales" and num == "25":
                turn["note"] = "只选符合你的经历的一句。"
                turn["answers"] = [clip("Yes, I have.","确实做过时：是的，我做过。"),clip("No, I haven't.","确实没做过时：没有。")]
            elif kind == "当场能说":
                # A request for repetition is a learner's spoken response.
                followups[-1]["answers"].append(clip(en,zh))
                continue
            elif ans:
                parts = re.split(r'(?<=[.!?])\s+', ans)
                translations = re.findall(r'[^。！？]+[。！？]?', trans)
                turn["note"] = "".join(translations[len(parts):])
                if len(translations) < len(parts):
                    raise ValueError((en,parts,translations))
                turn["answers"] = [clip(a,b) for a,b in zip(parts,translations)]
            followups.append(turn)
        for row in original["variants"]:
            if row["en"] not in [q["en"] for q in prompts]:
                prompts.append(clip(row["en"],row["zh"]))
        if key=="r30-hire":
            followups[0]["answers"] = [clip("I watch the swimmers.","我留意游泳者。"),clip("I make sure they follow the pool rules.","我确保他们遵守泳池规则。")]
        lessons.append(dict(key=key,title=title,cue=cue,questions=prompts,answers=answer,followups=followups))
    return lessons
