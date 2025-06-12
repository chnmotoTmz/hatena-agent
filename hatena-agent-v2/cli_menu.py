#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import time
import json
from datetime import datetime
from typing import Optional, Dict, List
import subprocess

# カラーコード定義
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def clear_screen():
    """画面をクリア"""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header():
    """ヘッダー表示"""
    clear_screen()
    print(Colors.CYAN + "=" * 60 + Colors.ENDC)
    print(Colors.BOLD + Colors.HEADER + "     HATENA Agent v2 - 統合管理システム     " + Colors.ENDC)
    print(Colors.CYAN + "=" * 60 + Colors.ENDC)
    print()

def print_menu():
    """メインメニュー表示"""
    print(Colors.YELLOW + "【メインメニュー】" + Colors.ENDC)
    print()
    print("  1. " + Colors.GREEN + "📝 記事管理" + Colors.ENDC)
    print("  2. " + Colors.BLUE + "🔧 エージェント実行" + Colors.ENDC)
    print("  3. " + Colors.CYAN + "🧪 テスト・検証" + Colors.ENDC)
    print("  4. " + Colors.YELLOW + "⚙️  設定管理" + Colors.ENDC)
    print("  5. " + Colors.BOLD + "📊 ステータス確認" + Colors.ENDC)
    print("  6. " + Colors.RED + "🚪 終了" + Colors.ENDC)
    print()

def print_article_menu():
    """記事管理メニュー"""
    print_header()
    print(Colors.GREEN + "【記事管理メニュー】" + Colors.ENDC)
    print()
    print("  1. 記事一覧を取得")
    print("  2. 記事を抽出（最新N件）")
    print("  3. 抽出済み記事を表示")
    print("  4. 記事統計を表示")
    print("  5. メインメニューに戻る")
    print()

def print_agent_menu():
    """エージェント実行メニュー"""
    print_header()
    print(Colors.BLUE + "【エージェント実行メニュー】" + Colors.ENDC)
    print()
    print("  1. " + Colors.BOLD + "🚀 フル実行" + Colors.ENDC + " (抽出→強化→リポスト)")
    print("  2. 📥 記事抽出のみ")
    print("  3. ✨ 記事強化のみ (RAG/画像/アフィリエイト)")
    print("  4. 📅 リポスト計画作成のみ")
    print("  5. 🖼️  画像生成のみ")
    print("  6. 🔗 アフィリエイトリンク管理")
    print("  7. メインメニューに戻る")
    print()

def print_test_menu():
    """テスト・検証メニュー"""
    print_header()
    print(Colors.CYAN + "【テスト・検証メニュー】" + Colors.ENDC)
    print()
    print("  1. 全機能テスト（モックデータ）")
    print("  2. 記事抽出テスト")
    print("  3. RAG機能テスト")
    print("  4. 画像生成テスト")
    print("  5. アフィリエイト機能テスト")
    print("  6. リポスト機能テスト")
    print("  7. メインメニューに戻る")
    print()

def print_settings_menu():
    """設定管理メニュー"""
    print_header()
    print(Colors.YELLOW + "【設定管理メニュー】" + Colors.ENDC)
    print()
    print("  1. 環境変数を確認")
    print("  2. .envファイルを編集")
    print("  3. APIキーの検証")
    print("  4. ブログ接続テスト")
    print("  5. 依存関係の確認")
    print("  6. メインメニューに戻る")
    print()

def check_env_status():
    """環境設定の状態を確認"""
    status = {
        "env_file": os.path.exists(".env"),
        "venv": os.path.exists("venv"),
        "output_dir": os.path.exists("output"),
        "hatena_id": os.getenv("HATENA_BLOG_ID", "未設定"),
        "blog_domain": os.getenv("BLOG_DOMAIN", "未設定")
    }
    return status

