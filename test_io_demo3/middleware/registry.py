"""中间件注册表（带显式优先级）。

原来的实现是 `_MIDDLEWARE.append(func)`，于是**中间件顺序 = import 副作用顺序**——
`middleware/__init__.py` 里谁先被 import 谁就在外层，改一个 import 顺序就能
把权限检查挤到日志外面。这是隐藏的、review 不出来的耦合。

现在改成显式优先级：数字小的在外层，未指定走 DEFAULT_PRIORITY，同优先级按注册先后。
真实顺序可以用 `describe_middleware()` 打印出来自检。
"""
from __future__ import annotations

from typing import Any

#: 常用的层位常量（数字小的在外层）
PRIORITY_LOGGING = 10        # 日志/计时：最外层，连"被权限拦掉"的调用也能记到
PRIORITY_CONTEXT = 20        # 上下文治理：只改请求视图
PRIORITY_PERMISSION = 30     # 权限审查：贴着真正执行的那一层
PRIORITY_DEFAULT = 50

_MIDDLEWARE: list[tuple[int, int, Any]] = []
_SEQ = 0


def register_middleware(func=None, *, priority: int = PRIORITY_DEFAULT):
    """装饰器：把中间件（含顺序）登记到注册表。

    用法：
        @register_middleware                       # 用默认优先级
        @register_middleware(priority=10)          # 指定优先级
    """

    def _add(target):
        global _SEQ
        _MIDDLEWARE.append((int(priority), _SEQ, target))
        _SEQ += 1
        return target

    if func is None:
        return _add
    return _add(func)


def get_middleware() -> list:
    """按 (优先级, 注册序) 排序后返回中间件实例列表。"""
    return [item for _, _, item in sorted(_MIDDLEWARE, key=lambda row: (row[0], row[1]))]


def describe_middleware() -> list[tuple[int, str]]:
    """(优先级, 名字) 列表，按真实生效顺序排列 —— 用来在日志里自检嵌套层次。"""
    out = []
    for priority, _, item in sorted(_MIDDLEWARE, key=lambda row: (row[0], row[1])):
        # 显式分支，不用 `getattr(...) or ...`：后者在属性存在但值不是字符串时
        # （例如某个对象把 __name__ 设成了非字符串）会静默走错分支。
        name = item.__name__ if isinstance(getattr(item, "__name__", None), str) else None
        out.append((priority, name or type(item).__name__))
    return out


def clear_middleware() -> None:
    """测试用：清空注册表，避免跨用例污染。"""
    global _SEQ
    _MIDDLEWARE.clear()
    _SEQ = 0
