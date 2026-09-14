from langgraph.checkpoint.memory import MemorySaver
from langchain_deepseek import ChatDeepSeek
from langchain.agents import create_agent

from config import Config
from middleware.registry import get_middleware
from tools.registry import get_tools


def build_agent():
    """创建agent,封装所有组装逻辑"""
    llm = ChatDeepSeek(
        model=Config.MODEL,
        temperature=Config.TEMPERATURE,
        api_key=Config.API_KEY
)

    checkpointer = MemorySaver()

    return create_agent(
        model=llm,
        tools=get_tools(),
        middleware=get_middleware(),
        checkpointer= checkpointer,
        system_prompt=Config.SYSTEM_PROMPT,
    )