def display_status():
    """ステータス表示"""
    print_header()
    print(Colors.BOLD + "【システムステータス】" + Colors.ENDC)
    print()
    
    status = check_env_status()
    
    # 環境状態
    print(Colors.YELLOW + "環境設定:" + Colors.ENDC)
    print(f"  .envファイル: {Colors.GREEN + '✓' if status['env_file'] else Colors.RED + '✗'} {Colors.ENDC}")
    print(f"  仮想環境: {Colors.GREEN + '✓' if status['venv'] else Colors.RED + '✗'} {Colors.ENDC}")
    print(f"  出力ディレクトリ: {Colors.GREEN + '✓' if status['output_dir'] else Colors.RED + '✗'} {Colors.ENDC}")
    print()
    
    # ブログ設定
    print(Colors.YELLOW + "ブログ設定:" + Colors.ENDC)
    print(f"  はてなID: {status['hatena_id']}")
    print(f"  ブログドメイン: {status['blog_domain']}")
    print()
    
    # 最新の実行結果
    print(Colors.YELLOW + "最新の実行結果:" + Colors.ENDC)
    if os.path.exists("output/extracted_articles.json"):
        try:
            with open("output/extracted_articles.json", "r", encoding="utf-8") as f:
                articles = json.load(f)
                print(f"  抽出済み記事数: {len(articles)}件")
                if articles:
                    latest = articles[0]
                    print(f"  最新記事: {latest.get('title', 'タイトルなし')[:30]}...")
        except:
            print("  記事データ読み込みエラー")
    else:
        print("  まだ記事を抽出していません")
    
    print()
    input("Enterキーでメニューに戻る...")

def execute_command(command: str, description: str):
    """コマンド実行とプログレス表示"""
    print()
    print(Colors.BLUE + f"実行中: {description}" + Colors.ENDC)
    print(Colors.YELLOW + "-" * 40 + Colors.ENDC)
    
    try:
        # リアルタイムで出力を表示
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        for line in iter(process.stdout.readline, ''):
            if line:
                print(line.rstrip())
        
        process.wait()
        
        if process.returncode == 0:
            print()
            print(Colors.GREEN + "✓ 実行完了！" + Colors.ENDC)
        else:
            print()
            print(Colors.RED + "✗ エラーが発生しました" + Colors.ENDC)
            
    except Exception as e:
        print(Colors.RED + f"実行エラー: {e}" + Colors.ENDC)
    
    print()
    input("Enterキーで続行...")

def handle_article_management():
    """記事管理の処理"""
    while True:
        print_article_menu()
        choice = input("選択してください (1-5): ")
        
        if choice == "1":
            execute_command(
                "python3 main.py --mode extract",
                "はてなブログから記事一覧を取得"
            )
        elif choice == "2":
            num = input("取得する記事数を入力 (デフォルト: 全件): ")
            cmd = "python3 main.py --mode extract"
            if num.isdigit():
                cmd += f" --max-articles {num}"
            execute_command(cmd, f"最新{num}件の記事を抽出")
        elif choice == "3":
            if os.path.exists("output/extracted_articles.json"):
                execute_command(
                    "python3 -m json.tool output/extracted_articles.json | head -50",
                    "抽出済み記事を表示"
                )
            else:
                print(Colors.RED + "まだ記事が抽出されていません" + Colors.ENDC)
                input("Enterキーで続行...")
        elif choice == "4":
            # 記事統計表示
            if os.path.exists("output/extracted_articles.json"):
                try:
                    with open("output/extracted_articles.json", "r", encoding="utf-8") as f:
                        articles = json.load(f)
                        print(f"\n総記事数: {len(articles)}")
                        if articles:
                            categories = {}
                            for article in articles:
                                for cat in article.get("categories", []):
                                    categories[cat] = categories.get(cat, 0) + 1
                            print("\nカテゴリ別記事数:")
                            for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True)[:10]:
                                print(f"  {cat}: {count}件")
                except:
                    print(Colors.RED + "記事データの読み込みに失敗しました" + Colors.ENDC)
            else:
                print(Colors.RED + "まだ記事が抽出されていません" + Colors.ENDC)
            input("\nEnterキーで続行...")
        elif choice == "5":
            break

def handle_agent_execution():
    """エージェント実行の処理"""
    while True:
        print_agent_menu()
        choice = input("選択してください (1-7): ")
        
        if choice == "1":
            execute_command(
                "python3 main.py --mode full",
                "全機能実行 (抽出→強化→リポスト)"
            )
        elif choice == "2":
            execute_command(
                "python3 main.py --mode extract",
                "記事抽出のみ実行"
            )
        elif choice == "3":
            execute_command(
                "python3 main.py --mode enhance",
                "記事強化のみ実行"
            )
        elif choice == "4":
            execute_command(
                "python3 main.py --mode repost",
                "リポスト計画作成"
            )
        elif choice == "5":
            # 画像生成のみ
            print(Colors.YELLOW + "画像生成機能は記事強化の一部として実行されます" + Colors.ENDC)
            input("Enterキーで続行...")
        elif choice == "6":
            # アフィリエイトリンク管理
            print(Colors.YELLOW + "アフィリエイト機能は記事強化の一部として実行されます" + Colors.ENDC)
            input("Enterキーで続行...")
        elif choice == "7":
            break

