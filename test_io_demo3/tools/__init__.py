"""工具包：import 即注册。

注意：**漏了这里的 import，工具就会静默消失**（注册表靠 import 副作用）。
tools/registry.py 的 assert_tools_loaded() 会在启动期把这件事喊出来，
main.py 里已经调用。
"""
from tools.date_tool import get_current_date  # noqa: F401
from tools.error_tool import trigger_error  # noqa: F401
from tools.grep_file import grep_file  # noqa: F401
from tools.list_dir import list_dir  # noqa: F401
from tools.read_file import read_file  # noqa: F401

__all__ = ["get_current_date", "trigger_error", "grep_file", "list_dir", "read_file"]
