"""ContextGovernor 回归测试：三条阶梯路径 + 结构合法性 + 降级行为。

运行： python test_context_governor.py
守的是四条不变量：
  I1 任何压缩后都不产生孤儿 ToolMessage（provider 400 的头号来源）
  I2 首轮用户目标（锚点）永不被丢掉
  I3 无损路径优先：能靠外置/清空解决时绝不丢消息
  I4 摘要失败绝不冒泡，必须降级到确定性 digest
"""

from __future__ import annotations

import sys
from types import SimpleNamespace

sys.path.insert(0, ".")

from langchain_core.messages import AIMessage, HumanMessage, ToolMessage  # noqa: E402

from context_governor import ContextGovernor  # noqa: E402


class FakeModel:
    """假模型：3 字符 ≈ 1 token，可按需设定窗口与摘要行为。"""

    def __init__(self, max_input_tokens: int, *, fail_summary: bool = False) -> None:
        self.profile = {"max_input_tokens": max_input_tokens}
        self.fail_summary = fail_summary

    def get_num_tokens_from_messages(self, msgs, tools=None):  # noqa: ANN001
        return sum(len(str(getattr(m, "content", "") or "")) for m in msgs) // 3

    def invoke(self, *_a, **_k):  # noqa: ANN002, ANN003
        if self.fail_summary:
            raise RuntimeError("429 rate limited")
        payload = '{"session_intent":"重构认证层","decisions":[],"artifacts":[],"open_questions":[],"next_steps":[],"rejected":[]}'

        class R:
            text = payload

        return R()


def build_conversation(turns: int, tool_chars: int) -> list:
    msgs = [HumanMessage("原始目标：只改认证层，不动数据库 schema。")]
    for i in range(turns):
        msgs.append(AIMessage("", tool_calls=[{"name": "grep", "args": {"q": f"x{i}"}, "id": f"t{i}"}]))
        msgs.append(ToolMessage("Y" * tool_chars, tool_call_id=f"t{i}", name="grep"))
        msgs.append(AIMessage(f"轮{i}结论：发现 {i} 处调用点。"))
    msgs.append(HumanMessage("继续"))
    msgs.append(AIMessage("下一步：确认调用链。"))
    return msgs


def make_request(msgs, model):  # noqa: ANN001
    from langchain.agents.middleware.types import ModelRequest

    return ModelRequest(
        model=model,
        messages=msgs,
        tools=[],
        state={"messages": msgs},
        runtime=SimpleNamespace(context={"thread_id": "test"}),
    )


def assert_invariants(out, rep, *, label):  # noqa: ANN001
    ids: set[str] = set()
    for m in out:
        if isinstance(m, AIMessage):
            ids.update(tc["id"] for tc in m.tool_calls if tc.get("id"))
    orphans = [m.tool_call_id for m in out if isinstance(m, ToolMessage) and m.tool_call_id not in ids]
    assert not orphans, f"[{label}] I1 破了，孤儿 ToolMessage: {orphans}"
    assert out and isinstance(out[0], HumanMessage), f"[{label}] I2 破了，锚点丢失"
    assert out[0].content.startswith("原始目标"), f"[{label}] I2 破了，锚点被换掉"
    assert "Traceback" not in str(rep.notes), f"[{label}] 不该出现未捕获异常"
    print(f"  ok [{label}] layer={rep.layer} {rep.before_tokens}->{rep.after_tokens} "
          f"target={rep.target} ext={rep.externalized} clear={rep.cleared} "
          f"drop={rep.dropped_messages} sum={rep.summarized} out={len(out)}")


def test_externalize_only() -> None:
    """大工具结果靠外置就能解决，一条消息都不该丢（I3）。"""
    msgs = build_conversation(6, 9_000)
    g = ContextGovernor(max_input_tokens=20_000, reserve_output_tokens=2_000)
    out, rep = g._govern(make_request(msgs, FakeModel(20_000)), list(msgs))
    assert rep.layer == "externalize"
    assert rep.externalized == 6
    assert rep.dropped_messages == 0, "I3 破了：本该无损"
    assert_invariants(out, rep, label="externalize")


def test_clear_only() -> None:
    """关掉外置后，清空旧工具结果足以达标，仍然不该丢消息（I3）。"""
    msgs = build_conversation(8, 3_000)
    g = ContextGovernor(max_input_tokens=8_000, reserve_output_tokens=800, externalize_over_chars=10**9)
    out, rep = g._govern(make_request(msgs, FakeModel(8_000)), list(msgs))
    assert rep.layer == "clear", rep.layer
    assert rep.dropped_messages == 0, "I3 破了：清空够用时不该丢消息"
    assert_invariants(out, rep, label="clear")


def test_trim_digest() -> None:
    """窗口极小，必须丢消息：走确定性 digest，且摘要输入必须是原文而非 [cleared] 空壳。"""
    msgs = build_conversation(8, 3_000)
    g = ContextGovernor(max_input_tokens=3_000, reserve_output_tokens=800, externalize_over_chars=10**9)
    out, rep = g._govern(make_request(msgs, FakeModel(3_000)), list(msgs))
    assert rep.layer == "trim", rep.layer
    assert rep.dropped_messages > 0
    assert not rep.summarized
    folded = out[1].content
    assert "deterministic digest" in folded
    assert "[cleared]" not in folded, "摘要拿到了被清空的空壳，等于白摘"
    assert "YYYY" in folded, "digest 应当基于原文"
    assert_invariants(out, rep, label="trim")


def test_llm_summary() -> None:
    msgs = build_conversation(8, 3_000)
    g = ContextGovernor(
        max_input_tokens=3_000, reserve_output_tokens=800,
        externalize_over_chars=10**9, summary_model=FakeModel(3_000),
    )
    out, rep = g._govern(make_request(msgs, FakeModel(3_000)), list(msgs))
    assert rep.layer == "summarize" and rep.summarized
    assert '"session_intent"' in out[1].content
    assert_invariants(out, rep, label="summarize")


def test_summary_failure_degrades() -> None:
    """摘要炸了必须降级到 digest，绝不冒泡（I4）。"""
    msgs = build_conversation(8, 3_000)
    g = ContextGovernor(
        max_input_tokens=3_000, reserve_output_tokens=800,
        externalize_over_chars=10**9, summary_model=FakeModel(3_000, fail_summary=True),
    )
    out, rep = g._govern(make_request(msgs, FakeModel(3_000)), list(msgs))
    assert not rep.summarized
    assert rep.layer == "trim"
    assert any("summary_failed" in n for n in rep.notes), rep.notes
    assert "deterministic digest" in out[1].content
    assert_invariants(out, rep, label="degrade")


def test_unknown_window_is_lossless_only() -> None:
    """拿不到模型窗口时只做无损外置，不做任何破坏性裁剪。"""
    msgs = build_conversation(4, 9_000)

    class NoProfile(FakeModel):
        profile: dict = {}

    g = ContextGovernor()
    out, rep = g._govern(make_request(msgs, NoProfile(0)), list(msgs))
    assert rep.dropped_messages == 0
    assert "no_model_profile:lossless_only" in rep.notes
    assert_invariants(out, rep, label="no-profile")


if __name__ == "__main__":
    for fn in (
        test_externalize_only,
        test_clear_only,
        test_trim_digest,
        test_llm_summary,
        test_summary_failure_degrades,
        test_unknown_window_is_lossless_only,
    ):
        print(f"{fn.__name__}:")
        fn()
    print("\nALL PASS")
