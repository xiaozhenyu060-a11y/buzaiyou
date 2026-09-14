import os
import datetime

from langgraph.checkpoint.memory import MemorySaver
from tool_file import Toolkit
from langchain_deepseek import ChatDeepSeek
from langchain.agents import create_agent  
from langchain.agents.middleware import wrap_tool_call
from langchain_core.messages import ToolMessage

checkpointer = MemorySaver()  # 用内存存，重启会丢，适合开发调试

llm = ChatDeepSeek(
    model='deepseek-flash',
    temperature=0.5,
)

agetn = create_agent(
    model = llm,
    tools= Toolkit.get_tools(),
    middleware=Toolkit.get_middleware(),
    checkpointer=checkpointer,
    system_prompt="你是一个js逆向方面的专家"
)

config = {"configurable": {"thread_id": "user_001"}}
resp = agetn.invoke({"messages":[{"role":"user","content":"今天是星期几"}]},config)
Toolkit.print_agent_trace(resp)