#!/usr/bin/env python3
"""
モックサーバー - ローカルテスト用のHTTPサーバー
実際のはてなブログにアクセスせずにテストできます
"""
import http.server
import socketserver
import json
from urllib.parse import urlparse, parse_qs
import threading
import time


class MockHatenaServer(http.server.BaseHTTPRequestHandler):
    """はてなブログのモックサーバー"""
    
    def do_GET(self):
        """GETリクエストの処理"""
        parsed_path = urlparse(self.path)
        
        if '/archive' in parsed_path.path:
            # アーカイブページのモック
            self.send_archive_page()
        elif '/entry/' in parsed_path.path:
            # 個別記事ページのモック
            self.send_article_page()
        else:
            self.send_error(404, "Not Found")
    
    def send_archive_page(self):
        """アーカイブページのモックレスポンス"""
        html = """
        <html>
        <head><title>テストブログ - アーカイブ</title></head>
        <body>
            <article class="archive-entry">
                <h1 class="entry-title">
                    <a href="/entry/2024/01/test-article-1">テスト記事1: Pythonの基礎</a>
                </h1>
                <time datetime="2024-01-01T10:00:00+09:00">2024-01-01</time>
                <a class="archive-category-link">Python</a>
                <a class="archive-category-link">プログラミング</a>
                <p class="entry-description">Pythonプログラミングの基礎について解説します。</p>
            </article>
            
            <article class="archive-entry">
                <h1 class="entry-title">
                    <a href="/entry/2024/02/test-article-2">テスト記事2: Web開発入門</a>
                </h1>
                <time datetime="2024-02-01T10:00:00+09:00">2024-02-01</time>
                <a class="archive-category-link">Web開発</a>
                <p class="entry-description">Webアプリケーション開発の基本を学びます。</p>
            </article>
        </body>
        </html>
        """
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def send_article_page(self):
        """個別記事ページのモックレスポンス"""
        html = """
        <html>
        <head><title>テスト記事 - 詳細</title></head>
        <body>
            <div class="entry-content">
                <h1>記事の詳細内容</h1>
                <p>これはテスト記事の本文です。</p>
                <img src="/images/test.jpg" alt="テスト画像">
                <p>プログラミングについて詳しく説明しています。</p>
                <a href="https://example.com/reference">参考リンク</a>
                <p>楽天で買える本: <a href="https://hb.afl.rakuten.co.jp/book123">プログラミング入門書</a></p>
            </div>
        </body>
        </html>
        """
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def log_message(self, format, *args):
        """ログ出力をカスタマイズ"""
        print(f"[MockServer] {format % args}")


def start_mock_server(port=8888):
    """モックサーバーを起動"""
    with socketserver.TCPServer(("", port), MockHatenaServer) as httpd:
        print(f"モックサーバーを起動しました: http://localhost:{port}")
        print("Ctrl+C で停止します")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nモックサーバーを停止しました")


class MockBingImageAPI:
    """Bing Image Creator APIのモック"""
    
    @staticmethod
    def generate_images(prompt, count=4):
        """画像生成のモック"""
        print(f"[Mock Bing] 画像生成リクエスト: '{prompt[:50]}...'")
        
        # ダミーの画像URLを返す
        mock_urls = []
        for i in range(count):
            mock_urls.append(f"https://mock-bing-image-{i+1}.example.com/{prompt.replace(' ', '-')[:30]}.jpg")
        
        time.sleep(1)  # API呼び出しをシミュレート
        print(f"[Mock Bing] {len(mock_urls)}枚の画像を生成しました")
        
        return mock_urls


def create_test_environment():
    """テスト環境のセットアップ"""
    import os
    
    # テスト用の.envファイルを作成
    test_env_content = """# テスト環境用の設定
HATENA_BLOG_ID=test-blog
BLOG_DOMAIN=localhost:8888
BING_AUTH_COOKIE=mock-cookie-for-testing
RAKUTEN_AFFILIATE_TAG=test-affiliate-tag
"""
    
    with open('.env.test', 'w') as f:
        f.write(test_env_content)
    
    print("テスト環境を作成しました:")
    print("  - .env.test ファイルを作成")
    print("  - モックサーバーのポート: 8888")
    print("\n使用方法:")
    print("  1. python src/utils/mock_server.py でモックサーバーを起動")
    print("  2. 別ターミナルで python main.py --mode extract を実行")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--setup':
        create_test_environment()
    else:
        # モックサーバーを起動
        start_mock_server()