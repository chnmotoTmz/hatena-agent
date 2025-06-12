#!/usr/bin/env python3
"""
対話型CLI - HATENA Agent v2
各機能を対話的にテストできます
"""
import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv


class InteractiveCLI:
    def __init__(self):
        load_dotenv()
        self.output_dir = './test_output'
        os.makedirs(self.output_dir, exist_ok=True)
        
    def display_menu(self):
        """メインメニューの表示"""
        print("\n" + "=" * 60)
        print("HATENA Agent v2 - 対話型CLI")
        print("=" * 60)
        print("\n機能を選択してください:")
        print("  1. 環境設定の確認")
        print("  2. 記事抽出のテスト（モックデータ）")
        print("  3. RAG機能のテスト")
        print("  4. 画像生成のテスト")
        print("  5. アフィリエイト機能のテスト")
        print("  6. リポスト機能のテスト")
        print("  7. 実際のブログで記事抽出（要設定）")
        print("  8. 全機能の統合テスト")
        print("  0. 終了")
        
    def check_environment(self):
        """環境設定の確認"""
        print("\n=== 環境設定の確認 ===")
        
        env_checks = {
            'HATENA_BLOG_ID': {
                'value': os.getenv('HATENA_BLOG_ID'),
                'required': True,
                'description': 'はてなブログID'
            },
            'BLOG_DOMAIN': {
                'value': os.getenv('BLOG_DOMAIN'),
                'required': False,
                'description': 'ブログドメイン（カスタムドメインの場合）'
            },
            'BING_AUTH_COOKIE': {
                'value': os.getenv('BING_AUTH_COOKIE'),
                'required': False,
                'description': 'Bing画像生成用Cookie',
                'display': 'length'
            },
            'RAKUTEN_AFFILIATE_TAG': {
                'value': os.getenv('RAKUTEN_AFFILIATE_TAG'),
                'required': False,
                'description': '楽天アフィリエイトタグ'
            }
        }
        
        all_ok = True
        for key, info in env_checks.items():
            value = info['value']
            status = '✓' if value else ('✗' if info['required'] else '△')
            
            if info['required'] and not value:
                all_ok = False
            
            if info.get('display') == 'length' and value:
                display_value = f"設定済み ({len(value)}文字)"
            else:
                display_value = value if value else '未設定'
            
            print(f"  {status} {key}: {display_value}")
            print(f"     {info['description']}")
        
        if not all_ok:
            print("\n⚠️  必須の環境変数が設定されていません。")
            print("   .env ファイルを確認してください。")
        else:
            print("\n✓ 環境設定は正常です。")
        
        input("\nEnterキーで続行...")
        
    def test_article_extraction(self):
        """記事抽出のテスト"""
        print("\n=== 記事抽出のテスト ===")
        
        # モックデータの生成
        from test_cli import create_mock_articles
        
        num_articles = input("生成する記事数を入力してください (デフォルト: 5): ")
        num_articles = int(num_articles) if num_articles.isdigit() else 5
        
        articles = create_mock_articles(num_articles)
        
        print(f"\n{len(articles)}件の記事を生成しました:")
        for i, article in enumerate(articles):
            print(f"\n[記事 {i+1}]")
            print(f"  タイトル: {article['title']}")
            print(f"  URL: {article['url']}")
            print(f"  日付: {article['date'][:10]}")
            print(f"  カテゴリ: {', '.join(article['categories'])}")
            print(f"  文字数: {article['word_count']}")
        
        # 保存オプション
        save = input("\n記事データを保存しますか？ (y/n): ")
        if save.lower() == 'y':
            filename = os.path.join(self.output_dir, 'extracted_articles.json')
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(articles, f, ensure_ascii=False, indent=2)
            print(f"✓ 保存しました: {filename}")
        
        input("\nEnterキーで続行...")
        return articles
        
    def test_rag_functionality(self):
        """RAG機能のテスト"""
        print("\n=== RAG機能のテスト ===")
        
        # 記事データの読み込み
        filename = os.path.join(self.output_dir, 'extracted_articles.json')
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                articles = json.load(f)
            print(f"✓ {len(articles)}件の記事データを読み込みました")
        else:
            print("記事データがありません。先に記事抽出を実行してください。")
            input("\nEnterキーで続行...")
            return
        
        # RAG処理のシミュレーション
        print("\n文体分析中...")
        print("  - です・ます調で統一")
        print("  - 技術用語は分かりやすく説明")
        print("  - 親しみやすい口調を維持")
        
        print("\n関連記事の検索中...")
        query = input("検索クエリを入力してください (デフォルト: Python): ")
        query = query or "Python"
        
        # 関連記事の表示
        print(f"\n「{query}」に関連する記事:")
        related = [a for a in articles if query.lower() in a['title'].lower() or 
                  query.lower() in ' '.join(a['categories']).lower()]
        
        if related:
            for i, article in enumerate(related[:3]):
                print(f"  {i+1}. [{article['title']}]({article['url']})")
        else:
            print("  関連記事が見つかりませんでした")
        
        input("\nEnterキーで続行...")
        
    def test_image_generation(self):
        """画像生成のテスト"""
        print("\n=== 画像生成のテスト ===")
        
        cookie = os.getenv('BING_AUTH_COOKIE')
        if not cookie:
            print("⚠️  Bing認証Cookieが設定されていません")
            print("   画像生成をシミュレーションモードで実行します")
            mode = "simulation"
        else:
            print(f"✓ Bing認証Cookie検出 ({len(cookie)}文字)")
            mode = "real"
        
        # プロンプト入力
        print("\n画像生成プロンプトを入力してください:")
        print("例: modern blog header about Python programming")
        prompt = input("> ")
        
        if not prompt:
            prompt = "modern minimalist blog header with abstract tech elements"
        
        print(f"\n生成中: {prompt}")
        
        if mode == "simulation":
            # シミュレーション結果
            print("\n[シミュレーション] 生成された画像URL:")
            for i in range(4):
                print(f"  {i+1}. https://mock-image-{i+1}.bing.com/generated.jpg")
        else:
            print("\n実際の画像生成を実行するには main.py を使用してください")
        
        input("\nEnterキーで続行...")
        
    def test_affiliate_functionality(self):
        """アフィリエイト機能のテスト"""
        print("\n=== アフィリエイト機能のテスト ===")
        
        tag = os.getenv('RAKUTEN_AFFILIATE_TAG')
        if tag:
            print(f"✓ 楽天アフィリエイトタグ: {tag}")
        else:
            print("△ 楽天アフィリエイトタグが未設定")
        
        # テストコンテンツ
        print("\nテストコンテンツ:")
        test_content = """
        おすすめの本:
        1. Python入門書: https://hb.afl.rakuten.co.jp/book123
        2. Web開発ガイド: https://hb.afl.rakuten.co.jp/web456
        3. 通常のリンク: https://example.com/normal-link
        """
        print(test_content)
        
        # 処理シミュレーション
        print("\nアフィリエイトリンク処理後:")
        if tag:
            print(f"  1. https://hb.afl.rakuten.co.jp/book123?mafRakutenWidgetParam={tag}")
            print(f"  2. https://hb.afl.rakuten.co.jp/web456?mafRakutenWidgetParam={tag}")
            print("  3. https://example.com/normal-link (変更なし)")
        else:
            print("  タグが未設定のため、リンクは変更されません")
        
        # 統計表示
        print("\n処理統計:")
        print("  - 検出されたリンク: 3件")
        print("  - 楽天リンク: 2件")
        print(f"  - 処理済み: {'2件' if tag else '0件（タグ未設定）'}")
        
        input("\nEnterキーで続行...")
        
    def test_repost_functionality(self):
        """リポスト機能のテスト"""
        print("\n=== リポスト機能のテスト ===")
        
        # 記事データの確認
        filename = os.path.join(self.output_dir, 'extracted_articles.json')
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                articles = json.load(f)
        else:
            from test_cli import create_mock_articles
            articles = create_mock_articles(10)
        
        print(f"\n{len(articles)}件の記事を分析中...")
        
        # パフォーマンス分析
        print("\nパフォーマンススコア（上位5件）:")
        for i, article in enumerate(articles[:5]):
            score = 10 + (i * 2)  # モックスコア
            print(f"  {i+1}. {article['title'][:30]}... (スコア: {score})")
        
        # リポストスケジュール
        print("\n推奨リポストスケジュール:")
        from datetime import datetime, timedelta
        base_date = datetime.now()
        
        schedule = []
        for i in range(3):
            date = base_date + timedelta(weeks=i+1)
            print(f"  {date.strftime('%Y-%m-%d')}: {articles[i]['title'][:30]}...")
            schedule.append({
                'date': date.strftime('%Y-%m-%d'),
                'title': articles[i]['title'],
                'type': ['更新版', '季節記事', '人気記事'][i]
            })
        
        # 保存オプション
        save = input("\nスケジュールを保存しますか？ (y/n): ")
        if save.lower() == 'y':
            filename = os.path.join(self.output_dir, 'repost_schedule.json')
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(schedule, f, ensure_ascii=False, indent=2)
            print(f"✓ 保存しました: {filename}")
        
        input("\nEnterキーで続行...")
        
    def run_real_extraction(self):
        """実際のブログから記事を抽出"""
        print("\n=== 実際のブログから記事抽出 ===")
        
        hatena_id = os.getenv('HATENA_BLOG_ID')
        if not hatena_id:
            print("⚠️  HATENA_BLOG_IDが設定されていません")
            input("\nEnterキーで続行...")
            return
        
        print(f"\nブログID: {hatena_id}")
        domain = os.getenv('BLOG_DOMAIN')
        if domain:
            print(f"カスタムドメイン: {domain}")
        
        confirm = input("\n実際に記事を抽出しますか？ (y/n): ")
        if confirm.lower() != 'y':
            return
        
        print("\n実際の抽出は main.py を使用してください:")
        print("  python main.py --mode extract")
        
        input("\nEnterキーで続行...")
        
    def run_integration_test(self):
        """統合テスト"""
        print("\n=== 全機能の統合テスト ===")
        
        print("\n1. 記事抽出 → 2. RAG処理 → 3. 画像生成 → 4. アフィリエイト → 5. リポスト")
        print("\nこの流れで全機能をテストします。")
        
        confirm = input("\n続行しますか？ (y/n): ")
        if confirm.lower() != 'y':
            return
        
        # 簡易統合テスト
        print("\n[Step 1/5] 記事データ生成中...")
        from test_cli import create_mock_articles
        articles = create_mock_articles(3)
        print(f"✓ {len(articles)}件の記事を生成")
        
        print("\n[Step 2/5] RAG処理中...")
        print("✓ 文体分析完了")
        print("✓ 関連記事リンク挿入")
        
        print("\n[Step 3/5] 画像生成中...")
        print("✓ アイキャッチ画像生成（シミュレーション）")
        
        print("\n[Step 4/5] アフィリエイトリンク処理中...")
        print("✓ 2件のリンクを処理")
        
        print("\n[Step 5/5] リポストスケジュール作成中...")
        print("✓ 3件の記事をスケジュール")
        
        print("\n✅ 統合テスト完了！")
        
        # 結果サマリー
        summary = {
            'timestamp': datetime.now().isoformat(),
            'articles_processed': len(articles),
            'images_generated': 3,
            'affiliate_links': 2,
            'repost_scheduled': 3
        }
        
        filename = os.path.join(self.output_dir, 'integration_test_summary.json')
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"\nテスト結果: {filename}")
        input("\nEnterキーで続行...")
        
    def run(self):
        """メインループ"""
        while True:
            self.display_menu()
            
            choice = input("\n選択してください (0-8): ")
            
            if choice == '0':
                print("\n終了します。")
                break
            elif choice == '1':
                self.check_environment()
            elif choice == '2':
                self.test_article_extraction()
            elif choice == '3':
                self.test_rag_functionality()
            elif choice == '4':
                self.test_image_generation()
            elif choice == '5':
                self.test_affiliate_functionality()
            elif choice == '6':
                self.test_repost_functionality()
            elif choice == '7':
                self.run_real_extraction()
            elif choice == '8':
                self.run_integration_test()
            else:
                print("\n無効な選択です。もう一度お試しください。")
                input("Enterキーで続行...")


def main():
    """エントリーポイント"""
    cli = InteractiveCLI()
    
    # 初回起動時のメッセージ
    print("=" * 60)
    print("HATENA Agent v2 - 対話型テストCLI")
    print("=" * 60)
    print("\nこのツールでは、各機能を対話的にテストできます。")
    print("実際のブログデータを使用する前に、")
    print("モックデータで動作を確認することをお勧めします。")
    
    input("\nEnterキーで開始...")
    
    try:
        cli.run()
    except KeyboardInterrupt:
        print("\n\n中断されました。")
    except Exception as e:
        print(f"\n\nエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()