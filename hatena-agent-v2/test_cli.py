#!/usr/bin/env python3
import os
import argparse
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# テスト用のモックデータとヘルパー関数
def create_mock_articles(num_articles=5):
    """テスト用の記事データを生成"""
    mock_articles = []
    
    for i in range(num_articles):
        article = {
            'title': f'テスト記事 {i+1}: プログラミングのベストプラクティス',
            'url': f'https://example.hatenablog.com/entry/2023/0{i+1}/test-article-{i+1}',
            'date': (datetime.now() - timedelta(days=i*30)).isoformat(),
            'categories': ['プログラミング', 'Python', 'テスト'],
            'summary': f'この記事では、プログラミングにおける重要なポイント{i+1}について解説します。',
            'full_content': f"""
# テスト記事 {i+1}の内容

プログラミングは楽しいですね。特にPythonは初心者にも優しい言語です。

## セクション1: 基本概念
Pythonの基本的な概念について説明します。
変数、関数、クラスなどの重要な要素を学びましょう。

## セクション2: 実践的なコード
```python
def hello_world():
    print("Hello, World!")
```

## セクション3: 応用編
より高度な技術について解説します。
デコレータやジェネレータなどの概念も重要です。

楽天で購入できる参考書: https://hb.afl.rakuten.co.jp/test-book-{i+1}
""",
            'word_count': 150 + i * 50,
            'images': [
                {'url': f'/images/test-{i+1}.jpg', 'alt': f'テスト画像{i+1}'}
            ],
            'links': [
                {'url': f'https://example.com/ref-{i+1}', 'text': f'参考リンク{i+1}'}
            ]
        }
        mock_articles.append(article)
    
    return mock_articles


def test_article_extraction():
    """記事抽出機能のテスト"""
    print("\n=== 記事抽出機能のテスト ===")
    
    mock_articles = create_mock_articles(3)
    
    print(f"テスト: {len(mock_articles)}件の記事を抽出")
    for i, article in enumerate(mock_articles):
        print(f"  [{i+1}] {article['title']}")
        print(f"      URL: {article['url']}")
        print(f"      日付: {article['date'][:10]}")
        print(f"      カテゴリ: {', '.join(article['categories'])}")
    
    # 出力ディレクトリに保存
    os.makedirs('./test_output', exist_ok=True)
    with open('./test_output/mock_articles.json', 'w', encoding='utf-8') as f:
        json.dump(mock_articles, f, ensure_ascii=False, indent=2)
    
    print("\n✓ 記事抽出完了 - ./test_output/mock_articles.json に保存")
    return mock_articles


def test_retrieval_agent(articles):
    """RAG機能のテスト（モック）"""
    print("\n=== リトリーブエージェント（RAG）のテスト ===")
    
    if not articles:
        print("記事データがありません")
        return
    
    # 文体分析のモック
    print("\n文体分析結果（モック）:")
    print("  - 文末表現: です・ます調")
    print("  - 語彙: 技術用語を適度に使用、親しみやすい表現")
    print("  - 文章の長さ: 1文20-40文字程度")
    
    # 関連記事の検索モック
    print("\n関連記事の検索結果:")
    sample_content = articles[0]['full_content'][:200]
    print(f"  検索クエリ: '{sample_content[:50]}...'")
    
    related_articles = [
        f"- [{articles[1]['title']}]({articles[1]['url']})",
        f"- [{articles[2]['title']}]({articles[2]['url']})"
    ]
    
    print("  関連記事:")
    for article in related_articles:
        print(f"    {article}")
    
    # 強化されたコンテンツの例
    enhanced_content = f"""
{sample_content}

関連記事もぜひご覧ください：
{chr(10).join(related_articles)}

このような形で、過去の記事へのリンクを自然に挿入できます。
"""
    
    with open('./test_output/enhanced_content.txt', 'w', encoding='utf-8') as f:
        f.write(enhanced_content)
    
    print("\n✓ RAG処理完了 - ./test_output/enhanced_content.txt に保存")


