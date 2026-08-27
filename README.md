# ATHLETE BRIDGE

「アスリートのセカンドキャリアを、経営者が語る。」— 経営者インタビュー記事サイト。

黒×ゴールドを基調にした静的サイトです。ビルド不要（プレーンな HTML/CSS/JS）で、ブラウザで `index.html` を開くか、任意の静的ホスティングにそのままアップロードすれば動きます。

## 構成

```
├── index.html             ページの骨格（一覧ビュー / 記事ビューの入れ物）
├── 404.html               ページが見つからないとき
├── css/style.css          全スタイル
├── js/
│   ├── main.js             描画ロジック・ルーティング（#記事ID のハッシュ遷移）
│   └── articles.json       記事データ ← 新しい記事はここを編集
├── images/                記事のメイン画像
├── netlify.toml           Netlify の公開設定（ダッシュボード設定より優先される）
└── scripts/
    ├── publish.sh          検証つき公開スクリプト
    └── check-site.mjs      サイト検証
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
python3 -m http.server 8080
# http://localhost:8080 を開く
```

## 公開する

このリポジトリの `main` ブランチは Netlify に接続済みです。**push すると本番サイトが自動で更新されます。**

<https://superlative-centaur-49f503.netlify.app>

手元ですることは1コマンドだけです。

```bash
./scripts/publish.sh "清野さんのインタビューを追加"
```

このスクリプトが順に、

1. `scripts/stamp-assets.mjs` で CSS/JS の参照URLに版番号を付け直す
2. `scripts/check-site.mjs` でサイトと記事データを検証する（**エラーがあれば push せず停止**）
3. 変更をすべてコミットする
4. GitHub に push する（ネットワーク失敗時は最大4回まで自動リトライ）

を行います。push が通れば Netlify のデプロイは自動で始まるので、以降の操作は不要です。
コミットメッセージを省略すると「サイト更新」になります。

`main` 以外のブランチにいるときは、その旨を表示したうえで push します（本番には反映されません）。

### 公開せず検証だけする

```bash
node scripts/check-site.mjs
```

検出するものは次のとおりです。**エラーが1件でもあれば公開は中止**され、警告は公開を止めません。

| 種別 | 内容 |
| --- | --- |
| エラー | `articles.json` のJSONが壊れている／配列でない／記事が0本 |
| エラー | 記事の必須項目（`id` `category` `date` `title` `company` `personRole` `personName` `excerpt` `blocks`）が欠けている |
| エラー | `id` が他の記事と重複している（片方の記事が開けなくなる） |
| エラー | `date` が `YYYY-MM-DD` 形式でない |
| エラー | 指定した `image` のファイルが存在しない |
| エラー | `blocks` が空、`text` が無い、`link` なのに `url` が無い |
| エラー | HTMLのリンク・CSS・JSの参照先が存在しない |
| エラー | `<html lang>` / `<title>` / viewport の meta が無い |
| 警告 | `blocks` の `type` が未対応（段落として表示されてしまう） |
| 警告 | 画像が 800KB を超えている（表示が遅くなる） |
| 警告 | `images/` に、どの記事からも参照されていない画像がある |
| 警告 | meta description が無い |

同じ検証は GitHub Actions（`.github/workflows/check-site.yml`）でも push のたびに走るので、
スクリプトを使わず直接 push した場合も、壊れていれば GitHub 上で赤いチェックが付きます。

### CSS/JS の版番号について

`index.html` は CSS と JS を `css/style.css?v=d479221e` のように版番号付きで読み込みます。
この番号は中身から自動で作られ、公開のたびに `scripts/stamp-assets.mjs` が付け直すので、
手で書き換える必要はありません。

これは、ブラウザに古い CSS が残ったまま新しい JS だけが読み込まれるのを防ぐためのものです。
両者は組で更新されることがあり、片方だけ古いと新しい markup が素のまま描画されて
レイアウトが壊れます（実際に、記事上部の画像が2枚表示される不具合が起きました）。
URL が変われば必ず取り直されるため、この組み合わせは起こりません。

### Netlify の設定を変えたいとき

公開設定は `netlify.toml` に書いてあります。ダッシュボードで設定を変えてもこのファイルが
優先されるため、変更するときは `netlify.toml` を編集して push してください。

- 公開ディレクトリ: リポジトリ直下（ビルドコマンドなし）
- `images/` は7日、`css/` は1日キャッシュ
- `js/` はキャッシュしない（`articles.json` が記事データ本体のため、記事の追加をすぐ反映させる）
