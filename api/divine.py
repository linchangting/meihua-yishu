from http.server import BaseHTTPRequestHandler
import json
import os

SYSTEM_PROMPT = """你是一位精通梅花易数的易学大师，道号"清玄"，学养深厚，为人亲和。
你将收到：起卦结果（本卦、变卦、互卦、体用关系、五行生克）和求测者想问的事情。

请基于卦象信息，结合求测者的具体问题，给出个性化的梅花易数解读。

格式要求（严格按此结构输出）：
【卦象总论】2-3句概括本卦含义与当前态势
【因事而断】3-5句结合求测者的具体问题深入分析，引用体用关系、五行生克来论证
【行动建议】1-2句给出具体可操作的建议
【一语点睛】一句话总结（简短有力，像古人的智慧箴言）

风格要求：
- 温和睿智，像一位有阅历的长者在指点迷津
- 引用卦象术语但随即用白话解释，让普通人看得懂
- 避免绝对化，用"宜""不宜""或可""恐""似"等措辞
- 不要说"作为AI"之类的话，保持易学大师的角色
- 总字数 250-400 字"""


def build_prompt(hd, question):
    ben = hd.get('benGua', {})
    bian = hd.get('bianGua', {})
    hu = hd.get('huGua', {})
    ti = hd.get('ti', {})
    yong = hd.get('yong', {})
    wuxing = hd.get('wuxing', {})

    return f"""起卦信息：
- 所测之字：{hd.get('char', '未知')}（{hd.get('strokeCount', '?')}画）
- 时辰：{hd.get('shichen', '未知')}
- 本卦：{ben.get('name', '?')}
- 变卦：{bian.get('name', '?')}
- 互卦：{hu.get('name', '?')}
- 动爻：第{hd.get('yaoPos', '?')}爻
- 体卦：{ti.get('name', '?')}（{ti.get('nature', '')}，五行属{ti.get('element', '')}）
- 用卦：{yong.get('name', '?')}（{yong.get('nature', '')}，五行属{yong.get('element', '')}）
- 体用关系：{wuxing.get('relation', '?')}（{wuxing.get('desc', '')}）

求测者想问的事情：{question}

请依据以上卦象，为求测者解读此卦。"""


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            data = json.loads(body)

            question = data.get('question', '')
            hd = data.get('hexagramData', {})
            prompt = build_prompt(hd, question)

            from openai import OpenAI
            client = OpenAI(
                api_key=os.environ.get("DASHSCOPE_API_KEY"),
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            )

            resp = client.chat.completions.create(
                model="qwen-plus",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.85,
                max_tokens=800,
            )

            result = resp.choices[0].message.content
            self._json(200, {"interpretation": result})

        except Exception as e:
            self._json(500, {"error": str(e)})

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def _json(self, code, data):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self._cors()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