def test_image_generation():
    """画像生成機能のテスト（モック）"""
    print("\n=== 画像生成機能のテスト ===")
    
    # Bing認証クッキーの確認
    bing_cookie = os.getenv('BING_AUTH_COOKIE')
    if bing_cookie:
        print(f"✓ Bing認証クッキー検出 (長さ: {len(bing_cookie)}文字)")
    else:
        print("✗ Bing認証クッキーが設定されていません")
    
    # 画像生成のモック
    print("\n画像生成シミュレーション:")
    mock_prompts = [
        "Professional blog header image about Python programming",
        "Clean illustration of coding best practices",
        "Modern tech blog featured image"
    ]
    
    mock_results = []
    for i, prompt in enumerate(mock_prompts):
        print(f"  [{i+1}] プロンプト: {prompt[:50]}...")
        mock_url = f"https://mock-image-{i+1}.bing.com/generated.jpg"
        mock_results.append({
            'prompt': prompt,
            'url': mock_url,
            'local_path': f'./test_output/images/generated_{i+1}.jpg'
        })
        print(f"      → 生成画像URL: {mock_url}")
    
    # モック画像情報を保存
    os.makedirs('./test_output/images', exist_ok=True)
    with open('./test_output/image_generation_log.json', 'w', encoding='utf-8') as f:
        json.dump(mock_results, f, ensure_ascii=False, indent=2)
    
    print("\n✓ 画像生成ログ保存 - ./test_output/image_generation_log.json")


def test_affiliate_manager(articles):
    """アフィリエイト機能のテスト"""
    print("\n=== アフィリエイト管理機能のテスト ===")
    
    # 楽天アフィリエイトタグの確認
    rakuten_tag = os.getenv('RAKUTEN_AFFILIATE_TAG')
    if rakuten_tag:
        print(f"✓ 楽天アフィリエイトタグ設定済み: {rakuten_tag}")
    else:
        print("✗ 楽天アフィリエイトタグが未設定")
    
    # テスト用のコンテンツ
    test_content = """
    おすすめの本はこちら: https://hb.afl.rakuten.co.jp/book123
    プログラミング学習に最適: https://hb.afl.rakuten.co.jp/course456
    """
    
    print("\n処理前のリンク:")
    print("  - https://hb.afl.rakuten.co.jp/book123")
    print("  - https://hb.afl.rakuten.co.jp/course456")
    
    print("\n処理後のリンク（モック）:")
    if rakuten_tag:
        print(f"  - https://hb.afl.rakuten.co.jp/book123?mafRakutenWidgetParam={rakuten_tag}")
        print(f"  - https://hb.afl.rakuten.co.jp/course456?mafRakutenWidgetParam={rakuten_tag}")
    else:
        print("  - タグが設定されていないため、リンクは変更されません")
    
    # レポート生成
    report = f"""## アフィリエイトリンク処理レポート

### 処理されたリンク数
- rakuten: 2件

### 処理詳細
1. 楽天ブックス
   - 元URL: https://hb.afl.rakuten.co.jp/book123
   - タグ追加: {'済み' if rakuten_tag else '未設定'}

2. 楽天コース
   - 元URL: https://hb.afl.rakuten.co.jp/course456
   - タグ追加: {'済み' if rakuten_tag else '未設定'}
"""
    
    with open('./test_output/affiliate_report.md', 'w', encoding='utf-8') as f:
        f.write(report)
    
    print("\n✓ アフィリエイトレポート保存 - ./test_output/affiliate_report.md")


