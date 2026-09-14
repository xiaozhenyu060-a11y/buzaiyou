import os
from langchain_deepseek import ChatDeepSeek
from langchain.agents import create_agent


llm = ChatDeepSeek(
    model='deepseek-v4-flash',
    temperature=0,
)

agetn = create_agent(
    model = llm,
    system_prompt="你是一个js逆向方面的专家"
)

resp = agetn.invoke({"messages":[{"role":"user","content":"你主要会什么"}]})
print(resp)