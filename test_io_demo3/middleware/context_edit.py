"""上下文编辑中间件 —— 清空"旧的工具结果"，控制上下文膨胀。

为什么加它：
    agent 每调用一次工具，结果就会一直堆在 messages 里。长对话 / 多轮工具调用时，
    上下文会一路膨胀直到撑爆模型窗口（表现为报错或响应变慢变蠢）。
    这个中间件在上下文超过阈值后，把"较早的工具结果"替换成 [cleared] 占位符，
    最近 N 条保持原样不动。

它和 state 的关系（这点很关键）：
    它挂在 wrap_model_call 上，做法是
        deepcopy(消息) -> 改副本 -> request.override(messages=副本)
    也就是说 **只改这一次请求看到的视图，不写回 state.messages**。
    历史依然完整、可回放、可审计，压缩不会造成永久性信息丢失。

    对比：框架另一个 SummarizationMiddleware 走的是 before_model，
    会 return {"messages": [RemoveMessage(REMOVE_ALL_MESSAGES), ...]} 直接重建 state，
    历史是真的被烧掉的 —— 所以这里不用它，用 ContextEditingMiddleware。

触发点怎么算（本项目改过的地方）：
    默认的 count_tokens_approximately 用 chars_per_token=4.0，那是按英文设的。
    中文实测约 1.6 字符/token，用 4.0 估算会把上下文低估约 2.4 倍，
    结果是 trigger 迟迟不触发、直接撞窗口上限。所以这里换了自定义计数器。

本轮修掉的三处：
  A. `CONTEXT_EDIT_TRIGGER_TOKENS` 原来在 **import 期**一次性算死，
     改 .env 必须重启进程才生效，而且触发点永远和真实窗口脱节。
     现在窗口取 `Config.context_window()`（优先 profile 探测，回落配置），
     并且每次模型调用前都重新读一遍环境变量 -> 改完立刻生效。
  B. `exclude_tools=()` 空列表导致 read_file 的结果也会被清掉 ——
     用户明确要求读的那个文件，属于"目标锚点"，不该被当成垃圾清走。
     现在默认排除 read_file，可用 CONTEXT_EDIT_EXCLUDE_TOOLS 增删。
  C. 触发点下限 1000 是把小数/负数配置悄悄吃掉，现在由
     `_compute_trigger()` 明确报错语义并给出可读的下限保护。

来源：
    对齐 Anthropic 的 context editing（clear_tool_uses_20250919），
    LangChain 官方实现，模型无关，DeepSeek 也能用。
"""
from __future__ import annotations

import logging
import os

from langchain.agents.middleware import ClearToolUsesEdit, ContextEditingMiddleware
from langchain_core.messages.utils import count_tokens_approximately

from config import Config, ConfigError
from middleware.registry import PRIORITY_CONTEXT, register_middleware

logger = logging.getLogger(__name__)

#: 触发点的地板值。低于它会退化成"每一轮都在清"，反而把上下文搅烂。
TRIGGER_FLOOR = 1000

#: 默认不被清理的工具（结果属于任务锚点，清了模型就丢了目标）
DEFAULT_EXCLUDE_TOOLS = ("read_file",)

#: 占位符：让模型明确知道"这里曾经有内容，但被治理掉了"
PLACEHOLDER = "[cleared]"


def chinese_token_counter(messages) -> int:
    """中文友好的 token 估算器（chars_per_token 可通过配置调整）。"""
    return count_tokens_approximately(
        messages, chars_per_token=Config.CONTEXT_EDIT_CHARS_PER_TOKEN
    )


def _excluded_tools() -> list[str]:
    """CONTEXT_EDIT_EXCLUDE_TOOLS 覆盖默认排除表（逗号分隔，空串表示不排除任何工具）。"""
    raw = os.getenv("CONTEXT_EDIT_EXCLUDE_TOOLS")
    if raw is None:
        return list(DEFAULT_EXCLUDE_TOOLS)
    return [name.strip() for name in raw.split(",") if name.strip()]


def _compute_trigger() -> int:
    """当前生效的触发点（token）。每次调用都重新计算，改 .env 立即生效。

    三个约束取最小的那个：
      by_ratio  = 窗口 × 60%        —— 常规上限（大窗口走这条）
      by_margin = 窗口 − 安全余量   —— 保证小窗口也留得下"输出预留 + 一轮工具返回"
      by_cost   = 成本线            —— 窗口装得下 ≠ 你愿意每次都付这个钱
    例：窗口 1M、成本线 20 万 -> min(600000, 984000, 200000) = 200000
        窗口 64k（换模型后）    -> min(38400, 48000, 200000) = 38400   ← 自动收敛
        窗口 32k（换模型后）    -> min(19200, 16000, 200000) = 16000   ← 小窗口提前触发
    """
    raw_override = os.getenv("CONTEXT_EDIT_TRIGGER")
    if raw_override:
        try:
            return max(1, int(raw_override))
        except (TypeError, ValueError) as error:
            raise ConfigError(
                f"CONTEXT_EDIT_TRIGGER 不是整数：{raw_override!r}（例如设为 1 可强制每次触发）"
            ) from error

    window = Config.context_window()  # ← 不再写死 1M，优先读模型 profile
    candidates = [
        int(window * Config.CONTEXT_EDIT_TRIGGER_RATIO),
        window - Config.CONTEXT_EDIT_SAFETY_MARGIN,
    ]
    if Config.CONTEXT_EDIT_COST_LINE > 0:
        candidates.append(Config.CONTEXT_EDIT_COST_LINE)
    return max(TRIGGER_FLOOR, min(candidates))


def refresh_context_edit_trigger() -> int:
    """把最新触发点/排除表写回中间件实例，返回生效值。

    想看当前值：
        python -c "from middleware.context_edit import refresh_context_edit_trigger as f; print(f())"
    """
    trigger = _compute_trigger()
    for edit in context_edit_middleware.edits:
        edit.trigger = trigger
        edit.keep = Config.CONTEXT_EDIT_KEEP
        edit.exclude_tools = _excluded_tools()
    return trigger


context_edit_middleware = ContextEditingMiddleware(
    edits=[
        ClearToolUsesEdit(
            trigger=_compute_trigger(),       # 超过多少 token 才动手（上面那个函数动态刷）
            keep=Config.CONTEXT_EDIT_KEEP,    # 最近几条工具结果不动
            clear_at_least=0,                 # 0 = 能清多少清多少
            clear_tool_inputs=False,          # True 的话，连 AI 消息里的调用参数也一起清掉
            exclude_tools=_excluded_tools(),  # 这些工具的结果永不清理
            placeholder=PLACEHOLDER,          # 被清掉后留下的占位符文本
        )
    ],
    # ← 关键：不要用默认的 chars/4，用上面那个中文计数器
    token_counter=chinese_token_counter,
)

# 注册进中间件表：优先级高于权限层（只改请求视图，不碰执行路径）
register_middleware(context_edit_middleware, priority=PRIORITY_CONTEXT)