def test_repost_manager(articles):
    """リポスト機能のテスト"""
    print("\n=== リポスト管理機能のテスト ===")
    
    # パフォーマンススコアの計算
    print("\n記事パフォーマンス分析:")
    performance_data = []
    
    for i, article in enumerate(articles):
        days_old = i * 30  # モックデータなので単純計算
        score = 0
        
        if days_old > 90:
            score += 5
        if days_old > 180:
            score += 5
        
        score += len(article['categories'])  # カテゴリ数
        score += article['word_count'] / 100  # 文字数ボーナス
        
        performance_data.append({
            'title': article['title'],
            'score': score,
            'days_old': days_old,
            'last_repost': None
        })
    
    # スコア順にソート
    performance_data.sort(key=lambda x: x['score'], reverse=True)
    
    print("\nトップ3記事:")
    for i, data in enumerate(performance_data[:3]):
        print(f"  [{i+1}] {data['title']}")
        print(f"      スコア: {data['score']:.1f}, 経過日数: {data['days_old']}日")
    
    # リポストカレンダーの生成
    calendar = []
    current_date = datetime.now()
    
    for i, data in enumerate(performance_data[:3]):
        publish_date = current_date + timedelta(days=7 * (i + 1))
        calendar.append({
            'title': data['title'],
            'publish_date': publish_date.strftime('%Y-%m-%d'),
            'update_type': 'refresh' if i == 0 else 'seasonal',
            'notes': ['コンテンツを最新情報に更新', '関連リンクを追加']
        })
    
    with open('./test_output/repost_calendar.json', 'w', encoding='utf-8') as f:
        json.dump(calendar, f, ensure_ascii=False, indent=2)
    
    print("\n✓ リポストカレンダー保存 - ./test_output/repost_calendar.json")


def run_all_tests():
    """すべてのテストを実行"""
    print("=" * 60)
    print("HATENA Agent v2 - テストCLI")
    print("=" * 60)
    
    # 環境変数の読み込み
    load_dotenv()
    
    # 設定の確認
    print("\n環境設定の確認:")
    env_vars = {
        'HATENA_BLOG_ID': os.getenv('HATENA_BLOG_ID'),
        'BLOG_DOMAIN': os.getenv('BLOG_DOMAIN'),
        'BING_AUTH_COOKIE': '設定済み' if os.getenv('BING_AUTH_COOKIE') else '未設定',
        'RAKUTEN_AFFILIATE_TAG': os.getenv('RAKUTEN_AFFILIATE_TAG')
    }
    
    for key, value in env_vars.items():
        status = '✓' if value else '✗'
        print(f"  {status} {key}: {value if value else '未設定'}")
    
    # 各機能のテスト実行
    articles = test_article_extraction()
    test_retrieval_agent(articles)
    test_image_generation()
    test_affiliate_manager(articles)
    test_repost_manager(articles)
    
    # 結果サマリー
    print("\n" + "=" * 60)
    print("テスト実行完了！")
    print("\n生成されたファイル:")
    print("  - ./test_output/mock_articles.json - モック記事データ")
    print("  - ./test_output/enhanced_content.txt - RAG強化コンテンツ")
    print("  - ./test_output/image_generation_log.json - 画像生成ログ")
    print("  - ./test_output/affiliate_report.md - アフィリエイトレポート")
    print("  - ./test_output/repost_calendar.json - リポストカレンダー")
    print("\n実際の記事での動作確認は main.py を使用してください。")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description='HATENA Agent v2 - テストCLI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  python test_cli.py                    # すべてのテストを実行
  python test_cli.py --test extract     # 記事抽出のみテスト
  python test_cli.py --test rag         # RAG機能のみテスト
  python test_cli.py --test image       # 画像生成のみテスト
  python test_cli.py --test affiliate   # アフィリエイト機能のみテスト
  python test_cli.py --test repost      # リポスト機能のみテスト
        """
    )
    
    parser.add_argument(
        '--test',
        choices=['all', 'extract', 'rag', 'image', 'affiliate', 'repost'],
        default='all',
        help='テストする機能を選択'
    )
    
    args = parser.parse_args()
    
    if args.test == 'all':
        run_all_tests()
    else:
        load_dotenv()
        articles = create_mock_articles(5)
        
        if args.test == 'extract':
            test_article_extraction()
        elif args.test == 'rag':
            test_retrieval_agent(articles)
        elif args.test == 'image':
            test_image_generation()
        elif args.test == 'affiliate':
            test_affiliate_manager(articles)
        elif args.test == 'repost':
            test_repost_manager(articles)


if __name__ == "__main__":
    main()