"""回归测试：本轮 P0 修复的不变量。

不依赖 pytest，直接跑：
    python tests/test_p0_fixes.py

设计约束：**默认不需要写任何文件**。
样本优先用项目里已存在 + 系统自带的文件，所以在受限环境（无临时目录写权限、
只读挂载、企业策略锁 %TEMP%）里也能跑通 —— 测试失败应该意味着代码有问题，
而不是环境有问题。只有"编码回退"这一条需要落一个 GBK 文件，
不可写时降级为跳过（并打印生成命令）。

守的不变量：
  I1 高敏感后缀 / 不存在 / 目录 —— 一律 blocked，不问用户
  I2 白名单只认显式声明的根目录；白名单外是 ask，不是 allow
  I3 符号链接指向白名单之外时必须 blocked（原来会被字符串比较骗过去）
  I4 读文件不会静默乱码：非 UTF-8 文件走真实回退，并把编码回报出来
  I5 截断提示按"字符"而不是"字节"报数
  I6 工具重名必须报错，而不是让后注册的静默失效
  I7 中间件顺序由 priority 决定，与 import 先后无关
  I8 date_tool 能真的返回日期（原来的 AttributeError 回归防线）
  I9 上下文触发点不再在 import 期算死，改配置后 refresh 立即生效
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

# 控制台可能是 GBK（Windows 中文默认），测试里只输出中文/ASCII，不用 emoji，
# 并顺手把 stdout 切到 UTF-8，避免一条断言失败带出 UnicodeEncodeError。
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from config import Config  # noqa: E402
from middleware import path_check as pc  # noqa: E402
from middleware.registry import (  # noqa: E402
    PRIORITY_CONTEXT,
    PRIORITY_LOGGING,
    PRIORITY_PERMISSION,
    describe_middleware,
)
from tools.date_tool import get_current_date  # noqa: E402
from tools.read_file import read_file  # noqa: E402
from tools.registry import register_tool  # noqa: E402

SANDBOX = ROOT / "tests"  # 白名单：项目自身
OUTSIDE = Path(os.environ.get("WINDIR", r"C:\Windows"))  # 白名单外
OUTSIDE_FILE = OUTSIDE / "win.ini"
SAMPLES = Path(__file__).resolve().parent / "samples"
GBK_SAMPLE = SAMPLES / "gbk_sample.txt"

#: 生成 GBK 样本的等价命令（不可写时会打印出来让人手动跑）
GBK_SAMPLE_CMD = (
    f'python -c "import pathlib;p=pathlib.Path(r\'{SAMPLES}\');'
    "p.mkdir(parents=True,exist_ok=True);"
    "(p/'gbk_sample.txt').write_bytes('中文测试内容'.encode('gb18030'))\""
)

# 把白名单固定成项目目录，测试不受用户 .env 影响
Config.ALLOWED_ROOTS = [str(ROOT)]


def _as_text(result) -> str:
    """工具返回可能是 str 或 ToolMessage 内容，统一取文本。"""
    content = getattr(result, "content", result)
    return content if isinstance(content, str) else str(content)


def ensure_gbk_sample() -> Path | None:
    """确保存在一个**内容正确**的 GB18030 样本；不可写且内容不对时返回 None。"""
    if GBK_SAMPLE.exists():
        try:
            decoded = GBK_SAMPLE.read_text(encoding="gb18030")
        except UnicodeDecodeError:
            decoded = ""
        if "中文测试内容" in decoded:
            return GBK_SAMPLE
        # 存在但内容不是 GBK（可能被编辑器按 UTF-8 改写过）-> 下面重写

    try:
        SAMPLES.mkdir(parents=True, exist_ok=True)
        GBK_SAMPLE.write_bytes("中文测试内容".encode("gb18030"))
    except OSError:
        return None
    return GBK_SAMPLE


def test_blocked_cases() -> None:
    """I1：敏感后缀 / 不存在 / 目录 -> blocked"""
    status, reason = pc.check_path(ROOT / ".env")
    assert status == "blocked", f".env 应该是 blocked，实际 {status}（{reason}）"

    status, _ = pc.check_path(ROOT / "绝对不存在的文件.txt")
    assert status == "blocked", "不存在的文件应该 blocked"

    status, _ = pc.check_path(ROOT)
    assert status == "blocked", "目录应该 blocked"

    status, _ = pc.check_path(Path("   "))
    assert status == "blocked", "空路径应该 blocked"

    status, _ = pc.check_path(ROOT / "server.pem")
    assert status == "blocked", ".pem 应该 blocked"


def test_whitelist_in_and_out() -> None:
    """I2：白名单内 allow，白名单外 ask（不是 allow）"""
    target = ROOT / "config.py"
    assert target.is_file(), f"样本文件不存在，测试无法进行：{target}"

    status, reason = pc.check_path(target)
    assert status == "allow", f"白名单内应该 allow，实际 {status}（{reason}）"

    assert OUTSIDE_FILE.is_file(), f"缺少对照样本：{OUTSIDE_FILE}"
    status, reason = pc.check_path(OUTSIDE_FILE)
    assert status == "ask", f"白名单外应该 ask，实际 {status}（{reason}）"
    assert "白名单" in reason

    # 白名单为空时，谁都不能算 allow —— 这条守住"默认不放行"
    saved = Config.ALLOWED_ROOTS
    Config.ALLOWED_ROOTS = []
    try:
        status, _ = pc.check_path(target)
        assert status == "ask", f"白名单为空时不该 allow，实际 {status}"
    finally:
        Config.ALLOWED_ROOTS = saved


def test_symlink_escape_blocked() -> None:
    """I3：白名单内的软链指向外部 -> blocked（原来会被字符串比较骗过去）"""
    link = ROOT / "tests" / "_escape_probe.link"
    if link.is_symlink():
        link.unlink()
    try:
        os.symlink(OUTSIDE_FILE, link)
    except (OSError, NotImplementedError, PermissionError):
        print("     (跳过：本机不允许创建符号链接)")
        return
    try:
        status, reason = pc.check_path(link)
        assert status == "blocked", f"软链越界应该 blocked，实际 {status}（{reason}）"
        assert "符号链接" in reason, f"拒绝原因应说明是软链：{reason}"
    finally:
        try:
            link.unlink()
        except OSError:
            pass


def test_read_file_encoding() -> None:
    """I4：UTF-8 正常读，非 UTF-8 走真实回退（原来那个 except 是死分支）"""
    text = _as_text(read_file.invoke({"file_path": str(ROOT / "config.py")}))
    assert "Config" in text, f"UTF-8 读取失败：{text[:80]!r}"

    sample = ensure_gbk_sample()
    if sample is None:
        print("     (跳过 GBK 回退：目录不可写且样本缺失，手动生成命令)")
        print(f"     {GBK_SAMPLE_CMD}")
    else:
        text = _as_text(read_file.invoke({"file_path": str(sample)}))
        assert "中文测试内容" in text, f"编码回退失败（走了静默乱码路径）：{text[:80]!r}"
        assert "gb18030" in text, f"应该回报实际使用的编码：{text[:80]!r}"

    text = _as_text(read_file.invoke({"file_path": str(ROOT / "绝对没有这个文件.txt")}))
    assert "不存在" in text, f"缺文件应该给中文提示：{text!r}"

    text = _as_text(read_file.invoke({"file_path": str(ROOT), "max_chars": 0}))
    assert "max_chars" in text, f"非法 max_chars 应该被拦：{text!r}"

    text = _as_text(read_file.invoke({"file_path": str(ROOT), "max_chars": 10}))
    assert "目录" in text, f"传目录应该给明确提示：{text!r}"


def test_truncation_is_chars() -> None:
    """I5：截断提示按字符报，不是把字节数当成字符数"""
    target = ROOT / "middleware" / "context_edit.py"
    assert target.is_file(), f"缺少样本：{target}"

    text = _as_text(read_file.invoke({"file_path": str(target), "max_chars": 100}))
    assert "仅显示前 100 字符" in text, f"截断提示不对：{text[-80:]!r}"

    raw = target.read_bytes()
    real_bytes = len(raw)
    real_chars = len(raw.decode("utf-8"))
    assert real_chars != real_bytes, "样本选得不好：字符数恰好等于字节数，测不出区别"
    assert f"共 {real_chars} 字符" in text, (
        f"总数应按字符报 {real_chars}，实际提示：{text[-80:]!r}"
    )
    assert f"共 {real_bytes} 字符" not in text, "又把字节数当字符数报了"


def test_registry_duplicate_and_order() -> None:
    """I6/I7：重名报错 + 中间件顺序按 priority"""
    from tools.registry import _TOOLS

    def _dup_probe():  # pragma: no cover - 仅注册用
        return "probe"

    print(
        f"     [info] register_tool 来自 {getattr(register_tool, '__module__', '?')}"
        f"（本源文件 {getattr(getattr(register_tool, '__code__', None), 'co_filename', '?')}）"
    )

    register_tool(_dup_probe)
    print(f"     [info] 首次注册后共 {len(_TOOLS)} 个工具")
    try:
        try:
            register_tool(_dup_probe)
        except ValueError as error:
            assert "重名" in str(error), f"重名错误信息不对：{error}"
        else:
            raise AssertionError("重复注册同名工具居然没报错")
    finally:
        if _dup_probe in _TOOLS:
            _TOOLS.remove(_dup_probe)

    order = describe_middleware()
    priorities = [p for p, _ in order]
    assert priorities == sorted(priorities), f"中间件没有按 priority 排序：{order}"
    assert priorities[0] == PRIORITY_LOGGING, f"日志层应该在最外层：{order}"
    assert PRIORITY_CONTEXT in priorities and PRIORITY_PERMISSION in priorities, order
    assert priorities.index(PRIORITY_LOGGING) < priorities.index(PRIORITY_PERMISSION), (
        "权限层必须被日志层包住，否则'被拦掉的调用'会没有日志"
    )


def test_date_tool_works() -> None:
    """I8：date_tool 断言回归 —— 原来 datetime.datetime 直接 AttributeError"""
    value = _as_text(get_current_date.invoke({}))
    assert len(value) == 10 and value[4] == "-" and value[7] == "-", f"日期格式不对：{value!r}"


def test_trigger_is_dynamic() -> None:
    """I9：触发点不再在 import 期算死 —— 改环境变量后 refresh 立刻生效"""
    from middleware.context_edit import (
        _compute_trigger,
        context_edit_middleware,
        refresh_context_edit_trigger,
    )

    default_trigger = _compute_trigger()

    os.environ["CONTEXT_EDIT_TRIGGER"] = "1234"
    try:
        assert _compute_trigger() == 1234, "显式覆盖没有生效"
        assert refresh_context_edit_trigger() == 1234, "refresh 没有把新值写回中间件实例"
        assert context_edit_middleware.edits[0].trigger == 1234, "中间件实例的 trigger 没更新"
    finally:
        os.environ.pop("CONTEXT_EDIT_TRIGGER", None)
        refresh_context_edit_trigger()

    assert _compute_trigger() == default_trigger, "去掉覆盖后应该回到默认值"


def test_dir_not_mistaken_for_file() -> None:
    """I11：list_dir 传目录进来，不能因为"不是文件"被拒绝（回归 expect 参数）"""
    status, reason = pc.check_path(ROOT, expect="dir")
    assert status == "allow", f"白名单内的目录应该 allow，实际 {status}（{reason}）"

    status, _ = pc.check_path(ROOT, expect="dir")
    assert "非文件类型" not in _, f"目录不该再报『非文件类型』：{_}"

    # 反方向：read_file 传目录进来，仍然要被拦住并指路
    status, reason = pc.check_path(ROOT, expect="file")
    assert status == "blocked", f"目录传给 read_file 应该 blocked，实际 {status}"
    assert "list_dir" in reason, f"应该提示改用 list_dir：{reason}"

    # 白名单外的目录 -> ask（不是 blocked）
    outside_dir = Path(os.environ.get("WINDIR", r"C:\Windows"))
    status, reason = pc.check_path(outside_dir, expect="dir")
    assert status == "ask", f"白名单外的目录应该 ask，实际 {status}（{reason}）"

    # 不传 expect 时默认按文件处理，老调用点行为不变
    status, _ = pc.check_path(ROOT / "config.py")
    assert status == "allow", "默认参数必须仍然按文件处理"


def test_tool_placeholder_isolation_default() -> None:
    """I10：read_file 默认不被清理（它承载"用户让我读的那个文件"，属于任务锚点）"""
    from middleware.context_edit import context_edit_middleware

    excluded = list(context_edit_middleware.edits[0].exclude_tools)
    assert "read_file" in excluded, f"read_file 应该在默认排除表里，实际 {excluded}"


if __name__ == "__main__":
    tests = [
        test_blocked_cases,
        test_whitelist_in_and_out,
        test_symlink_escape_blocked,
        test_read_file_encoding,
        test_truncation_is_chars,
        test_registry_duplicate_and_order,
        test_date_tool_works,
        test_trigger_is_dynamic,
        test_dir_not_mistaken_for_file,
        test_tool_placeholder_isolation_default,
    ]
    failed = 0
    for fn in tests:
        print(f"{fn.__name__}:")
        try:
            fn()
        except AssertionError as error:
            failed += 1
            print(f"  FAIL {error!a}")
        else:
            print("  ok")
    print(f"\n{'ALL PASS' if not failed else str(failed) + ' FAILED'}")
    sys.exit(1 if failed else 0)
