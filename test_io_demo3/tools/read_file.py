"""读取指定文件的内容。

"""
from pathlib import Path

from langchain.tools import tool

from tools.registry import register_tool

# 回退编码顺序：UTF-8 优先，其次简体中文 / Windows 常见编码
_FALLBACK_ENCODINGS = ("utf-8", "utf-8-sig", "gb18030")


@register_tool
@tool
def read_file(file_path: str, max_chars: int = 5000) -> str:
    """读取指定文件的内容。

    参数:
    - file_path: 文件的绝对路径，例如 'D:/pyhc/pythonn/test.py'
    - max_chars: 最多读取的字符数，默认 5000，防止文件过大撑爆上下文
    """
    path = Path(file_path)

    if max_chars <= 0:
        return f"❌ max_chars 必须为正整数，当前 {max_chars}"

    # 目录要先判：在 Windows 上 open() 一个目录可能抛的是 PermissionError，
    # 那样提示会变成"没有权限读取"，把"你给的是目录"这个真正原因盖掉。
    if path.is_dir():
        return f"❌ 这是一个目录，不是文件：{path}（要列目录请用 list_dir）"

    content: str | None = None
    used_encoding = ""
    last_error: Exception | None = None

    for encoding in _FALLBACK_ENCODINGS:
        try:
            with path.open("r", encoding=encoding) as handle:
                content = handle.read(max_chars)
            used_encoding = encoding
            break
        except UnicodeDecodeError as error:
            last_error = error
            continue
        except PermissionError:
            return f"❌ 没有权限读取：{path}"
        except FileNotFoundError:
            return f"❌ 文件不存在：{path}"
        except IsADirectoryError:
            return f"❌ 这是一个目录，不是文件：{path}"
        except OSError as error:
            return f"❌ 读取失败：{error}"

    if content is None:
        tried = "/".join(_FALLBACK_ENCODINGS)
        return f"❌ 文件不是可识别的文本编码（已尝试 {tried}）：{last_error}"

    # 按字符数判断是否被截断（原来比的是字节数，中文场景会误报）
    if len(content) >= max_chars and max_chars > 0:
        try:
            total_chars: str = str(len(path.read_text(encoding=used_encoding, errors="replace")))
        except OSError:
            total_chars = "≥" + str(max_chars)
        content += (
            f"\n\n...（文件共 {total_chars} 字符，仅显示前 {max_chars} 字符，编码 {used_encoding}）"
        )

    if used_encoding not in ("utf-8", "utf-8-sig"):
        content = f"[编码 {used_encoding}]\n{content}"

    return content
