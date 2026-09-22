from __future__ import annotations

import re
from pathlib import Path

from langchain.tools import tool

from config import Config
from tools.registry import register_tool


MAX_MATCHES = 200            # 最多返回多少条
MAX_LINE_CHARS = 300         # 每行最多显示多少字符
MAX_FILE_BYTES = 500_000     # 单个文件超过这个大小就跳过
MAX_FILES_SCANNED = 2_000    # 最多扫描多少个文件
MAX_PATTERN_CHARS = 200      # 正则不能太长

# ─────────── 这些目录直接跳过 ───────────
_SKIP_DIRS = frozenset({
    "__pycache__", ".git", ".venv", "venv", "node_modules",
    ".mypy_cache", ".pytest_cache", ".ruff_cache", ".idea", ".vscode",
})

def _is_sensitive(path: Path) -> bool:
    """敏感文件判断。

    两个坑（都是实际踩到的）：
      1. `Path('.env').suffix` 是空字符串 —— 必须同时比 name。
      2. `.env.example` / `.env.bak` 这种**变体**比精确匹配躲得过去 ——
         而它们往往也装着真钥匙（我就亲眼在 .env.example 里搜出过真实密钥）。
         所以名字以 `.env.` 开头的，一律当敏感处理。
    """
    name = path.name.lower()
    if name.startswith(".env"):
        return True
    return (
        path.suffix.lower() in Config.BLOCKED_EXTENSIONS
        or name in Config.BLOCKED_EXTENSIONS
    )

def _should_skip(path):
    """要不要跳过这个文件？返回 (跳过吗, 原因)。

    原因取值：skip_dir / sensitive / too_big / stat_failed —— 调用方按它分类统计。
    """
    if any(part in _SKIP_DIRS for part in path.parts):  #any 只有全部是假才返回假,只要有真就返回真
        return True,'skip_dir'                          #parts可以把路径打散,匹配关键词

    if _is_sensitive(path):
        return True,'sensitive'
    try:
        if path.stat().st_size > MAX_FILE_BYTES:
            return True, "too_big"
    except OSError:
        return True, "stat_failed"
    return False, ""
    


@register_tool
@tool
def grep_file(pattern, path): 
    """在文件或目录里搜索匹配的行（支持正则表达式）。

    参数:
    - pattern: 要搜索的内容。普通词（如 'Config'）或正则（如 'Config\\.[A-Z_]+'）都可以。
      注意：正则里的 [ ( ) * . \\ 等符号有特殊含义，想搜这些字符本身要加反斜杠转义。
    - path: 文件或目录的绝对路径。给目录时会递归搜索其下所有文件。

    返回格式为 '文件:行号: 内容' 的列表。会自动跳过 __pycache__/.git 等缓存目录、
    敏感文件（.env/.pem 等）以及超大文件。
    """
    if not pattern:                   #判断是否为空
        return 'pattern不能为空'

    if len(pattern) > MAX_PATTERN_CHARS:     # 判断搜索的关键词长度 有没有超过上限
        return f'pattern 太长{len(pattern)},上限{MAX_PATTERN_CHARS}'

    try:
        regex = re.compile(pattern,re.IGNORECASE)       #将关键词变为正则条件
    except re.error as error:                           #如果报错说明关键词有问题,让大模型修改重试
        return f"❌ 正则表达式写错了：{error}（如果想搜普通文字，试试转义特殊字符）"

    target = Path(path)               #将关键路径转换为PATH对象

    if not target.exists():             #判断target路径是否存在
        return(f'❌ 路径不存在:{target}') 

    if target.is_file():          #判断逻辑为如果是文件,就用.parent获取父类目录,candidates就是根目录
                                  #如果不是文件说明就是目录,在之后的逻辑里面就需要处理

        root = target.parent         #parent是PATH的属性,作用为获取当前路径的父类,返回一个新的 path对象
        candidates = [target]
    else:
        root = target
        candidates = []


    matches: list[str] = []
    scanned = 0
    skipped_big = 0
    skipped_other = 0

    file_iter = candidates if target.is_file() else target.rglob('*')
    #主要的逻辑为判断target是否是文件,如果是说明 本次查询的目标就在这个文件里面
    #如果判断为不是文件,那target就为目录,所以就用rglob获得target这个目录下的所有子项

    for p in file_iter:
        if scanned >=MAX_FILES_SCANNED:  #扫描的最大文件数量
            break

        if not p.is_file():
            continue

        skip,reason = _should_skip(p)

        if skip:
            if reason == 'too_big':          # elif 而不是 if —— 否则超大文件会被算两次
                skipped_big += 1
            elif reason != 'skip_dir':
                skipped_other += 1
            continue

        scanned +=1

        try:
            text = p.read_text(encoding='utf-8',errors='ignore')
        except (OSError, ValueError):
            continue

        for lineno,line in enumerate(text.splitlines(),start=1):
            if regex.search(line):
                shown = line.strip()[:MAX_LINE_CHARS]
                try:
                    rel = p.relative_to(root)
                except ValueError:
                    rel = p

                matches.append(f"{rel}:{lineno}:{shown}")
                if len(matches) >= MAX_MATCHES:
                    break
            if len(matches) >= MAX_MATCHES:
                break

    # ── 拼结果 ──
    if not matches:
        return f"没有找到匹配 {pattern!r} 的内容（扫描了 {scanned} 个文件）"

    header = f"在 {root} 下找到 {len(matches)} 处匹配 {pattern!r}（扫描 {scanned} 个文件）"
    if len(matches) >= MAX_MATCHES:
        header += f"\n⚠️ 已达上限 {MAX_MATCHES} 条，结果不完整 —— 建议缩小范围或换更具体的关键词"
    if skipped_big:
        header += f"\n（跳过 {skipped_big} 个超大文件，> {MAX_FILE_BYTES // 1000}KB）"
    if skipped_other:
        header += f"\n（跳过 {skipped_other} 个敏感/不可读文件）"

    return header + "\n\n" + "\n".join(matches)