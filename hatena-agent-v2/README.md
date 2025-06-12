# HATENA Agent v2

はてなブログの記事管理・自動強化システム

## 機能

1. **自己記事抽出エージェント**
   - はてなブログから全記事を自動抽出
   - 記事のメタデータ（タイトル、URL、日付、カテゴリ）を収集
   - 記事本文、画像、リンクを解析

2. **リトリーブエージェント（RAG）**
   - 過去記事の関連リンクを自動挿入
   - 文体・口調の統一
   - ChromaDBを使用したベクトル検索

3. **画像生成エージェント**
   - Bing Image Creator（DALL-E 3）による記事に適した画像の自動生成
   - 既存画像の置き換え提案
   - アイキャッチ画像の作成
   - 無料のMicrosoft Copilotを使用（要認証cookie）

4. **アフィリエイト管理**
   - 楽天アフィリエイトリンク自動変換
   - 商品リンクの最適化
   - アフィリエイトレポート生成

5. **リポスト管理**
   - 記事のパフォーマンス分析
   - 再投稿スケジュールの自動生成
   - 更新内容の追加

## セットアップ

1. 依存関係のインストール
```bash
pip install -r requirements.txt
```

2. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集してAPIキーを設定
```

### Bing Image Creator Cookie の取得方法

1. Microsoftアカウントでhttps://www.bing.com/images/create にアクセス
2. 開発者ツール（F12）を開く
3. Application/Storage タブ → Cookies → https://www.bing.com
4. `_U` cookieの値をコピー
5. `.env`ファイルの`BING_AUTH_COOKIE`に設定

3. MeCab（日本語形態素解析）のインストール（アフィリエイト機能を使用する場合）
```bash
sudo apt-get install mecab libmecab-dev mecab-ipadic-utf8
pip install mecab-python3
```

## 使用方法

### 基本的な使い方

```bash
# 全機能を実行
python main.py --hatena-id your-hatena-id

# 記事の抽出のみ
python main.py --hatena-id your-hatena-id --mode extract

# 記事の強化のみ（事前に抽出が必要）
python main.py --hatena-id your-hatena-id --mode enhance

# リポスト計画の作成のみ
python main.py --hatena-id your-hatena-id --mode repost
```

### 個別エージェントの使用

```python
from src.agents.article_extractor import HatenaArticleExtractor
from src.agents.retrieval_agent import RetrievalAgent

# 記事の抽出
extractor = HatenaArticleExtractor("your-hatena-id")
articles = extractor.extract_all_articles(max_pages=5)

# RAGエージェントの使用
retrieval_agent = RetrievalAgent(openai_api_key="your-key")
retrieval_agent.create_vectorstore_from_articles(articles)

# 関連記事リンクの挿入
enhanced_content = retrieval_agent.generate_article_with_links(
    "記事の内容",
    max_links=3
)
```

## 出力ファイル

- `output/extracted_articles.json` - 抽出した記事データ
- `output/enhanced_sample.html` - 強化されたサンプル記事
- `output/repost_calendar.json` - リポストスケジュール
- `output/images/` - 生成された画像
- `output/chroma_db/` - ベクトルデータベース

## 注意事項

- **完全無料**: OpenAI APIは使用せず、すべて無料サービスで動作します
- Bing Image Creatorは無料ですが、認証cookieが必要です
- cookieは定期的に更新する必要があります（2-4週間ごと）
- はてなブログのスクレイピングは適度な間隔で行ってください