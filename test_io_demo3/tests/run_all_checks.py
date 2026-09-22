"""一句话全量自检：把项目里所有功能都真跑一遍，最后只报「哪里坏了」。

    python tests\run_all_checks.py

设计原则：
  * 一条命令跑完，不需要 pytest、不需要 API key
  * 每一项都真调真的函数，不 mock
  * 最后打印一张「通过 / 有问题」的表，一眼看完
"""
from __future__ import annotations

import io
import os
import sys
import traceback
from contextlib import redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# 让 .env 不干扰测试：白名单固定成项目目录
os.environ.setdefault("IO_OX_SKIP_MODEL_IMPORT", "0")

from config import Config  # noqa: E402

Config.ALLOWED_ROOTS = [str(ROOT)]

RESULTS: list[tuple[str, bool, str]] = []


def check(name: str, fn) -> None:
    """跑一项检查，记录通过/失败，不中断后面的。"""
    try:
        detail = fn() or ""
        RESULTS.append((name, True, str(detail)))
    except Exception as error:  # noqa: BLE001 —— 这里就是要抓所有问题
        short = f"{type(error).__name__}: {error}"
        RESULTS.append((name, False, short))
        if os.environ.get("CHECK_VERBOSE"):
            traceback.print_exc()


WIN = Path(os.environ.get("WINDIR", r"C:\Windows"))
OUTSIDE_FILE = WIN / "win.ini"


# ────────────────────────── 配置层 ──────────────────────────
def c_config_validate() -> str:
    warns = Config.validate(require_api_key=False)
    return f"{len(warns)} 条提醒"


def c_model_name() -> str:
    prof = Config.model_profile()
    if not prof:
        raise AssertionError(f"模型名 {Config.MODEL!r} 查不到 profile（应为 deepseek-v4-flash）")
    return f"{Config.MODEL} 窗口={prof.get('max_input_tokens')}"


def c_context_window() -> str:
    w = Config.context_window()
    assert w >= 32_000, f"窗口只有 {w}，明显不对"
    return f"{w} token"


# ────────────────────────── 路径检查层 ──────────────────────────
def c_blocked_sensitive() -> str:
    from middleware.path_check import check_path

    for name in (".env", "server.pem", "a.key", "b.pfx"):
        status, reason = check_path(ROOT / name)
        assert status == "blocked", f"{name} 应该 blocked，实际 {status}（{reason}）"
    return "4 种敏感文件全部拦住"


def c_blocked_missing() -> str:
    from middleware.path_check import check_path

    status, _ = check_path(ROOT / "绝对不存在的文件.txt")
    assert status == "blocked", f"缺失文件应 blocked，实际 {status}"
    return "缺失文件拦住"


def c_whitelist_in() -> str:
    from middleware.path_check import check_path

    status, reason = check_path(ROOT / "config.py")
    assert status == "allow", f"白名单内文件应 allow，实际 {status}（{reason}）"
    return "白名单内 -> allow"


def c_whitelist_out() -> str:
    from middleware.path_check import check_path

    status, reason = check_path(OUTSIDE_FILE)
    assert status == "ask", f"白名单外应 ask，实际 {status}（{reason}）"
    return "白名单外 -> ask（会问你）"


def c_whitelist_empty() -> str:
    from middleware.path_check import check_path

    saved = Config.ALLOWED_ROOTS
    Config.ALLOWED_ROOTS = []
    try:
        status, _ = check_path(ROOT / "config.py")
        assert status == "ask", f"白名单为空时不该 allow，实际 {status}"
    finally:
        Config.ALLOWED_ROOTS = saved
    return "白名单为空 -> 一律 ask"


def c_dir_expect() -> str:
    from middleware.path_check import check_path

    status, reason = check_path(ROOT, expect="dir")
    assert status == "allow", f"白名单内目录应 allow，实际 {status}（{reason}）"
    status, reason = check_path(ROOT, expect="file")
    assert status == "blocked" and "list_dir" in reason, f"目录传给 read_file 应被拦：{reason}"
    status, _ = check_path(WIN, expect="dir")
    assert status == "ask", f"白名单外目录应 ask，实际 {status}"
    return "目录/文件分别判定正确"


# ────────────────────────── 工具层 ──────────────────────────
def c_tools_registered() -> str:
    import tools  # noqa: F401  触发注册
    from tools.registry import assert_tools_loaded

    names = assert_tools_loaded(
        {"read_file", "list_dir", "grep_file", "get_current_date", "trigger_error"}
    )
    return f"{len(names)} 个：{', '.join(sorted(names))}"


