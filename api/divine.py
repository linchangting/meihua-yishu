from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request

SYSTEM_PROMPT = """你是一位精通梅花易数的易学大师，道号"清玄"，学养深厚，为人亲和。
你将收到起卦结果和求测者想问的事情。

请基于卦象信息，结合求测者的具体问题，给出个性化的梅花易数解读。

格式要求（严格按此结构输出）：
【卦象总论】2-3句概括本卦含义与当前态势
【因事而断】3-5句结合求测者的具体问题深入分析，引用体用关系、五行生克来论证
【行动建议】1-2句给出具体可操作的建议
【一语点睛】一句话总结

风格要求：
- 温和睿智，像一位有阅历的长者在指点迷津
- 引用卦象术语但随即用白话解释，让普通人看得懂
- 避免绝对化，用"宜""不宜""或可""恐""似"等措辞
- 不要说"作为AI"之类的话，保持易学大师的角色
- 总字数 200-350 字"""


def build_prompt(hd, question):
    ben = hd.get('benGua', {})
    bian = hd.get('bianGua', {})
    hu = hd.get('huGua', {})
    ti = hd.get('ti', {})
    yong = hd.get('yong', {})
    wx = hd.get('wuxing', {})

    return (
        f"起卦信息：\n"
        f"- 所测之字：{hd.get('char', '?')}（{hd.get('strokeCount', '?')}画）\n"
        f"- 时辰：{hd.get('shichen', '?')}\n"
        f"- 本卦：{ben.get('name', '?')}  变卦：{bian.get('name', '?')}  互卦：{hu.get('name', '?')}\n"
        f"- 动爻：第{hd.get('yaoPos', '?')}爻\n"
        f"- 体卦：{ti.get('name', '?')}（{ti.get('nature', '')}，五行属{ti.get('element', '')}）\n"
        f"- 用卦：{yong.get('name', '?')}（{yong.get('nature', '')}，五行属{yong.get('element', '')}）\n"
        f"- 体用关系：{wx.get('relation', '?')}（{wx.get('desc', '')}）\n\n"
        f"求测者想问：{question}\n\n请依据以上卦象为求测者解读。"
    )


def call_dashscope(prompt):
    api_key = os.environ.get("DASHSCOPE_API_KEY", "")
    url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

    payload = json.dumps({
        "model": "qwen-turbo",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.85,
        "max_tokens": 600,
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )

    with urllib.request.urlopen(req, timeout=8) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            data = json.loads(body)

            question = data.get("question", "")
            hd = data.get("hexagramData", {})
            prompt = build_prompt(hd, question)
            result = call_dashscope(prompt)
            self._json(200, {"interpretation": result})

        except Exception as e:
            self._json(500, {"error": str(e)})

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
