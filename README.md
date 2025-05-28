# HATENA-AGENT

Hatenaブログの自動化および管理ツール群

## 機能

- ブログ記事の投稿・更新
- 画像の自動生成・管理
- APIを使用した記事の操作
- Qiita記事との連携
- Redmine統合によるタスク管理

## セットアップ

1. リポジトリのクローン:
```bash
git clone https://github.com/chnmotoTmz/hatena-agent.git
cd hatena-agent
```

2. 依存パッケージのインストール:
```bash
pip install -r requirements.txt
```

3. 環境変数の設定:
- `.env`ファイルを作成し、必要な認証情報を設定

## 使用方法

各スクリプトの使用方法については、個別のドキュメントを参照してください。

- `hatena_post.py`: ブログ記事の投稿
- `image_creator.py`: 画像の生成
- `article_updater.py`: 記事の更新

## 注意事項

- 設定ファイルやAPIキーは`.env`ファイルで管理
- センシティブな情報は公開リポジトリにコミットしない
- 大きなメディアファイルはGit LFSで管理