def c_tool_duplicate() -> str:
    from tools.registry import _TOOLS, register_tool

    def _probe():
        return "x"

    register_tool(_probe)
    try:
        try:
            register_tool(_probe)
        except ValueError:
            return "重名被拦住"
        raise AssertionError("重名居然没报错")
    finally:
        if _probe in _TOOLS:
            _TOOLS.remove(_probe)


def c_date_tool() -> str:
    from tools.date_tool import get_current_date

    v = get_current_date.invoke({})
    v = getattr(v, "content", v)
    assert len(v) == 10 and v[4] == "-", f"日期格式不对：{v!r}"
    return str(v)


def c_read_file_utf8() -> str:
    from tools.read_file import read_file

    text = read_file.invoke({"file_path": str(ROOT / "config.py")})
    assert "Config" in text, "读不到 config.py 的内容"
    return f"{len(text)} 字符"


def c_read_file_chars() -> str:
    from tools.read_file import read_file

    target = ROOT / "middleware" / "context_edit.py"
    text = read_file.invoke({"file_path": str(target), "max_chars": 100})
    real_chars = len(target.read_text(encoding="utf-8"))
    real_bytes = target.stat().st_size
    assert f"共 {real_chars} 字符" in text, f"应按字符报 {real_chars}：{text[-70:]!r}"
    assert f"共 {real_bytes} 字符" not in text, "把字节当字符报了"
    return f"按字符报数（{real_chars} 字符 / {real_bytes} 字节）"


def c_read_file_errors() -> str:
    from tools.read_file import read_file

    a = read_file.invoke({"file_path": str(ROOT / "无此文件.txt")})
    assert "不存在" in a, f"缺失文件提示不对：{a!r}"
    b = read_file.invoke({"file_path": str(ROOT), "max_chars": 0})
    assert "max_chars" in b, f"非法参数提示不对：{b!r}"
    c = read_file.invoke({"file_path": str(ROOT), "max_chars": 10})
    assert "目录" in c, f"目录提示不对：{c!r}"
    return "3 种错误提示都正常"


def c_list_dir() -> str:
    from tools.list_dir import list_dir

    out = list_dir.invoke({"dir_path": str(ROOT), "max_entries": 5})
    assert "[DIR ]" in out or "[FILE]" in out, f"没列出内容：{out[:80]!r}"
    assert "仅显示前 5 项" in out, f"应提示只显示前 5 项：{out[:80]!r}"

    bad = list_dir.invoke({"dir_path": str(ROOT / "无此文件夹")})
    assert "不存在" in bad, f"缺失目录提示不对：{bad!r}"

    notdir = list_dir.invoke({"dir_path": str(ROOT / "config.py")})
    assert "不是目录" in notdir, f"给文件时应提示不是目录：{notdir!r}"
    return "列出正常 + 2 种错误提示正常"


def c_error_tool() -> str:
    from tools.error_tool import trigger_error

    try:
        trigger_error.invoke({})
    except Exception:
        return "如期抛错（验证错误处理链路）"
    raise AssertionError("trigger_error 竟然没抛错")


# ────────────────────────── 中间件层 ──────────────────────────
def c_middleware_order() -> str:
    import middleware  # noqa: F401  触发注册
    from middleware.registry import describe_middleware

    order = describe_middleware()
    prios = [p for p, _ in order]
    assert prios == sorted(prios), f"未按优先级排序：{order}"
    names = [n for _, n in order]
    assert "log_tool_call" in names and "file_permission" in names, f"缺少中间件：{order}"
    return " > ".join(f"{p}:{n}" for p, n in order)


def c_grep_file() -> str:
    from tools.grep_file import grep_file

    out = grep_file.invoke({"pattern": "class Config", "path": str(ROOT)})
    assert "config.py:" in out, f"应该搜到 config.py 里的 class Config：{out[:120]!r}"

    empty = grep_file.invoke({"pattern": "", "path": str(ROOT)})
    assert "不能为空" in empty, f"空 pattern 应被拦：{empty!r}"

    bad = grep_file.invoke({"pattern": "[unclosed", "path": str(ROOT)})
    assert "正则" in bad, f"坏正则应给可读提示：{bad!r}"

    missing = grep_file.invoke({"pattern": "x", "path": str(ROOT / "无此目录")})
    assert "不存在" in missing, f"缺失路径应被拦：{missing!r}"

    capped = grep_file.invoke({"pattern": "e", "path": str(ROOT)})
    assert "已达上限" in capped, "海量命中的时候必须提示结果不完整"

    # 敏感文件不该被搜出来（包括 .env.example 这种变体）
    secret = grep_file.invoke({"pattern": "DEEPSEEK_API_KEY", "path": str(ROOT)})
    for leaked in (".env:", ".env.example", ".env.bak"):
        assert leaked not in secret, f"敏感文件 {leaked} 不该被扫进来：{secret[:200]!r}"

    return "正常搜索 + 4 类边界 + 敏感文件过滤"


