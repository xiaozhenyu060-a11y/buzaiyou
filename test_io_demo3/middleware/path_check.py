"""文件读取的前置合规检查。

调用方语义（保持向后兼容）：
    status, reason = check_path(Path(...))
      "blocked" —— 直接拒绝（敏感后缀、不存在、不是文件、符号链接越界）
      "ask"     —— 不在白名单，需要问用户
      "allow"   —— 在白名单，直接放行

本轮修掉的三处：
  1. 白名单原来硬编码 + 塞了个 `expanduser("~/Documents")`，
     在 Windows 上等于把 C:\\Users\\<你>\\Documents 整个目录悄悄放行。
     现在白名单只来自 Config.ALLOWED_ROOTS（环境变量显式声明的）。
  2. `resoleve.relative_to(root)` 的真值判断：relative_to 返回 `PosixPath('.')` 时
     虽然为真，但"是否在根内"语义上只能靠**有没有抛 ValueError** 判断。
  3. 不校验符号链接 —— junction / symlink 可以指向白名单外的真实文件，
     字符串层面看路径还在白名单里。现在用 realpath 做二次比对，越界直接 blocked。
"""
from __future__ import annotations

import os
from pathlib import Path

from config import Config


def _allowed_roots() -> list[Path]:
    """当前生效的白名单根目录（已 realpath 化，便于和真实路径做前缀比对）。"""
    return [Path(os.path.realpath(os.path.expanduser(root))) for root in Config.ALLOWED_ROOTS]


def _is_inside(path: Path, root: Path) -> bool:
    """path 是否位于 root 之内（含 root 自身）。只看异常，不看返回值真值。"""
    try:
        path.relative_to(root)
    except ValueError:
        return False
    return True


def _is_sensitive(path: Path) -> bool:
    """是否属于高敏感文件。

    注意：`Path(".env").suffix == ""` —— 点文件（.env / .pem 之外如 .npmrc）
    用后缀判断会全部漏掉，所以这里额外比对完整文件名。
    """
    if path.suffix.lower() in Config.BLOCKED_EXTENSIONS:
        return True
    return path.name.lower() in Config.BLOCKED_EXTENSIONS


def check_path(path: Path, expect: str = "file") -> tuple[str, str]:
    """检查权限合规 + 路径存在性。返回 (状态, 说明)。

    expect：
      "file" —— 调用方要读文件（list_dir 之外的场景）
      "dir"  —— 调用方要列目录

    为什么要这个参数：原来无脑要求 `is_file()`，于是 list_dir 传进来的目录
    永远卡在"非文件类型"上 —— 100% 被拒，且理由完全误导。
    """
    path = Path(path)
    if not str(path).strip():
        return "blocked", "空路径"

    try:
        resolved = path.resolve(strict=False)
    except OSError as error:  # 超长路径、非法字符等
        return "blocked", f"路径无法解析：{error}"

    # 高敏感文件：无论在哪都直接拦（.env 这种没有后缀的点文件靠名字比对）
    if _is_sensitive(resolved):
        return "blocked", f"高敏感文件：{resolved.name}"

    # 符号链接 / junction 检查：resolve() 已展开真实路径，
    # 再和 realpath 比一次，防止"白名单内有个软链指向白名单外的敏感文件"。
    real = Path(os.path.realpath(resolved))
    if real != resolved:
        inside = any(_is_inside(real, root) for root in _allowed_roots())
        if not inside:
            return "blocked", f"符号链接指向白名单之外：{resolved.name} -> {real}"

    # 存在性 + 类型：按调用方的期待判，而不是一律要求"是文件"
    if not resolved.exists():
        return "blocked", (
            f"目录不存在：{resolved}" if expect == "dir" else f"文件不存在：{resolved}"
        )

    if expect == "dir":
        if not resolved.is_dir():
            return "blocked", f"不是目录：{resolved}（如果是文件请用 read_file）"
    elif not resolved.is_file():
        return "blocked", f"非文件类型：{resolved}（如果是目录请用 list_dir）"

    for root in _allowed_roots():
        if _is_inside(resolved, root) or _is_inside(real, root):
            return "allow", ""

    return "ask", f"不在白名单：{resolved.name}"
