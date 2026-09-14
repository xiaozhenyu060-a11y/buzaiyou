"""列出目录内容。

为什么现在加它：
    `file_permission.py` 的权限表里已经登记了 `list_dir`，但工具压根不存在 ——
    表里写着一个不存在的名字，等于给自己一个"权限都配好了"的错觉。
    另外，模型想看一个目录里有什么时，原来只能靠 read_file 去撞，
    撞到目录会返回"非文件类型"，然后它就会反复重试。

注意：这个工具同样会经过 `file_permission` 的 read 审查（白名单 / 人工确认）。
"""
from __future__ import annotations
 
from pathlib import Path

from langchain.tools import tool

from tools.registry import register_tool

#: 单次列出的最大条目数，防止超大目录把上下文冲爆
MAX_ENTRIES = 200


@register_tool
@tool
def list_dir(dir_path: str, max_entries: int = MAX_ENTRIES) -> str:
    """列出指定目录下的文件与子目录。

    参数:
    - dir_path: 目录的绝对路径，例如 'D:/pyhc/pythonn'
    - max_entries: 最多列出多少条，默认 200
    """
    path = Path(dir_path)             #把路径变成Path对象

    if not path.exists():
        return f"❌ 目录不存在：{path}"
    if not path.is_dir():
        return f"❌ 不是目录（如果是文件请用 read_file）：{path}"
    if max_entries <= 0:
        return f"❌ max_entries 必须为正整数，当前 {max_entries}"

    try:                   #path.iterdir()会把目录下的子项全部列出来
        entries = sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))    #is_file()判断是否是文件  ,    name.lower()全部为小写
    except PermissionError:
        return f"❌ 没有权限列出：{path}"
    except OSError as error:
        return f"❌ 列出失败：{error}"

    shown = entries[:max_entries]
    lines = []
    for entry in shown:
        if entry.is_dir():
            lines.append(f"[DIR ] {entry.name}/")
            continue
        try:
            size = entry.stat().st_size
        except OSError:
            size = -1
        lines.append(f"[FILE] {entry.name}  {size} B")

    header = f"{path}  ({len(entries)} 项"
    header += f"，仅显示前 {max_entries} 项)" if len(entries) > len(shown) else ")"
    if not lines:
        return f"{header}\n（空目录）"
    return header + "\n" + "\n".join(lines)
