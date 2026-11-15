"""Beginner interview turns about pool surveillance, prevention and rescue."""
from echo_lesson import clip


def turn(question, answers):
    return {"question": clip(*question), "answers": [clip(*a) for a in answers], "note": ""}


def pool_lessons():
    drowning = {
        "key": "pool-rescue", "title": "有人溺水怎么办",
        "cue": "drowning 是溺水；in trouble in the water 表示水中遇险。What would you do 问你会采取什么行动。",
        "questions": [clip("What would you do if someone was drowning?", "如果有人溺水，你会怎么做？"),
                      clip("A swimmer is in trouble in the water. What would you do?", "一名泳客在水中遇险。你会怎么做？")],
        "answers": [clip("I'd signal for help right away.", "我会立刻发信号求援。"),
                    clip("I'd follow our emergency plan.", "我会按场馆的应急预案行动。"),
                    clip("I'd use my training to rescue the swimmer.", "我会用受训时学过的方法救助泳客。")],
        "followups": [
            turn(("What would you do first?", "你第一步会做什么？"),
                 [("I'd signal for help right away.", "我会立刻发信号求援。")]),
            turn(("What would you ask a teammate to do?", "你会请一名队友做什么？"),
                 [("I'd ask them to call 911.", "我会请队友拨打美国急救电话 911。")])]}
    running = {
        "key": "pool-running", "title": "小孩在池边跑怎么办",
        "cue": "running 是在跑；pool deck 是泳池边的地面。What would you say 问你会对孩子说哪句话。",
        "questions": [clip("What would you do if a child was running by the pool?", "如果一个孩子在泳池边跑，你会怎么做？"),
                      clip("You see a kid running on the pool deck. How would you handle it?", "你看见小孩在池边跑，会怎么处理？")],
        "answers": [clip("I'd tell the child to walk.", "我会提醒孩子慢慢走。"),
                    clip("I'd keep watching the swimmers.", "同时我会继续留意水里的泳客。")],
        "followups": [
            turn(("What would you say to the child?", "你会对孩子说什么？"),
                 [("Please walk.", "请慢慢走。"), ("You could slip and fall.", "你可能会滑倒。")]),
            turn(("What if the child keeps running?", "如果孩子还在跑呢？"),
                 [("I'd ask another staff member to help.", "我会请另一位工作人员协助。"),
                  ("I'd keep watching my area.", "我会继续留意自己负责的区域。")])]}
    return [drowning, running]


def retest_lessons(hire, scenarios):
    hiring = dict(hire, questions=[
        clip("Why should we hire you as a lifeguard?", "为什么要录用你做救生员？"),
        *hire["questions"]])
    duties = {
        "key": "pool-duties", "title": "救生员的职责",
        "cue": "听到 do 或 duties，回答你上班时做什么。",
        "questions": [hire["followups"][0]["question"],
                      clip("What are your duties as a lifeguard?", "当救生员，你的职责是什么？")],
        "answers": hire["followups"][0]["answers"], "followups": []}
    priority = {
        "key": "pool-priority", "title": "岗位最重要的是什么",
        "cue": "听到 most important 或 matters most，先说你最看重什么，再讲一个行动。",
        "questions": [clip("What's the most important part of the job?", "这份工作最重要的是什么？"),
                      clip("What matters most when you're a lifeguard?", "你当救生员时，最重要的是什么？")],
        "answers": [clip("Keeping swimmers safe.", "保护泳客安全。"),
                    clip("That's why I watch the water closely.", "所以我会密切留意水里的情况。")],
        "followups": []}
    return [hiring, duties, priority, *scenarios]
