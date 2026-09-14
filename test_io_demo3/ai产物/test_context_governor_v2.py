"""context_governor 回归测试 v2：在 v1 六条用例之上，补上评审里被漏掉的那些。

设计原则：**测试必须能同时跑打补丁前和打补丁后的实现**，用环境变量切换被测模块：

    python test_context_governor_v2.py                                # 测同目录的 context_governor.py
    $env:GOV_MODULE="context_governor.py.bak_v1"; python test_context_governor_v2.py   # 测 v1 原版做对照

守的不变量（v1 四条 + v2 新增）：
  I1 任何压缩后都不产生孤儿 ToolMessage
  I2 首轮用户目标（锚点）永不被丢掉
  I3 无损路径优先：能靠外置/清空解决时绝不丢消息
  I4 摘要失败绝不冒泡，必须降级到确定性 digest
  I5 归档文件永远落在 artifact_dir 之内（含恶意 tool_call_id）
  I6 dry_run 报的账 == 真实运行会发生的账
  I7 归档/摘要不重复做功（幂等 + 缓存）
  I8 异步路径不得阻塞事件循环
"""

from __future__ import annotations

import asyncio
import importlib
import inspect
import os
import sys
import tempfile
import time
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).parent))

# 默认测同目录下的 context_governor.py；GOV_MODULE 支持模块名，也支持任意文件路径
# （含 context_governor.py.bak_v1 这种非 .py 结尾的备份）。
GOV_SPEC = os.environ.get("GOV_MODULE", "context_governor")
_path = Path(GOV_SPEC)
if os.sep in GOV_SPEC or "/" in GOV_SPEC or _path.is_file():   # 按路径加载
    import importlib.util
    from importlib.machinery import SourceFileLoader

    _loader = SourceFileLoader("gov_under_test", str(_path.resolve()))
    _spec = importlib.util.spec_from_loader("gov_under_test", _loader)
    assert _spec and _spec.loader
    gov_mod = importlib.util.module_from_spec(_spec)
    sys.modules["gov_under_test"] = gov_mod      # dataclass 解析注解时要能查到本模块
    _spec.loader.exec_module(gov_mod)
    MODULE_NAME = _path.name
else:                                            # 按模块名导入
    gov_mod = importlib.import_module(GOV_SPEC)
    MODULE_NAME = GOV_SPEC

from langchain_core.messages import AIMessage, HumanMessage, ToolMessage  # noqa: E402
from langchain.agents.middleware.types import ModelRequest  # noqa: E402

ContextGovernor = gov_mod.ContextGovernor
make_read_artifact_tool = gov_mod.make_read_artifact_tool
ContextReport = gov_mod.ContextReport

# 归档一律落在系统临时目录，别污染项目目录
ART_ROOT = Path(tempfile.gettempdir()) / "ctxgov_tests" / MODULE_NAME.replace(".", "_")


def make_governor(**kwargs):
    """按签名过滤 kwargs —— 好让同一套用例能跑 v1 和 v2。"""
    accepted = set(inspect.signature(ContextGovernor.__init__).parameters)
    return ContextGovernor(**{k: v for k, v in kwargs.items() if k in accepted})


class FakeModel:
    """假模型：3 字符 ≈ 1 token，可按需设定窗口与摘要行为。"""

    def __init__(self, max_input_tokens: int, *, fail_summary: bool = False, slow: float = 0.0) -> None:
        self.profile = {"max_input_tokens": max_input_tokens}
        self.fail_summary = fail_summary
        self.slow = slow
        self.summary_calls = 0

    def get_num_tokens_from_messages(self, msgs, tools=None):  # noqa: ANN001
        return sum(len(str(getattr(m, "content", "") or "")) for m in msgs) // 3

    def invoke(self, *_a, **_k):  # noqa: ANN002, ANN003
        self.summary_calls += 1
        if self.slow:
            time.sleep(self.slow)
        if self.fail_summary:
            raise RuntimeError("429 rate limited")
        payload = ('{"session_intent":"重构认证层","decisions":[],"artifacts":[],'
                   '"open_questions":[],"next_steps":[],"rejected":[]}')

        class R:
            text = payload

        return R()


