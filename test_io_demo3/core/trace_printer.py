class TracePrinter:
    @staticmethod
    def print_agent_trace(response):
        """非工具-打印 agent 的完整执行过程"""
        for message in response["messages"]:
            message_type = type(message).__name__

            if message_type == "HumanMessage":
                print(f"\n👤 [User] {message.content}")

            elif message_type == "AIMessage":
                reasoning = message.additional_kwargs.get("reasoning_content")
                if reasoning:
                    print(f"\n🧠 [Thinking] {reasoning}")

                if message.tool_calls:
                    for tool_call in message.tool_calls:
                        print(f"\n🔧 [Tool Call] {tool_call['name']}({tool_call['args']})")

                if message.content:
                    print(f"\n🤖 [AI] {message.content}")

            elif message_type == "ToolMessage":
                print(f"\n📦 [Tool Result] {message.name} -> {message.content}")