def handle_test_verification():
    """テスト・検証の処理"""
    while True:
        print_test_menu()
        choice = input("選択してください (1-7): ")
        
        if choice == "1":
            execute_command(
                "python3 test_cli.py",
                "全機能テスト（モックデータ）"
            )
        elif choice == "2":
            execute_command(
                "python3 test_cli.py --test extract",
                "記事抽出テスト"
            )
        elif choice == "3":
            execute_command(
                "python3 test_cli.py --test rag",
                "RAG機能テスト"
            )
        elif choice == "4":
            execute_command(
                "python3 test_cli.py --test image",
                "画像生成テスト"
            )
        elif choice == "5":
            execute_command(
                "python3 test_cli.py --test affiliate",
                "アフィリエイト機能テスト"
            )
        elif choice == "6":
            execute_command(
                "python3 test_cli.py --test repost",
                "リポスト機能テスト"
            )
        elif choice == "7":
            break

def handle_settings():
    """設定管理の処理"""
    while True:
        print_settings_menu()
        choice = input("選択してください (1-6): ")
        
        if choice == "1":
            # 環境変数確認
            print_header()
            print(Colors.YELLOW + "【環境変数】" + Colors.ENDC)
            print()
            env_vars = [
                "HATENA_BLOG_ID",
                "BLOG_DOMAIN",
                "RAKUTEN_AFFILIATE_TAG",
                "BING_AUTH_COOKIE"
            ]
            for var in env_vars:
                value = os.getenv(var, "未設定")
                if value != "未設定" and len(value) > 20:
                    value = value[:20] + "..."
                print(f"{var}: {value}")
            print()
            input("Enterキーで続行...")
        elif choice == "2":
            # .envファイル編集
            if os.path.exists(".env"):
                editor = os.getenv("EDITOR", "nano")
                os.system(f"{editor} .env")
            else:
                print(Colors.RED + ".envファイルが存在しません" + Colors.ENDC)
                input("Enterキーで続行...")
        elif choice == "3":
            # APIキー検証
            execute_command(
                "python3 -c \"import os; print('HATENA_BLOG_ID:', 'OK' if os.getenv('HATENA_BLOG_ID') else 'NG')\"",
                "APIキーの検証"
            )
        elif choice == "4":
            # ブログ接続テスト
            domain = os.getenv("BLOG_DOMAIN", "")
            if domain:
                execute_command(
                    f"curl -s -I https://{domain} | head -5",
                    "ブログ接続テスト"
                )
            else:
                print(Colors.RED + "BLOG_DOMAINが設定されていません" + Colors.ENDC)
                input("Enterキーで続行...")
        elif choice == "5":
            # 依存関係確認
            execute_command(
                "pip list | grep -E 'requests|beautifulsoup4|chromadb|langchain|bingart'",
                "依存関係の確認"
            )
        elif choice == "6":
            break

def main():
    """メイン処理"""
    while True:
        print_header()
        print_menu()
        
        choice = input("選択してください (1-6): ")
        
        if choice == "1":
            handle_article_management()
        elif choice == "2":
            handle_agent_execution()
        elif choice == "3":
            handle_test_verification()
        elif choice == "4":
            handle_settings()
        elif choice == "5":
            display_status()
        elif choice == "6":
            print()
            print(Colors.GREEN + "HATENA Agent v2 を終了します。" + Colors.ENDC)
            print("ありがとうございました！")
            sys.exit(0)
        else:
            print(Colors.RED + "無効な選択です。もう一度入力してください。" + Colors.ENDC)
            time.sleep(1)

if __name__ == "__main__":
    try:
        # 仮想環境のアクティベートを確認
        if not os.path.exists("venv") and not os.getenv("VIRTUAL_ENV"):
            print(Colors.YELLOW + "警告: 仮想環境がアクティベートされていません" + Colors.ENDC)
            print("以下のコマンドで仮想環境をアクティベートしてください:")
            print("  source venv/bin/activate  (Linux/Mac)")
            print("  venv\\Scripts\\activate    (Windows)")
            print()
            
        main()
    except KeyboardInterrupt:
        print()
        print(Colors.YELLOW + "\n中断されました。" + Colors.ENDC)
        sys.exit(0)
    except Exception as e:
        print(Colors.RED + f"\nエラーが発生しました: {e}" + Colors.ENDC)
        sys.exit(1)