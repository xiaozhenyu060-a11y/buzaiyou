"""入口：自检 -> 建 agent -> 干活。"""
from core.agent_builder import build_agent
from core.preflight import preflight
from core.trace_printer import TracePrinter


if __name__ == "__main__":
    preflight()

    agent = build_agent()
    resp = agent.invoke(
        {"messages": [{"role": "user", "content": "今天几号"}]},
        {"configurable": {"thread_id": "user_001"}},
    )
    TracePrinter.print_agent_trace(resp)