def build_conversation(turns: int, tool_chars: int, *, end_with_tool: bool = False) -> list:
    msgs = [HumanMessage("原始目标：只改认证层，不动数据库 schema。")]
    for i in range(turns):
        msgs.append(AIMessage("", tool_calls=[{"name": "grep", "args": {"q": f"x{i}"}, "id": f"t{i}"}]))
        msgs.append(ToolMessage("Y" * tool_chars, tool_call_id=f"t{i}", name="grep"))
        if not (end_with_tool and i == turns - 1):
            msgs.append(AIMessage(f"轮{i}结论：发现 {i} 处调用点。"))
    msgs.append(HumanMessage("继续"))
    msgs.append(AIMessage("下一步：确认调用链。"))
    return msgs


def make_request(msgs, model, thread="test"):  # noqa: ANN001
    return ModelRequest(
        model=model,
        messages=msgs,
        tools=[],
        state={"messages": msgs},
        runtime=SimpleNamespace(context={"thread_id": thread}),
    )


def assert_invariants(out, rep, *, label, anchor="原始目标"):  # noqa: ANN001
    ids: set[str] = set()
    for m in out:
        if isinstance(m, AIMessage):
            ids.update(tc["id"] for tc in m.tool_calls if tc.get("id"))
    orphans = [m.tool_call_id for m in out if isinstance(m, ToolMessage) and m.tool_call_id not in ids]
    assert not orphans, f"[{label}] I1 破了，孤儿 ToolMessage: {orphans}"
    assert out and isinstance(out[0], HumanMessage), f"[{label}] I2 破了，锚点丢失"
    assert str(out[0].content).startswith(anchor), f"[{label}] I2 破了，锚点被换掉"
    for m in out:
        if isinstance(m, ToolMessage) and m.tool_call_id not in ids:
            raise AssertionError(f"[{label}] I1 破了: {m.tool_call_id}")
    print(f"  ok [{label}] layer={rep.layer} {rep.before_tokens}->{rep.after_tokens} "
          f"target={rep.target} ext={rep.externalized} clear={rep.cleared} "
          f"drop={rep.dropped_messages} sum={rep.summarized} out={len(out)}")


def _fresh_root(name: str) -> Path:
    root = ART_ROOT / name
    if root.exists():
        for p in sorted(root.rglob("*"), reverse=True):
            p.unlink() if p.is_file() else p.rmdir()
    root.mkdir(parents=True, exist_ok=True)
    return root


# ──────────────────────────────── v1 原有用例 ────────────────────────────────


def test_externalize_only() -> None:
    root = _fresh_root("ext")
    msgs = build_conversation(6, 9_000)
    g = make_governor(max_input_tokens=20_000, reserve_output_tokens=2_000, artifact_dir=root)
    out, rep = g._govern(make_request(msgs, FakeModel(20_000)), list(msgs))
    assert rep.layer == "externalize", rep.layer
    assert rep.externalized == 6
    assert rep.dropped_messages == 0, "I3 破了：本该无损"
    assert_invariants(out, rep, label="externalize")


def test_clear_only() -> None:
    msgs = build_conversation(8, 3_000)
    g = make_governor(max_input_tokens=8_000, reserve_output_tokens=800,
                      externalize_over_chars=10**9, artifact_dir=_fresh_root("clr"))
    out, rep = g._govern(make_request(msgs, FakeModel(8_000)), list(msgs))
    assert rep.layer == "clear", rep.layer
    assert rep.dropped_messages == 0, "I3 破了：清空够用时不该丢消息"
    assert_invariants(out, rep, label="clear")


def test_trim_digest() -> None:
    msgs = build_conversation(8, 3_000)
    g = make_governor(max_input_tokens=3_000, reserve_output_tokens=800,
                      externalize_over_chars=10**9, artifact_dir=_fresh_root("trim"))
    out, rep = g._govern(make_request(msgs, FakeModel(3_000)), list(msgs))
    assert rep.layer == "trim", rep.layer
    assert rep.dropped_messages > 0
    assert not rep.summarized
    folded = str(out[1].content)
    assert "deterministic digest" in folded
    assert "[cleared]" not in folded, "摘要拿到了被清空的空壳，等于白摘"
    assert "YYYY" in folded, "digest 应当基于原文"
    assert_invariants(out, rep, label="trim")


