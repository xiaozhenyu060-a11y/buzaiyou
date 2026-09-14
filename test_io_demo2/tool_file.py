from langchain.tools import tool          #工具类
import datetime
from langchain.agents.middleware import wrap_tool_call
from langchain_core.messages import ToolMessage


class Toolkit:
    @classmethod            #classmethod中间件相当于类本身,cls相当于toolkit
    def get_tools(cls):
        """返回工具列表,方便主文件使用"""
        return [cls.get_current_date,cls.trigger_error]      

    @classmethod
    def get_middleware(cls):
        """返回中间件列表,方便主文件使用"""
        return [cls.log_tool_call]

#----------------------------------------------------

    @staticmethod             #相当于将该方法变成静态方法,不需要传入self
    @wrap_tool_call
    def log_tool_call(request,handler):
        """非工具-用来查看工具调用情况以及工具出错提示"""
        tool_name = request.tool_call['name'] #取出要调用工具的名字
        tool_call_id =request.tool_call['id']

        print(f"工具 [{tool_name} 执行开始-------]")
        try:
            result = handler(request) 
        except Exception as error:
            return ToolMessage(
                content=f'工具调用失败:{error}',
                tool_call_id = tool_call_id,
                name = tool_name,
            )                           #
        print(f"工具 [{tool_name} 执行完毕-------]")

        return result


#----------------------------------------------------
    
    @staticmethod
    @tool
    def get_current_date():
        """工具-获取今天的日期"""
        raise RuntimeError("日期工具坏了")     # 临时制造错误
        return datetime.datetime.today().strftime("%Y-%m-%d")

    @staticmethod
    @tool
    def trigger_error() -> str:
        """测试用工具-故意抛出异常，用来验证错误处理"""
        raise ValueError("这是故意制造的测试错误")

#----------------------------------------------------


    @staticmethod
    def print_agent_trace(response):
        """非工具-打印 agent 的完整执行过程，方便调试"""
        for message in response["messages"]:
            message_type = type(message).__name__         #通过type判断是否是用户内容和ai输出的数据类型    ai:AIMessage    用户:HumanMessage

            if message_type == 'HumanMessage':
                print(f"\n👤 [User] {message.content}")

            elif message_type == "AIMessage":   # 模型输出
                reasoning = message.additional_kwargs.get('reasoning_content')

                if reasoning:
                    print(f"\n🧠 [Thinking] {reasoning}")

                if message.tool_calls:
                    for tool_call in message.tool_calls:
                        print(f"\n🔧 [Tool Call] {tool_call['name']}({tool_call['args']})")

                if message.content:
                    print(f"\n🤖 [AI] {message.content}")
            elif message_type == 'ToolMessage':
                print(f"\n📦 [Tool Result] {message.name} -> {message.content}")