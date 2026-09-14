# tests

## 跑法

```powershell
cd D:\pyhc\pythonn\io_ox_0.2\test_io_demo3
python tests\test_p0_fixes.py
```

不需要 pytest，退出码 0 = 全通过，1 = 有失败。

## 设计约束：默认不写任何文件

样本优先用「项目里已存在的文件 + 系统自带文件」（例如 `config.py`、`%WINDIR%\win.ini`），
所以在受限环境（无临时目录写权限、只读挂载、企业策略锁 `%TEMP%`）里也能跑通 ——
测试失败应该意味着**代码有问题**，而不是环境有问题。

## 只有一条用例需要落盘：GBK 编码回退

`test_read_file_encoding` 需要一个 GB18030 编码的样本才能验证「编码回退」。
目录不可写且样本缺失时，它会**降级跳过并打印生成命令**：

```powershell
python -c "import pathlib;p=pathlib.Path(r'D:\pyhc\pythonn\io_ox_0.2\test_io_demo3\tests\samples');p.mkdir(parents=True,exist_ok=True);(p/'gbk_sample.txt').write_bytes('中文测试内容'.encode('gb18030'))"
```

生成后重跑，该用例就会真正执行（断言 `中文测试内容` 能读出来、且回报编码 `gb18030`）。

## 覆盖的不变量

| 编号 | 内容 |
| --- | --- |
| I1 | 敏感文件（含 `.env` 这类点文件）/ 不存在 / 目录 → `blocked` |
| I2 | 白名单内 `allow`；白名单外 `ask`；白名单为空时谁都不 `allow` |
| I3 | 白名单内的符号链接指向外部 → `blocked` |
| I4 | 非 UTF-8 文本走真实编码回退，并把实际编码回报出来 |
| I5 | 截断提示按**字符**报数，不是把字节数当字符数 |
| I6 | 工具重名注册 → `ValueError`（而不是静默让后一个失效） |
| I7 | 中间件顺序由 `priority` 决定：日志(10) > 上下文(20) > 权限(30) |
| I8 | `date_tool` 能真的返回日期（回归 `datetime.datetime` 断言错误） |
| I9 | 上下文触发点可动态刷新，不再在 import 期算死 |
| I10 | `read_file` 默认不被上下文清理器清掉（任务锚点） |