def test_llm_summary() -> None:
    msgs = build_conversation(8, 3_000)
    g = make_governor(max_input_tokens=3_000, reserve_output_tokens=800,
                      externalize_over_chars=10**9, summary_model=FakeModel(3_000),
                      artifact_dir=_fresh_root("sum"))
    out, rep = g._govern(make_request(msgs, FakeModel(3_000)), list(msgs))
    assert rep.layer == "summarize" and rep.summarized, rep.layer
    assert '"session_intent"' in str(out[1].content)
    assert_invariants(out, rep, label="summarize")


def test_summary_failure_degrades() -> None:
    msgs = build_conversation(8, 3_000)
    g = make_governor(max_input_tokens=3_000, reserve_output_tokens=800,
                      externalize_over_chars=10**9, summary_model=FakeModel(3_000, fail_summary=True),
                      artifact_dir=_fresh_root("deg"))
    out, rep = g._govern(make_request(msgs, FakeModel(3_000)), list(msgs))
    assert not rep.summarized
    assert rep.layer == "trim"
    assert any("summary_failed" in n for n in rep.notes), rep.notes
    assert "deterministic digest" in str(out[1].content)
    assert_invariants(out, rep, label="degrade")


def test_unknown_window_is_lossless_only() -> None:
    msgs = build_conversation(4, 9_000)

    class NoProfile(FakeModel):
        profile: dict = {}

    g = make_governor(artifact_dir=_fresh_root("nop"))
    out, rep = g._govern(make_request(msgs, NoProfile(0)), list(msgs))
    assert rep.dropped_messages == 0
    assert "no_model_profile:lossless_only" in rep.notes
    assert_invariants(out, rep, label="no-profile")


# ──────────────────────────── v2 新增：B1 孤儿消息 ────────────────────────────


def test_no_orphan_when_turn_ends_with_tool_result() -> None:
    """B1 回归：轮次以 ToolMessage 收尾（用户中断 / tool 循环结尾）时，

    v1 的索引错位会把 ToolMessage 留在 tail，而它的 AIMessage 被塞进摘要 → 孤儿。
    """
    root = _fresh_root("orphan")
    msgs = build_conversation(8, 3_000, end_with_tool=True)
    g = make_governor(max_input_tokens=3_000, reserve_output_tokens=800,
                      externalize_over_chars=10**9, artifact_dir=root)
    out, rep = g._govern(make_request(msgs, FakeModel(3_000)), list(msgs))
    ids = set()
    for m in out:
        if isinstance(m, AIMessage):
            ids.update(tc["id"] for tc in m.tool_calls if tc.get("id"))
    orphans = [m.tool_call_id for m in out if isinstance(m, ToolMessage) and m.tool_call_id not in ids]
    assert not orphans, f"I1 破了，孤儿 ToolMessage: {orphans}"
    assert rep.dropped_messages > 0, "这个用例本就该走裁剪路径"
    assert_invariants(out, rep, label="orphan-guard")


def test_cut_index_is_absolute_and_on_boundary() -> None:
    """B1 根因：`_cut_for_budget` 必须返回绝对索引，且落在 HumanMessage 上。"""
    g = make_governor(max_input_tokens=3_000, reserve_output_tokens=800, artifact_dir=_fresh_root("cut"))
    if "floor" not in inspect.signature(g._cut_for_budget).parameters:
        print("  skip [cut-index] 被测实现没有 floor 参数（v1）")
        return
    msgs = build_conversation(8, 3_000, end_with_tool=True)
    probe = list(msgs)
    req = make_request(msgs, FakeModel(3_000))
    rep = ContextReport()
    cut = g._cut_for_budget(req, probe, 2_000, rep, floor=1)
    assert cut is not None and cut > 1
    assert isinstance(probe[cut], HumanMessage), f"切点落在 {type(probe[cut]).__name__} 上，不是轮起点"
    assert cut == len(probe) - 2, f"期望切在最后一条 HumanMessage({len(probe) - 2})，实际 {cut}"
    print(f"  ok [cut-index] cut={cut} -> {type(probe[cut]).__name__}")


# ──────────────────────────── v2 新增：B2 路径穿越 ────────────────────────────


