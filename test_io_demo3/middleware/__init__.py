"""中间件包：import 即注册。

顺序不再由这个文件的 import 先后决定 —— 每个中间件自带 priority
（见 middleware/registry.py 的 PRIORITY_* 常量），get_middleware() 会排序。
这里 import 什么就注册什么，顺序无关，可以放心重排。
"""
from middleware.log_tool_call import log_tool_call  # noqa: F401  priority=10
from middleware.context_edit import context_edit_middleware  # noqa: F401  priority=20
from middleware.file_permission import file_permission  # noqa: F401  priority=30

__all__ = ["log_tool_call", "context_edit_middleware", "file_permission"]
