"""全局配置 —— 全部走环境变量，不改代码就能调。

启动期就把"配置错了"喊出来，而不是等到第一次请求才炸。
用法：
    python -c "from config import Config; Config.validate()"
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# 显式指向 config.py 同目录的 .env。
# 原来的 load_dotenv() 依赖"当前工作目录"，从别处启动进程（或做测试、
# 定时任务）时会静默读不到 .env，最后表现为"配置都对，就是没有 key"。
_ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(_ENV_PATH if _ENV_PATH.is_file() else None)


class ConfigError(RuntimeError):
    """配置错误：启动期就抛，不要拖到发请求时才暴露。"""


def _get_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "y", "on")


def _split_paths(raw: str) -> list[str]:
    """按 os.pathsep 切分路径串，顺便去掉空段。"""
    return [p for p in (seg.strip() for seg in raw.split(os.pathsep)) if p]


def _profiles_dir() -> str:
    """langchain_deepseek 内置的 profile 表所在目录（用于启动期友好报错）。"""
    try:
        import langchain_deepseek.data as data

        return os.path.dirname(os.path.abspath(data.__file__))
    except Exception as error:  # 连包都没装：给出说明，但不要连带把别的检查搞崩
        _note_import_problem("查 profile 表位置", error)
        return "langchain_deepseek/data/_profiles.py"


#: 记录"导入模型包时到底遇见了什么错"，交给 Config.validate() 一起报出来。
#: 关键点是：函数照样能返回 None（不崩），但**不把失败原因吞掉**。
_IMPORT_PROBLEM: list[str] = []


def _note_import_problem(what: str, error: BaseException) -> None:
    _IMPORT_PROBLEM.append(f"{what} 失败：{type(error).__name__}: {error}")


def _load_model():
    """导入 ChatDeepSeek。

    三种出口：
      1. 设了 IO_OX_SKIP_MODEL_IMPORT=1 -> 主动跳过，返回 None（测试/离线用）
      2. 导入成功 -> 返回 ChatDeepSeek 类
      3. 导入失败 -> 返回 None，**但把真实原因记进 _IMPORT_PROBLEM**

    第 3 种情况的坑：如果写成裸 `except Exception: return None`，
    那么"没装包"、"包装坏了"、"包内自己崩了"三种完全不同的病，
    症状会一模一样（都表现为"模型名查不到"），照着提示排查一天也查不出来。
    现在原因会被 Config.validate() 原样报出来。
    """
    if _get_bool("IO_OX_SKIP_MODEL_IMPORT", False):
        return None
    try:
        from langchain_deepseek import ChatDeepSeek

        return ChatDeepSeek
    except ImportError as error:  # 包没装 / 名字写错 —— 最常见
        _note_import_problem("导入 langchain_deepseek", error)
        return None
    except Exception as error:  # 包装了但自己崩了（版本冲突、依赖缺失……）
        _note_import_problem("导入 langchain_deepseek（包已安装但加载出错）", error)
        return None


class Config:
    # ===================== 模型基础 =====================
    API_KEY = os.getenv("DEEPSEEK_API_KEY")
    MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")
    BASE_URL = os.getenv("DEEPSEEK_BASE_URL")  # 可选，留空走 SDK 默认
    TEMPERATURE = float(os.getenv("DEEPSEEK_TEMPERATURE", 0.5))
    SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", "你是一个助手")

    # ===================== 启动校验开关 =====================
    # 模型名在 langchain_deepseek 的 profile 表里查不到时，是否直接启动失败。
    # 默认只要警告不拦截（因为服务端别名可能仍然可用）；CI 里可设 1 强制拦截。
    STRICT_MODEL_PROFILE = _get_bool("IO_OX_STRICT_MODEL", False)

    # ===================== 路径白名单 =====================
    # 每个根目录用 os.pathsep（Windows ';' / *nix ':'）分隔，例如：
    #   $env:IO_OX_ALLOWED_ROOTS="D:/pyhc/pythonn;E:/IO_OX-_test"
    # 不给默认值 —— 白名单必须是显式声明出来的，
    # 而不是靠 expanduser("~/Documents") 把整个用户文档目录蒙进来。
    ALLOWED_ROOTS = _split_paths(os.getenv("IO_OX_ALLOWED_ROOTS", ""))

    # 高敏感后缀，直接 blocked，不走"问用户"
    BLOCKED_EXTENSIONS = {".key", ".pem", ".pfx", ".env", ".p12", ".keystore"}

    # ================= ↓↓↓ 上下文编辑中间件的参数 ↓↓↓ =================
    # 全部走环境变量，不改代码就能调。例如：
    #   PowerShell:  $env:CONTEXT_EDIT_WINDOW="64000"; python main.py

    # 模型上下文窗口（token）—— DeepSeek 全系都是 1,000,000。
    # 实测 langchain_deepseek 1.1.0 的 profile 表里 4 个模型
    # （deepseek-chat / deepseek-reasoner / deepseek-v4-flash / deepseek-v4-pro）
    # 输入上限都是 1M、输出上限 384k。
    #
    # 注意：模型名必须和 profile 表的键**逐字符一致**（deepseek-v4-flash），
    # 写成 deepseek-flash 时 llm.profile 返回 None。那是"框架查不到"，
    # 不代表窗口小 —— 但所有按窗口自适应的逻辑会一并退化成猜，
    # 所以现在 Config.validate() 会在启动期把这件事报出来。
    # 这个值现在只是**兜底**：能探测到 profile 时以 profile 的 max_input_tokens 为准。
    CONTEXT_EDIT_WINDOW = int(os.getenv("CONTEXT_EDIT_WINDOW", 1_000_000))

    # 触发比例：上下文达到窗口的 60% 就开始清空旧工具结果。
    # 这只是"上限"，实际触发点还会被下面的安全余量再压一次
    # （见 middleware/context_edit.py 的 _compute_trigger），
    # 保证小窗口下也留得下"输出 + 一轮工具返回"的空间。
    CONTEXT_EDIT_TRIGGER_RATIO = float(os.getenv("CONTEXT_EDIT_TRIGGER_RATIO", 0.6))

    # 安全余量（token）= 输出预留 + 单轮最大增量。
    # 工具结果特别大的场景（一次返回几万 token）要调大，否则可能一轮就撞墙。
    CONTEXT_EDIT_SAFETY_MARGIN = int(os.getenv("CONTEXT_EDIT_SAFETY_MARGIN", 16000))

    # 成本线（token）：单次请求上下文的**软上限**。
    # 窗口决定"装不装得下"，这个数决定"该不该装这么多"。
    # 1M 窗口装得下 60 万 token，但每次都带 60 万 token 去请求，钱和延迟都是实打实的。
    # 现在取 20%（20 万）—— 清早了的代价很小（模型最多重调一次工具），
    # 而 ContextEditingMiddleware 只改请求视图、不动 state，历史不会丢。
    # 设 0 表示不设成本线，只按窗口比例。
    CONTEXT_EDIT_COST_LINE = int(os.getenv("CONTEXT_EDIT_COST_LINE", 200000))

    # 最近几条工具结果永不清理。
    # 按"一个任务里需要同时看到几条工具结果"来定，取那个次数的 60%~80%。
    CONTEXT_EDIT_KEEP = int(os.getenv("CONTEXT_EDIT_KEEP", 3))

    # 计数器换算比例（字符/token）。中文实测 1.6 最准 ——
    # 默认的 chars_per_token=4.0 是按英文设的，对中文会低估 2.4 倍。
    # 纯英文/代码为主的场景改成 4.0。
    CONTEXT_EDIT_CHARS_PER_TOKEN = float(os.getenv("CONTEXT_EDIT_CHARS_PER_TOKEN", 1.6))

    # 绝对覆盖：设了这个就用它，忽略上面的全部计算。
    # 调试用：$env:CONTEXT_EDIT_TRIGGER="1" 让它每次都触发，方便观察它到底改了什么。
    # 注意：这里存的是**原始字符串**，由 _compute_trigger() 解析，
    # 所以 .env 里写非数字会在第一次请求时报错 —— Config.validate() 会提前拦。
    CONTEXT_EDIT_TRIGGER = os.getenv("CONTEXT_EDIT_TRIGGER")
    # ================= ↑↑↑ 上下文编辑参数 ↑↑↑ =================

    # ===================== 启动期校验 =====================
    @classmethod
    def model_profile(cls, model: str | None = None) -> dict:
        """取模型 profile；查不到返回 {}（而不是抛 KeyError）。"""
        chat_cls = _load_model()
        if chat_cls is None:
            return {}
        try:
            m = chat_cls(model=model or cls.MODEL, api_key=cls.API_KEY or "x")
        except Exception:
            return {}
        return getattr(m, "profile", None) or {}

    @classmethod
    def context_window(cls) -> int:
        """真实窗口：优先用 profile 探测，探测不到才回落到 CONTEXT_EDIT_WINDOW。

        这就是原来"1M 写死 + 注释承认查不到"的修法 —— 换模型（例如换成 64k 的
        自建模型）时窗口自动跟随，不用再去改 .env。
        """
        prof = cls.model_profile()
        return int(prof.get("max_input_tokens") or cls.CONTEXT_EDIT_WINDOW)

    @classmethod
    def validate(cls, *, require_api_key: bool = True) -> list[str]:
        """启动期校验，返回警告列表；致命错误直接抛 ConfigError。

        在 build_agent() 之前调一次，把"跑到一半才发现"的问题提前到启动那一秒。
        """
        errors: list[str] = []
        warnings: list[str] = []

        if require_api_key and not cls.API_KEY:
            errors.append("缺少 DEEPSEEK_API_KEY（.env 里没配，或环境变量没生效）")

        if not isinstance(cls.MODEL, str) or not cls.MODEL.strip():
            errors.append("DEEPSEEK_MODEL 为空，已回落 deepseek-v4-flash")
            cls.MODEL = "deepseek-v4-flash"
        elif cls.MODEL != cls.MODEL.strip():
            warnings.append(f"DEEPSEEK_MODEL 首尾有空白字符：{cls.MODEL!r}，已自动 strip")
            cls.MODEL = cls.MODEL.strip()

        if not (0.0 <= cls.TEMPERATURE <= 2.0):
            errors.append(f"DEEPSEEK_TEMPERATURE 越界：{cls.TEMPERATURE}（应在 0.0~2.0）")

        if cls.CONTEXT_EDIT_CHARS_PER_TOKEN <= 0:
            errors.append(
                f"CONTEXT_EDIT_CHARS_PER_TOKEN 必须 > 0，当前 {cls.CONTEXT_EDIT_CHARS_PER_TOKEN}"
            )
        if cls.CONTEXT_EDIT_KEEP < 0:
            errors.append(f"CONTEXT_EDIT_KEEP 不能为负：{cls.CONTEXT_EDIT_KEEP}")
        if cls.CONTEXT_EDIT_WINDOW <= cls.CONTEXT_EDIT_SAFETY_MARGIN:
            errors.append(
                f"窗口({cls.CONTEXT_EDIT_WINDOW}) <= 安全余量({cls.CONTEXT_EDIT_SAFETY_MARGIN})，"
                "触发点会被压到地板值，压缩永远不会触发"
            )
        if cls.CONTEXT_EDIT_TRIGGER is not None:
            try:
                if int(cls.CONTEXT_EDIT_TRIGGER) < 1:
                    errors.append(f"CONTEXT_EDIT_TRIGGER 必须 >= 1：{cls.CONTEXT_EDIT_TRIGGER}")
            except (TypeError, ValueError):
                errors.append(f"CONTEXT_EDIT_TRIGGER 不是整数：{cls.CONTEXT_EDIT_TRIGGER!r}")

        # 模型名 vs profile 表：这是 deepseek-flash / deepseek-v4-flash 那类
        # "名字对不上导致 profile=None" 的唯一有效防线。
        if _load_model() is None:
            warnings.append("未能导入 ChatDeepSeek，跳过模型 profile 校验")
        elif not cls.model_profile():
            msg = (
                f"模型名 {cls.MODEL!r} 在 langchain_deepseek 的 profile 表里查不到，"
                f"llm.profile 会是 None（窗口/输出上限都要靠猜）。"
                f"已知可用：deepseek-chat / deepseek-reasoner / "
                f"deepseek-v4-flash / deepseek-v4-pro。"
                f"profile 表位置：{_profiles_dir()}"
            )
            (errors if cls.STRICT_MODEL_PROFILE else warnings).append(msg)

        if not cls.ALLOWED_ROOTS:
            warnings.append(
                "IO_OX_ALLOWED_ROOTS 未设置：所有文件读取都会走人工确认（ask）。"
                "要放行某个目录请显式声明，例如 "
                '$env:IO_OX_ALLOWED_ROOTS="D:/pyhc/pythonn;E:/IO_OX-_test"'
            )

        for root in cls.ALLOWED_ROOTS:
            if not os.path.isdir(os.path.expanduser(root)):
                warnings.append(f"白名单目录不存在，已忽略：{root}")

        if errors:
            raise ConfigError("配置校验失败：\n  - " + "\n  - ".join(errors))
        return warnings


if __name__ == "__main__":
    for w in Config.validate(require_api_key=False):
        print(f"[warn] {w}")
    print(
        f"[ok] model={Config.MODEL} window={Config.context_window()} "
        f"roots={Config.ALLOWED_ROOTS or '(empty)'}"
    )