def test_artifact_filename_cannot_escape() -> None:
    root = _fresh_root("escape")
    msgs = [HumanMessage("go"),
            AIMessage("", tool_calls=[{"name": "grep", "args": {}, "id": "../../../../pwned"}]),
            ToolMessage("Z" * 9_000, tool_call_id="../../../../pwned", name="../../evil")]
    g = make_governor(max_input_tokens=20_000, reserve_output_tokens=2_000, artifact_dir=root)
    out, rep = g._govern(make_request(msgs, FakeModel(20_000)), list(msgs))
    written = [p for p in root.rglob("*") if p.is_file()]
    # ① 直接读 stub 里声明的路径（最精确，跟实现怎么拼文件名无关）
    stub = str(out[2].content)
    declared = Path(stub.split("path=", 1)[1].split(" bytes=")[0].strip().replace(" (dry-run, 未落盘)", ""))
    assert declared.resolve().is_relative_to(ART_ROOT.resolve()), \
        f"声明的归档路径跑到 artifact_dir 之外了: {declared}"
    # ② 物理检查：临时根目录下不该冒出 pwned*
    strays = list(ART_ROOT.parent.glob("pwned*")) + list(root.rglob("pwned*"))
    assert not strays, f"目录穿越成功了，文件落在归档目录之外: {[str(p) for p in strays]}"
    assert written, "没有归档文件？用例本身失效了"
    base = root.resolve()
    for p in written:
        rp = p.resolve()
        assert rp == base or base in rp.parents, f"逃出归档目录: {rp}"
    escaped = list(root.parent.glob("pwned*")) + list(root.parent.parent.glob("pwned*"))
    assert not escaped, f"目录穿越成功了: {escaped}"
    assert rep.externalized == 1
    print(f"  ok [escape] stub={str(out[2].content)[:80]}")


# ──────────────────────────── v2 新增：B3 dry_run ────────────────────────────


def test_dry_run_reports_the_real_plan() -> None:
    """B3：dry_run 的账必须等于真实运行会发生的账，且一个字节都不落盘。"""
    root = _fresh_root("dry")
    msgs = build_conversation(6, 9_000)
    kwargs = dict(max_input_tokens=20_000, reserve_output_tokens=2_000, externalize_over_chars=4_000)

    real = make_governor(dry_run=False, artifact_dir=root, **kwargs)
    out_real, rep_real = real._govern(make_request(msgs, FakeModel(20_000)), list(msgs))

    dry_root = _fresh_root("dry_shadow")
    dry = make_governor(dry_run=True, artifact_dir=dry_root, **kwargs)
    out_dry, rep_dry = dry._govern(make_request(msgs, FakeModel(20_000)), list(msgs))

    assert rep_dry.layer == rep_real.layer, \
        f"dry_run 报的层级({rep_dry.layer})与真实运行({rep_real.layer})不一致"
    assert rep_dry.dropped_messages == rep_real.dropped_messages, "dry_run 报的丢弃条数与真实不一致"
    assert rep_dry.externalized == rep_real.externalized
    assert not [p for p in dry_root.rglob("*") if p.is_file()], "dry_run 居然落盘了"
    assert [m.content for m in out_dry] == [m.content for m in msgs], "dry_run 不该改变交给 handler 的视图"
    print(f"  ok [dry_run] both layer={rep_real.layer} drop={rep_real.dropped_messages}")


# ──────────────────────────── v2 新增：D1/D2 幂等 ────────────────────────────


def test_artifact_written_once() -> None:
    """D1：同一份历史连续治理两次，归档文件不该被重写。"""
    root = _fresh_root("idem")
    msgs = build_conversation(6, 9_000)
    g = make_governor(max_input_tokens=20_000, reserve_output_tokens=2_000, artifact_dir=root)
    req = make_request(msgs, FakeModel(20_000))
    g._govern(req, list(msgs))
    files = sorted(p for p in root.rglob("*.txt"))
    assert len(files) == 6, f"期望 6 个归档文件，实际 {len(files)}"
    stamps = {p: p.stat().st_mtime_ns for p in files}
    time.sleep(0.05)
    g._govern(req, list(msgs))
    rewritten = [p.name for p, t in stamps.items() if p.stat().st_mtime_ns != t]
    assert not rewritten, f"D1 破了：归档被重复写入 {rewritten}"
    print(f"  ok [idempotent] {len(files)} files, 0 rewrites")


