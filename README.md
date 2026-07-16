# ATHLETE BRIDGE

「アスリートのセカンドキャリアを、経営者が語る。」— 経営者インタビュー記事サイト。

黒×ゴールドを基調にした静的サイトです。ビルド不要（プレーンな HTML/CSS/JS）で、ブラウザで `index.html` を開くか、任意の静的ホスティングにそのままアップロードすれば動きます。

## 構成

```
site/
├── index.html        ページの骨格（一覧ビュー / 記事ビューの入れ物）
├── css/style.css      全スタイル
├── js/
│   ├── main.js         描画ロジック・ルーティング（#記事ID のハッシュ遷移）
│   └── articles.json   記事データ ← 新しい記事はここを編集
├── images/            記事のメイン画像
└── netlify.toml       Netlify 用設定
```

## 記事を追加する

`js/articles.json` に1件オブジェクトを追加するだけです。コードは触らなくて大丈夫です。

```json
{
  "id": "unique-slug",
  "category": "カテゴリー名",
  "date": "2026-08-01",
  "title": "記事タイトル",
  "company": "会社名",
  "personRole": "役職",
  "personName": "氏名",
  "excerpt": "一覧カードに出る要約文",
  "image": "images/xxx.png",
  "blocks": [
    { "type": "h", "text": "見出し" },
    { "type": "p", "text": "本文段落" },
    { "type": "p", "label": "強調ラベル", "text": "ラベル付き段落" },
    { "type": "quote", "text": "引用（インタビューの発言など）" },
    { "type": "link", "url": "https://...", "text": "リンクテキスト" }
  ]
}
```

- `id` は URL のハッシュ（`#unique-slug`）になるので、他の記事と重複しない半角英数字にしてください。
- `date` は `YYYY-MM-DD` 形式。一覧は常にこの日付の新しい順に自動で並び替わります（並び替えの作業は不要）。
- `category` は自由記述。一覧上部のカテゴリーフィルターは、記事データに存在するカテゴリーから自動生成されます（新しいカテゴリー名を使えば自動でフィルターに追加されます）。
- `image` を省略する（キーごと消す）と、画像なしのプレースホルダー表示になります。
- 画像は `images/` に配置し、横長（1200×800 目安、object-fit: cover で表示）を推奨します。

## ローカルで確認する

ビルド不要ですが、`fetch()` で `articles.json` を読み込むため `file://` では動きません。簡易サーバーで確認してください。

```bash
cd site
python3 -m http.server 8080
# http://localhost:8080 を開く
```

## Netlify へのデプロイ

このディレクトリ（`site/`）をそのまま Netlify にデプロイしてください。

- Netlify の UI から新規サイトを作成する場合: リポジトリを接続し、**Base directory** を `site`、**Publish directory** を `site`（または base 設定時は `.`）に設定します。ビルドコマンドは不要です（空欄でOK）。
- Netlify CLI を使う場合:
  ```bash
  cd site
  netlify deploy --prod
  ```
