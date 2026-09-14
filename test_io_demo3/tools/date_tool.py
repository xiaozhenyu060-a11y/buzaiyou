import datetime
from langchain.tools import tool
from tools.registry import register_tool


@register_tool
@tool
def get_current_date():
    """工具-获取今天的日期"""
    return datetime.datetime.today().strftime("%Y-%m-%d")