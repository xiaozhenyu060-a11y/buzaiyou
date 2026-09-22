"""入口：自检 -> 建 agent -> 干活。"""
from core.agent_builder import build_agent                                                                                 
from core.preflight import preflight
from core.stream_printer import StreamPrinter

if __name__ == "__main__":
    
    preflight()

    config = {"configurable": {"thread_id": "typing_001"}}
    agent = build_agent()
    stream = StreamPrinter(config,agent)

    print("💬 输入问题，回车发送。输入 /help 看命令，/quit 退出。\n")
    while True:
        try:
            question = input("你 > ").strip()

        except (EOFError, KeyboardInterrupt):
            print()
            break 
        if not question:
            continue      
        answer = stream.ask(question)
        if answer is None:                    # 空字符串 = 要退出
            print("👋 再见")
            break
        
