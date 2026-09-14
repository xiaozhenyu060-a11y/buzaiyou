"""文件 / 目录读取的权限闸门。

原来只有一个 `if tool_name != "read_file": return handler(request)`：
以后每加一个能碰文件系统的工具（write_file / list_dir / grep_file），
它都会**静默直通**，因为名字不等于 read_file。

现在改成显式权限表：
  * READ_TOOLS   —— 走 read 审查（白名单 / 问用户）
  * WRITE_TOOLS  —— 走 write 审查（比读更严：无论在哪都要人工确认）
  * 未登记的工具 —— 默认按最严处理（ask），绝不放行
这样"新加工具忘了配权限"的默认行为是**安全**的，而不是危险的。
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
}

#: 这些工具期望的目标是**目录**（不是文件）。
#: 少了这张表，list_dir 传进来的目录会被 check_path 判成"非文件类型"直接拒掉。
DIR_TOOLS: frozenset[str] = frozenset({"list_dir"})

#: 写类工具：一律人工确认，不看白名单
WRITE_TOOLS: dict[str, str] = {
    "write_file": "write",
}

#: 明确无需文件权限的工具（纯计算、无副作用）
NO_PERMISSION_TOOLS: frozenset[str] = frozenset({"get_current_date", "trigger_error"})

#: 不在任何表里的工具：默认按最严处理
UNKNOWN_TOOL_MODE = "ask"

#: 这些工具要求"人工确认"时使用哪套文案
_ACTION_LABEL = {
    "read": "读取",
    "write": "写入",
    "ask": "调用",
}


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

    file_path = tool_args.get("file_path") or tool_args.get("path") or ""

    # 情况 0b：未登记的工具 —— 不猜，先问
    if mode == "ask":
        reason = f"工具 {tool_name} 没有登记权限级别（middleware/file_permission.py）"
    elif not str(file_path).strip():
        return _reject(tool_name, tool_id, f"{tool_name} 没有可审查的路径参数")
    else:
        status, reason = check_path(
            Path(file_path), expect="dir" if tool_name in DIR_TOOLS else "file"
        )
        # 情况 1：直接拒绝（敏感文件、不存在、不是文件、软链越界）
        if status == "blocked":
            return _reject(tool_name, tool_id, f"{_ACTION_LABEL.get(mode, mode)}被拒绝：{reason}")
        # 情况 3：白名单内 —— 直接放行（读）；写操作即使白名单内也要确认
        if status == "allow" and mode == "read":
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
