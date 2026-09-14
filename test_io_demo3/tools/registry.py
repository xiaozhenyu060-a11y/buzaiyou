"""工具注册表。

保留原装饰器语义（`@register_tool`），另外补两件原来缺的：
  1. **重名检查**：两个工具撞名时 LangChain 侧表现是"顺序里第一个生效"，
     非常难查。现在注册期直接抛 ValueError。
  2. **缺失检测**：工具靠 `tools/__init__.py` 的 import 副作用注册，
     漏 import 一个文件就静默消失。`assert_tools_loaded()` 在启动期兜底。

实现说明：名字不用 getattr 猜，而是显式按
  BaseTool.name -> func.name -> func.__name__ -> 报错
的顺序解析；登记表同时维护"名字集合"，重名判定不再依赖对存储对象做 getattr。
"""
from __future__ import annotations

from typing import Any

_TOOLS: list[Any] = []
_NAMES: set[str] = set()


def _tool_name(func: Any) -> str:
    """解析工具名；解析不出来就直接报错，别让一个匿名对象悄悄进表。"""
    for attr in ("name", "__name__"):
        value = getattr(func, attr, None)
        if isinstance(value, str) and value.strip():
            return value.strip()
    raise TypeError(f"无法确定工具名（既没有 .name 也没有 __name__）：{func!r}")


def register_tool(func):
    """装饰器：把工具登记到注册表。重名直接报错，不要留到运行期。"""
    name = _tool_name(func)
    if name in _NAMES:
        raise ValueError(f"工具重名：{name!r} 已经注册过，检查 tools/__init__.py 的 import")
    _TOOLS.append(func)
    _NAMES.add(name)
    return func


def get_tools() -> list[Any]:
    return list(_TOOLS)


def assert_tools_loaded(expected: set[str] | None = None) -> list[str]:
    """启动期自检：返回所有已注册工具名；给了 expected 就校验一个都没漏。"""
    names = list(_NAMES)
    if expected is not None:
        missing = expected - _NAMES
        if missing:
            raise RuntimeError(
                f"这些工具没有注册成功（多半是 tools/__init__.py 漏了 import）：{sorted(missing)}"
            )
    return names


def clear_tools() -> None:
    """测试用：清空注册表。"""
    _TOOLS.clear()
    _NAMES.clear()