def c_permission_map() -> str:
    from middleware.file_permission import _permission_mode

    assert _permission_mode("get_current_date") == "none", "无副作用工具应放行"
    assert _permission_mode("read_file") == "read", "read_file 应是 read"
    assert _permission_mode("list_dir") == "read", "list_dir 应是 read"
    assert _permission_mode("write_file") == "write", "write_file 应是 write"
    assert _permission_mode("从没见过的工具") == "ask", "未登记工具应默认 ask"
    return "none/read/write/ask 四类判定正确"


def c_context_trigger() -> str:
    from middleware.context_edit import (
        _compute_trigger,
        context_edit_middleware,
        refresh_context_edit_trigger,
    )

    base = _compute_trigger()
    os.environ["CONTEXT_EDIT_TRIGGER"] = "1234"
    try:
        assert refresh_context_edit_trigger() == 1234, "refresh 没生效"
        assert context_edit_middleware.edits[0].trigger == 1234, "中间件实例没更新"
    finally:
        os.environ.pop("CONTEXT_EDIT_TRIGGER", None)
        refresh_context_edit_trigger()
    assert _compute_trigger() == base, "去掉覆盖没回到默认值"
    excluded = list(context_edit_middleware.edits[0].exclude_tools)
    assert "read_file" in excluded, f"read_file 应默认不被清理：{excluded}"
    return f"默认触发点 {base} token，可动态刷新"


def c_agent_buildable() -> str:
    """能不能建出 agent（不需要 API key）—— 抓"工具/中间件装不上"这类问题。"""
    from core.agent_builder import build_agent

    buf = io.StringIO()
    with redirect_stdout(buf):
        agent = build_agent()
    return type(agent).__name__


# ────────────────────────── 跑起来 ──────────────────────────
def main() -> int:
    checks = [
        ("配置：校验清单能跑", c_config_validate),
        ("配置：模型名能查到 profile", c_model_name),
        ("配置：窗口大小合理", c_context_window),
        ("路径：敏感文件全部拦住", c_blocked_sensitive),
        ("路径：缺失文件拦住", c_blocked_missing),
        ("路径：白名单内 allow", c_whitelist_in),
        ("路径：白名单外 ask", c_whitelist_out),
        ("路径：白名单为空则全 ask", c_whitelist_empty),
        ("路径：目录/文件分别判定", c_dir_expect),
        ("工具：全部注册成功", c_tools_registered),
        ("工具：重名被拦", c_tool_duplicate),
        ("工具：日期能返回", c_date_tool),
        ("工具：读文件(UTF-8)", c_read_file_utf8),
        ("工具：读文件按字符截断", c_read_file_chars),
        ("工具：读文件 3 种错误提示", c_read_file_errors),
        ("工具：列目录正常", c_list_dir),
        ("工具：grep 搜索", c_grep_file),
        ("工具：故意报错工具", c_error_tool),
        ("中间件：优先级顺序", c_middleware_order),
        ("中间件：权限映射四类", c_permission_map),
        ("中间件：触发点可刷新", c_context_trigger),
        ("组装：agent 能建出来", c_agent_buildable),
    ]

    print("=" * 72)
    print(f"全量自检  ·  {len(checks)} 项  ·  项目 {ROOT}")
    print("=" * 72)

    for name, fn in checks:
        check(name, fn)

    width = max(len(n) for n, _, _ in RESULTS)
    failed = 0
    print()
    for name, ok, detail in RESULTS:
        mark = "OK  " if ok else "FAIL"
        if not ok:
            failed += 1
        print(f"  [{mark}] {name:<{width}}  {detail}")

    print()
    print("=" * 72)
    if failed:
        print(f"结果：{len(RESULTS) - failed}/{len(RESULTS)} 通过，{failed} 项有问题")
    else:
        print(f"结果：全部 {len(RESULTS)} 项通过 ✅")
    print("=" * 72)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