def test_artifact_cache_collision_rewrites() -> None:
    """A1 回归：拿不到 thread_id 时 key 空间是共享的，两段会话共用 tool_call_id

    （本地小模型常发 call_1/call_2）绝不能让第二段会话指向第一段会话的原文。
    """
    root = _fresh_root("collision")
    g = make_governor(max_input_tokens=20_000, reserve_output_tokens=2_000, artifact_dir=root)

    def conversation(payload: str) -> list:
        return [HumanMessage("go"),
                AIMessage("", tool_calls=[{"name": "grep", "args": {}, "id": "call_1"}]),
                ToolMessage(payload, tool_call_id="call_1", name="grep"),
                AIMessage("done")]

    for tag, payload in (("A", "A" * 9_000), ("B", "B" * 9_000)):
        msgs = conversation(payload)
        out, _rep = g._govern(make_request(msgs, FakeModel(20_000), thread=None), list(msgs))
        stub = str(out[2].content)
        declared = Path(stub.split("path=", 1)[1].split(" bytes=")[0].strip())
        assert declared.read_text(encoding="utf-8") == payload, \
            f"[{tag}] 归档原文与本次工具结果不一致 —— 缓存串会话了"
    print("  ok [cache-collision] 同 id 不同内容 -> 各自落盘")


def test_summary_is_cached() -> None:
    """D2：tool 循环里 N 次模型调用不该产生 N 次摘要 LLM 请求。"""
    msgs = build_conversation(8, 3_000)
    summ = FakeModel(3_000)
    g = make_governor(max_input_tokens=3_000, reserve_output_tokens=800,
                      externalize_over_chars=10**9, summary_model=summ,
                      artifact_dir=_fresh_root("sumcache"))
    req = make_request(msgs, FakeModel(3_000))
    g._govern(req, list(msgs))
    g._govern(req, list(msgs))
    g._govern(req, list(msgs))
    assert summ.summary_calls == 1, f"D2 破了：3 次治理打了 {summ.summary_calls} 次摘要"
    print(f"  ok [summary-cache] 3 governs -> {summ.summary_calls} LLM call")


# ──────────────────────────── v2 新增：D5 多模态 ────────────────────────────


def test_images_survive_externalize() -> None:
    """D5：外置只该吃掉文本，图片块必须留在消息里。"""
    root = _fresh_root("img")
    img = {"type": "image_url", "image_url": {"url": "data:image/png;base64,AAAA"}}
    msgs = [HumanMessage("看图"),
            AIMessage("", tool_calls=[{"name": "shot", "args": {}, "id": "s1"}]),
            ToolMessage([img, {"type": "text", "text": "P" * 9_000}], tool_call_id="s1", name="shot"),
            AIMessage("收到")]
    g = make_governor(max_input_tokens=20_000, reserve_output_tokens=2_000,
                      externalize_over_chars=1_000, artifact_dir=root)
    out, rep = g._govern(make_request(msgs, FakeModel(20_000)), list(msgs))
    assert rep.externalized == 1
    content = out[2].content
    assert isinstance(content, list), "图片块被压成纯文本了"
    assert any(isinstance(b, dict) and b.get("type") == "image_url" for b in content), "图片丢了"
    assert_invariants(out, rep, label="images", anchor="看图")


# ──────────────────────────── v2 新增：B5 异步不阻塞 ────────────────────────────


def test_async_path_does_not_block_event_loop() -> None:
    """B5：摘要是一次同步 LLM 往返，绝不能占着事件循环。"""
    msgs = build_conversation(8, 3_000)
    g = make_governor(max_input_tokens=3_000, reserve_output_tokens=800,
                      externalize_over_chars=10**9, summary_model=FakeModel(3_000, slow=0.4),
                      artifact_dir=_fresh_root("async"))
    req = make_request(msgs, FakeModel(3_000))
    ticks = {"n": 0}

    async def handler(_req):  # noqa: ANN001
        return AIMessage("done")

    async def ticker() -> None:
        while True:
            ticks["n"] += 1
            await asyncio.sleep(0.01)

    async def main() -> int:
        t = asyncio.create_task(ticker())
        await g.awrap_model_call(req, handler)
        t.cancel()
        return ticks["n"]

    n = asyncio.run(main())
    assert n >= 5, f"B5 破了：事件循环被阻塞，0.4s 内只跑了 {n} 个 tick"
    print(f"  ok [async] event loop ticked {n}x during a 0.4s blocking summary")


# ──────────────────────────── v2 新增：B4 after_agent 账本 ────────────────────────────


