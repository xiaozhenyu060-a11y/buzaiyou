"""
简易的格式化输出,非流式
"""
# class TracePrinter:
#     @staticmethod
#     def print_agent_trace(response):
#         """非工具-打印 agent 的完整执行过程"""
#         for message in response["messages"]:
#             message_type = type(message).__name__

#             if message_type == "HumanMessage":
#                 print(f"\n👤 [User] {message.content}")

#             elif message_type == "AIMessage":
#                 reasoning = message.additional_kwargs.get("reasoning_content")
#                 if reasoning:
#                     print(f"\n🧠 [Thinking] {reasoning}")

#                 if message.tool_calls:
#                     for tool_call in message.tool_calls:
#                         print(f"\n🔧 [Tool Call] {tool_call['name']}({tool_call['args']})")

#                 if message.content:
#                     print(f"\n🤖 [AI] {message.content}")

#             elif message_type == "ToolMessage":
#                 print(f"\n📦 [Tool Result] {message.name} -> {message.content}")

"""
流式输出
"""

import time

from langchain_core.messages import AIMessage, ToolMessage


class StreamPrinter:
    def __init__(self, config, agent, show_stats=True):
        self.config = config
        self.agent = agent
        self.show_stats = show_stats
        self._line_open = False          # 当前行是否还没换行

    # ─────────── 输出小工具 ───────────
    def _write(self, text):
        """往当前行写东西（不换行）。"""
        print(text, end="", flush=True)
        self._line_open = True

    def _break_line(self):
        """需要另起一行时调用。"""
        if self._line_open:
            print()
            self._line_open = False

    def _start_reply(self):
        """开始"模型说话"——如果换过行了，补个前缀。"""
        if not self._line_open:
            print("🤖 ", end="", flush=True)
            self._line_open = True

    def should_quit(self, text):
        return text.strip().lstrip("/").lower() in ("quit", "q", "exit")

    # ─────────── 主流程 ───────────
    def ask(self, question):
        if self.should_quit(question):
            return None                        # ← None，不是 'None'

        start = time.perf_counter()
        n_chunk = 0
        n_char = 0
        pieces = []

        self._start_reply()

        for mode, chunk in self.agent.stream(
            {"messages": [{"role": "user", "content": question}]},
            self.config,
            stream_mode=["messages", "updates"],        # ← 没有空格
        ):
            if mode == "messages":
                message, metadata = chunk

                if metadata.get("langgraph_node") != "model":
                    continue

                text = str(message.content or "")
                if not text:
                    continue

                n_chunk += 1
                n_char += len(text)
                pieces.append(text)

                self._start_reply()                  # 换过行就补前缀
                self._write(text)

            elif mode == "updates":
                for _node_name, update in (chunk or {}).items():
                    for message in (update or {}).get("messages") or []:   # ← messages

                        # ① 模型决定调工具
                        if isinstance(message, AIMessage) and message.tool_calls:
                            self._break_line()
                            for call in message.tool_calls:
                                print(f"   🔧 {call['name']}({call['args']})")

                        # ② 工具跑完了
                        elif isinstance(message, ToolMessage):
                            self._break_line()
                            print(f"   📦 {message.name} -> {message.content}")

                        # ③ 其他情况（比如模型说完的完整版）→ 自动跳过

        # ───── 循环结束后（注意缩进！）─────
        self._break_line()

        if self.show_stats:
            elapsed = time.perf_counter() - start
            print(f"\n   [统计] {n_chunk} 块 / {n_char} 字 / 共 {elapsed:.1f} 秒")

        return "".join(pieces)