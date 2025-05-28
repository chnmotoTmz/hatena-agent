from google.adk import Agent

def hello_world():
    """単純な挨拶を返す関数"""
    return "Hello, World!"

# エージェントの作成
agent = Agent(name="TestAgent")

if __name__ == "__main__":
    # 動作確認
    print("Starting test...")
    try:
        result = agent.run("Say hello")
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")
