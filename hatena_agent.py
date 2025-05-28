import os
import requests
from xml.etree import ElementTree as ET
from xml.dom import minidom
from adk import Agent, Tool
from dotenv import load_dotenv
from typing import Dict, List
from datetime import datetime
import hashlib
import random
import base64

# 環境変数の読み込み
load_dotenv()

def load_credentials(username: str) -> tuple:
    """はてなAPIアクセスに必要な認証情報をタプルの形式で返す"""
    env_key = f"HATENA_BLOG_ATOMPUB_KEY_{username}"
    api_key = os.getenv(env_key)
    assert api_key, f"環境変数 {env_key} が設定されていません"
    return (username, api_key)

def wsse(username: str, api_key: str) -> str:
    """WSSEヘッダーを生成する"""
    nonce = hashlib.sha1(str(random.random()).encode()).digest()
    now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    password_digest = hashlib.sha1(nonce + now.encode() + api_key.encode()).digest()
    
    return f'''UsernameToken Username="{username}", PasswordDigest="{base64.b64encode(password_digest).decode()}", Nonce="{base64.b64encode(nonce).decode()}", Created="{now}"'''

def create_post_data(title: str, body: str, username: str, draft: str = 'no') -> bytes:
    """投稿用のXMLデータを生成する"""
    now = datetime.now()
    dtime = now.strftime("%Y-%m-%dT%H:%M:%S")
    template = '''<?xml version="1.0" encoding="utf-8"?>
<entry xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://www.w3.org/2007/app">
    <title>{0}</title>
    <author><name>{1}</name></author>
    <content type="text/html">{2}</content>
    <updated>{3}</updated>
    <category term="" />
    <app:control>
        <app:draft>{4}</app:draft>
    </app:control>
</entry>'''
    data = template.format(
        title,
        username,
        body.strip(),
        dtime,
        draft
    ).encode('utf-8')
    return data

def post_blog_entry(title: str, content: str) -> dict:
    """はてなブログに新規エントリを投稿する"""
    hatena_id = os.getenv("HATENA_ID", "motochan1969")
    blog_domain = os.getenv("BLOG_DOMAIN", "lifehacking1919.hatenablog.jp")
    username, api_key = load_credentials(hatena_id)

    data = create_post_data(title, content, username)
    headers = {'X-WSSE': wsse(username, api_key)}
    url = f'https://blog.hatena.ne.jp/{username}/{blog_domain}/atom/entry'

    try:
        response = requests.post(url, data=data, headers=headers)
        if response.status_code == 201:
            entry_id = response.headers.get("Location", "").split("/")[-1]
            return {"status": "success", "entry_id": entry_id}
        else:
            return {"status": "error", "message": response.text}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def edit_blog_entry(entry_id: str, title: str, content: str) -> dict:
    """はてなブログの既存エントリを編集する"""
    hatena_id = os.getenv("HATENA_ID", "motochan1969")
    blog_domain = os.getenv("BLOG_DOMAIN", "lifehacking1919.hatenablog.jp")
    username, api_key = load_credentials(hatena_id)

    data = create_post_data(title, content, username)
    headers = {'X-WSSE': wsse(username, api_key)}
    url = f'https://blog.hatena.ne.jp/{username}/{blog_domain}/atom/entry/{entry_id}'

    try:
        response = requests.put(url, data=data, headers=headers)
        if response.status_code == 200:
            return {"status": "success"}
        else:
            return {"status": "error", "message": response.text}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_blog_entries() -> List[Dict]:
    """ブログエントリの一覧を取得する"""
    hatena_id = os.getenv("HATENA_ID", "motochan1969")
    blog_domain = os.getenv("BLOG_DOMAIN", "lifehacking1919.hatenablog.jp")
    username, api_key = load_credentials(hatena_id)

    root_endpoint = f"https://blog.hatena.ne.jp/{hatena_id}/{blog_domain}/atom"
    blog_entries_uri = f"{root_endpoint}/entry"
    entries = []

    while blog_entries_uri:
        response = requests.get(blog_entries_uri, auth=(username, api_key))
        if response.status_code != 200:
            break

        root = ET.fromstring(response.text)
        next_link = root.find(".//{http://www.w3.org/2005/Atom}link[@rel='next']")
        blog_entries_uri = next_link.get('href') if next_link is not None else None

        for entry in root.findall(".//{http://www.w3.org/2005/Atom}entry"):
            title = entry.find("{http://www.w3.org/2005/Atom}title").text
            entry_id = entry.find("{http://www.w3.org/2005/Atom}id").text.split("/")[-1]
            entries.append({"id": entry_id, "title": title})

    return entries

# カスタムツールの作成
post_tool = Tool(
    func=post_blog_entry,
    name="post_blog_entry",
    description="Hatena Blog に新規エントリを投稿します。"
)

edit_tool = Tool(
    func=edit_blog_entry,
    name="edit_blog_entry",
    description="Hatena Blog の既存エントリを編集します。"
)

# エージェントの作成
agent = Agent(
    tools=[post_tool, edit_tool],
    model="gemini-1.5-flash",
    name="HatenaBlogAgent"
)

# エージェントの実行例
if __name__ == "__main__":
    # 新規投稿の例
    result = agent.run("Hatena Blog に新しい記事を投稿してください。タイトルは「サンプル記事」で、本文は「これはサンプルです。」です。")
    print(result)

    # 編集の例（entry_id は実際のエントリIDに置き換える）
    result = agent.run("Hatena Blog のエントリID: 12345 を編集してください。新しいタイトルは「更新されたタイトル」で、本文は「これは更新された内容です。」です。")
    print(result)