def test_after_agent_accounting() -> None:
    root = _fresh_root("shrink")
    msgs = build_conversation(6, 9_000)
    g = make_governor(max_input_tokens=200_000, reserve_output_tokens=2_000, artifact_dir=root)
    reports = []
    g.on_report = reports.append
    upd = g.after_agent({"messages": list(msgs)}, SimpleNamespace(context={"thread_id": "test"}))
    assert upd and "messages" in upd
    assert reports, "after_agent 没产出报告"
    rep = reports[-1]
    assert rep.layer == "state_shrink"
    assert rep.after_tokens > 0, "B4 破了：after_tokens 从未赋值"
    assert rep.after_tokens < rep.before_tokens, "收缩后反而更大？"
    assert rep.saved > 0
    print(f"  ok [after_agent] layer={rep.layer} {rep.before_tokens}->{rep.after_tokens} "
          f"ext={rep.externalized} clear={rep.cleared}")


# ──────────────────────────── v2 新增：归档工具与清扫 ────────────────────────────


def test_read_artifact_blocks_traversal() -> None:
    root = _fresh_root("readtool")
    tool = make_read_artifact_tool(root)
    assert "[denied]" in tool.invoke({"path": "../../../etc/passwd"})
    assert "[denied]" in tool.invoke({"path": str(Path.home() / ".ssh" / "id_rsa")})
    inside = root / "a.txt"
    inside.write_text("hello-artifact", encoding="utf-8")
    assert tool.invoke({"path": "a.txt"}) == "hello-artifact"
    print("  ok [read_artifact] 越界被拒，目录内可读")


def test_sweep_respects_ttl_and_keepset() -> None:
    root = _fresh_root("sweep")
    g = make_governor(artifact_dir=root)
    if not hasattr(g, "_sweep_artifacts"):
        print("  skip [sweep] 被测实现没有归档清扫（v1）")
        return
    old = root / "t" / "old.txt"
    old.parent.mkdir(parents=True, exist_ok=True)
    old.write_text("x" * 100, encoding="utf-8")
    kept = root / "t" / "keep.txt"
    kept.write_text("y" * 100, encoding="utf-8")
    os.utime(old, (time.time() - 86400 * 30, time.time() - 86400 * 30))
    g.artifact_ttl_seconds = 86400 * 7
    n = g._sweep_artifacts({str(kept)})
    assert n == 1, f"期望清掉 1 个过期文件，实际 {n}"
    assert kept.exists() and not old.exists()
    print("  ok [sweep] 过期清理 1，被引用文件保留")


def _disable_console_encoding_trap() -> None:
    pass


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    print(f"被测模块: {MODULE_NAME}\n")
    cases = [
        ("externalize", test_externalize_only),
        ("clear", test_clear_only),
        ("trim-digest", test_trim_digest),
        ("llm-summary", test_llm_summary),
        ("summary-degrade", test_summary_failure_degrades),
        ("no-profile", test_unknown_window_is_lossless_only),
        ("I1-orphan", test_no_orphan_when_turn_ends_with_tool_result),
        ("I1-cut-index", test_cut_index_is_absolute_and_on_boundary),
        ("I5-escape", test_artifact_filename_cannot_escape),
        ("I6-dry-run", test_dry_run_reports_the_real_plan),
        ("I7-idempotent", test_artifact_written_once),
        ("I7-collision", test_artifact_cache_collision_rewrites),
        ("I7-summary-cache", test_summary_is_cached),
        ("D5-images", test_images_survive_externalize),
        ("I8-async", test_async_path_does_not_block_event_loop),
        ("B4-after-agent", test_after_agent_accounting),
        ("read-artifact", test_read_artifact_blocks_traversal),
        ("sweep", test_sweep_respects_ttl_and_keepset),
    ]
    failed = []
    for name, fn in cases:
        print(f"{name}:")
        try:
            fn()
        except AssertionError as exc:
            failed.append((name, str(exc)))
            print(f"  FAIL {exc}")
        except Exception as exc:  # noqa: BLE001
            failed.append((name, f"{type(exc).__name__}: {exc}"))
            print(f"  ERROR {type(exc).__name__}: {exc}")
    print()
    if failed:
        print(f"{len(failed)}/{len(cases)} FAILED")
        for name, msg in failed:
            print(f"  - {name}: {msg}")
        sys.exit(1)
    print(f"ALL PASS ({len(cases)} cases)")
