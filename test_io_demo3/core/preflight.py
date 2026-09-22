"""启动前自检：配置 -> 工具 -> 中间件，一次性把问题全列出来。
"""
from __future__ import annotations

import warnings

from config import Config
from middleware.registry import describe_middleware
from tools.registry import assert_tools_loaded

#: 期望必须注册成功的工具名（漏 import 会在这里被抓住）
EXPECTED_TOOLS = {"read_file", "list_dir", "grep_file", "get_current_date", "trigger_error"}


def print_roots() -> None:
    """打印当前生效的读白名单。"""
    roots = Config.ALLOWED_ROOTS or []
    print(f"  读白名单：{'; '.join(roots) if roots else '(空 — 每次读取都会问你要确认)'}")


def preflight(exit_on_error: bool = True) -> None:
    """启动自检：配置 -> 工具 -> 中间件，全部问题一次性列出。"""
    print("── 启动自检 " + "─" * 50)

    # 1) 配置：模型名查不到 profile、温度越界、窗口 <= 安全余量……
    for note in Config.validate():
        warnings.warn(note, stacklevel=2)

    # 2) 工具：漏 import 会静默消失，这里直接失败
    names = assert_tools_loaded(EXPECTED_TOOLS)
    print(f"  工具({len(names)})：{', '.join(names)}")

    # 3) 中间件：顺序以前靠 import 先后，现在打出来眼见为实
    print("  中间件（数字小的在外层）：")
    for priority, name in describe_middleware():
        print(f"    {priority:>3}  {name}")

    print(f"  模型：{Config.MODEL}  窗口：{Config.context_window()} token")
    print_roots()
    print("─" * 62)