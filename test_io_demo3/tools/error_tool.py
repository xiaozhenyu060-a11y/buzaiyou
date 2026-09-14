from langchain.tools import tool
from tools.registry import register_tool

@register_tool
@tool
def trigger_error() -> str:
    """测试用工具-故意抛出异常，用来验证错误处理"""
    raise ValueError("这是故意制造的测试错误")

