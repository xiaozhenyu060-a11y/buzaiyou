"""文件 / 目录读取的权限闸门。
显式权限表：
  * READ_TOOLS   —— 走 read 审查（白名单 / 问用户）
  * WRITE_TOOLS  —— 走 write 审查（比读更严：无论在哪都要人工确认）
  * 未登记的工具 —— 默认按最严处理（ask），绝不放行
"""
from __future__ import annotations

from pathlib import Path

from langchain.agents.middleware import wrap_tool_call
from langchain_core.messages import ToolMessage

from middleware.path_check import check_path
from middleware.registry import PRIORITY_PERMISSION, register_middleware

#: 只读类工具：工具名 -> 权限模式
READ_TOOLS: dict[str, str] = {
    "read_file": "read",
    "list_dir": "read",
    "grep_file": "read",
}

#: 这些工具期望的目标是**目录**（不是文件）。
#: 少了这张表，list_dir 传进来的目录会被 check_path 判成"非文件类型"直接拒掉。
#: grep_file 既能收文件也能收目录 —— 所以走 expect="any"（见下面的 DIR_TOOLS / ANY_TOOLS）。
DIR_TOOLS: frozenset[str] = frozenset({"list_dir"})

#: 目标既可以是文件也可以是目录的工具：check_path 不做类型判定，只看白名单与敏感与否
ANY_TOOLS: frozenset[str] = frozenset({"grep_file"})

#: 写类工具：一律人工确认，不看白名单
WRITE_TOOLS: dict[str, str] = {
    "write_file": "write",
}

#: 明确无需文件权限的工具（纯计算、无副作用）
NO_PERMISSION_TOOLS: frozenset[str] = frozenset({"get_current_date", "trigger_error"})

#: 不在任何表里的工具：默认按最严处理
UNKNOWN_TOOL_MODE = "ask"

#: 不同工具用不同的形参名指向"要操作的那个路径"。
#: read_file 用 file_path，list_dir 用 dir_path，以后 write_file 可能用 target……
#: 只认一个名字，另一个工具就会永远"读不到路径参数"，
#: 而模型看到那句错误信息后会以为"路径写法不对"，于是反复换写法重试 —— 白烧钱。
PATH_ARG_NAMES: tuple[str, ...] = ("file_path", "dir_path", "path", "target", "src", "dst")

#: 同一个工具连续失败多少次后，直接在错误信息里明确叫停，别再让它瞎试
MAX_CONSECUTIVE_FAILS = 3

#: 工具名 -> 连续失败次数（进程内计数，不需要持久化）
_FAIL_STREAK: dict[str, int] = {}

#: 这些工具要求"人工确认"时使用哪套文案
_ACTION_LABEL = {
    "read": "读取",
    "write": "写入",
    "ask": "调用",
}


def _extract_path(tool_args: dict) -> str:
    """从工具参数里找出"要操作的那个路径"。

    为什么不能写死 `tool_args.get("file_path")`：
      list_dir 的形参叫 dir_path，只找 file_path 会拿到空字符串，
      于是 list_dir 永远被判成"没有路径参数"而拒绝 —— 工具彻底不可用。
    """
    for name in PATH_ARG_NAMES:
        value = tool_args.get(name)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _reject(tool_name: str, tool_id: str, reason: str) -> ToolMessage:
    return ToolMessage(
        content=f"工具调用被拒绝：{reason}",
        tool_call_id=tool_id,
        name=tool_name,
    )


def _permission_mode(tool_name: str) -> str:
    """返回该工具的权限模式：read / write / none / ask（未知工具）。"""
    if tool_name in NO_PERMISSION_TOOLS:
        return "none"
    if tool_name in READ_TOOLS:
        return READ_TOOLS[tool_name]
    if tool_name in WRITE_TOOLS:
        return WRITE_TOOLS[tool_name]
    return UNKNOWN_TOOL_MODE


def _reject(tool_name: str, tool_id: str, reason: str) -> ToolMessage:
    return ToolMessage(
        content=f"工具调用被拒绝：{reason}",
        tool_call_id=tool_id,
        name=tool_name,
    )


@register_middleware(priority=PRIORITY_PERMISSION)
@wrap_tool_call
def file_permission(request, handler):
    tool_name = request.tool_call["name"]
    tool_id = request.tool_call["id"]
    tool_args = request.tool_call.get("args") or {}

    mode = _permission_mode(tool_name)

    # 情况 0：无副作用工具，直接放行
    if mode == "none":
        return handler(request)

    file_path = _extract_path(tool_args)

    # 情况 0b：未登记的工具 —— 不猜，先问
    if mode == "ask":
        reason = f"工具 {tool_name} 没有登记权限级别（middleware/file_permission.py）"
    elif not file_path:
        # 连续失败太多次就直接叫停 —— 错误信息是写给模型看的，
        # 必须明确告诉它"这不是路径写法的问题"，否则它会一直换写法重试。
        streak = _FAIL_STREAK.get(tool_name, 0) + 1
        _FAIL_STREAK[tool_name] = streak
        stop_hint = (
            f" 这已经是第 {streak} 次连续失败，请停止重试，"
            f"改用其它工具或把你的困难直接告诉用户。"
            if streak >= MAX_CONSECUTIVE_FAILS
            else ""
        )
        return _reject(
            tool_name,
            tool_id,
            f"{tool_name} 的参数里找不到路径（检查过：{'、'.join(PATH_ARG_NAMES)}），"
            f"实际收到的参数是 {list(tool_args.keys()) or '（空）'}。"
            f"这是工具/权限配置的问题，换个路径写法也不会成功。{stop_hint}",
        )
    else:
        status, reason = check_path(
            Path(file_path),
            expect=(
                "dir"
                if tool_name in DIR_TOOLS
                else "any"
                if tool_name in ANY_TOOLS
                else "file"
            ),
        )
        # 情况 1：直接拒绝（敏感文件、不存在、不是文件、软链越界）
        if status == "blocked":
            return _reject(tool_name, tool_id, f"{_ACTION_LABEL.get(mode, mode)}被拒绝：{reason}")
        # 情况 3：白名单内 —— 直接放行（读）；写操作即使白名单内也要确认
        if status == "allow" and mode == "read":
            _FAIL_STREAK.pop(tool_name, None)  # 成功了，清零
            return handler(request)
        if status == "allow" and mode == "write":
            reason = f"写操作即使在白名单内也需要确认：{reason or file_path}"

    # 情况 2：需要人工确认
    verbose = {
        "read": "读取",
        "write": "写入",
        "ask": "调用",
    }.get(mode, mode)
    print(f"\n{'=' * 60}")
    print(f"⚠️  Agent 权限请求（{verbose}）：")
    print(f"    工具：{tool_name}")
    print(f"    路径：{file_path or '(无)'}")
    print(f"    {reason}")
    print(f"{'=' * 60}")

    while True:
        answer = input("是否允许？(y/n): ").strip().lower()
        if answer in ("y", "yes"):
            print("✅ 已允许，正在执行...\n")
            return handler(request)
        if answer in ("n", "no"):
            print("❌ 已拒绝。\n")
            return _reject(tool_name, tool_id, "用户拒绝了该请求。")
        print("请输入 y 或 n。")
