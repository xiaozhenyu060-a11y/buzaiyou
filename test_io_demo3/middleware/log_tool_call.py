"""工具调用日志中间件 —— 最外层。

优先级 PRIORITY_LOGGING：它在最外层，所以连"被权限层拦掉、根本没执行"的调用
也会留下日志。这个顺序以前是靠 import 先后碰运气得到的，现在写死在优先级里。
"""
from __future__ import annotations

import logging
import time

from langchain.agents.middleware import wrap_tool_call
from langchain_core.messages import ToolMessage

from middleware.registry import PRIORITY_LOGGING, register_middleware

logger = logging.getLogger(__name__)


@register_middleware(priority=PRIORITY_LOGGING)
@wrap_tool_call
def log_tool_call(request, handler):
    tool_name = request.tool_call["name"]
    tool_id = request.tool_call["id"]

    started = time.perf_counter()
    print(f"🔧 {tool_name}  开始执行----------")

    try:
        result = handler(request)
    except Exception as error:  # noqa: BLE001 —— 这里就是要兜住一切，转成 ToolMessage 回灌模型
        elapsed = (time.perf_counter() - started) * 1000
        print(f"🔧❌ {tool_name} 调用失败 ({elapsed:.0f}ms)--------{error}")
        logger.warning("工具 %s 调用失败：%r", tool_name, error, exc_info=True)
        return ToolMessage(
            content=f"工具调用失败:{error}",
            tool_call_id=tool_id,
            name=tool_name,
        )

    elapsed = (time.perf_counter() - started) * 1000
    print(f"🔧 {tool_name}  执行结束 ({elapsed:.0f}ms)--------")

    # 权限层拒绝时返回的是 ToolMessage，不是工具的真实返回 —— 单独标一下，
    # 否则日志里看起来"工具跑完了"，实际它压根没执行。
    if isinstance(result, ToolMessage) and str(result.content).startswith(
        ("文件读取被拒绝", "用户拒绝了", "工具调用被拒绝")
    ):
        print(f"🔧⛔ {tool_name} 被权限层拦截，未真正执行")

    return result
