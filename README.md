# AIチャットボット機能付き自動見積もりシステム

LINEのような会話形式でリフォームの見積もりを自動生成するシステムです。

## 特徴

- LINEライクな吹き出しチャットUI
- AIが質問しながら見積もりを自動作成
- わからない質問は自動で別の質問に変更
- 合計金額を目立つ形で表示
- 電話番号・メールアドレスのワンクリック連絡
- スマートフォン対応
- FTPサーバーにアップロードするだけで動作

## 必要な環境

- PHP 7.0以上（curl拡張機能が必要）
- FTPサーバー（PHPが動作する環境）
- Claude API キー

## セットアップ手順

### 1. ファイルのアップロード

すべてのファイルをFTPサーバーにアップロードします。

```
/
├── index.html
├── style.css
├── script.js
├── api.php
├── config.sample.php
└── README.md
```

### 2. Claude API キーの取得

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. アカウント作成 or ログイン
3. API Keysセクションから新しいAPIキーを作成
4. APIキーをコピー（sk-ant-api03-で始まる文字列）

### 3. 設定ファイルの作成

サーバー上で以下のコマンドを実行するか、FTPクライアントで操作します：

```bash
cp config.sample.php config.php
```

`config.php`を編集して、Claude API キーを設定します：

```php
$CLAUDE_API_KEY = 'sk-ant-api03-あなたのAPIキー';
```

### 4. 会社情報の設定

`index.html`を開いて、会社の電話番号とメールアドレスを編集します：

```html
<a href="tel:0120-XXX-XXXX" class="contact-link phone-link">
    <span class="icon">📞</span>
    <span>0120-XXX-XXXX</span>  <!-- ここを変更 -->
</a>
<a href="mailto:info@example.com" class="contact-link email-link">
    <span class="icon">✉️</span>
    <span>info@example.com</span>  <!-- ここを変更 -->
</a>
```

### 5. ファイルのパーミッション設定

PHPファイルが実行できるようにパーミッションを設定します：

```bash
chmod 644 index.html
chmod 644 style.css
chmod 644 script.js
chmod 644 api.php
chmod 600 config.php  # セキュリティのため読み取り専用に
```

### 6. 動作確認

ブラウザで `https://あなたのドメイン/index.html` にアクセスして動作を確認します。

## 使い方

1. チャットで「トイレを交換したい」などのリフォーム内容を入力
2. AIが質問してくるので答えていく
3. 自動的に見積もりが計算されて表示される
4. 電話番号やメールアドレスをクリックして問い合わせ可能

## 見積もり価格の設定

`api.php`の中で価格を変更できます：

```php
【見積もり価格の目安】
- トイレ交換（スタンダード）: 150,000円
- トイレ交換（高機能）: 250,000円
...
```

## カスタマイズ

### 色の変更

`style.css`の以下の部分で色を変更できます：

```css
/* メインカラー */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 合計金額の背景色 */
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
```

### AIの応答をカスタマイズ

`api.php`の`$systemPrompt`を編集することで、AIの振る舞いを変更できます。

## トラブルシューティング

### 「config.phpファイルが見つかりません」と表示される

→ `config.sample.php`を`config.php`にコピーして、APIキーを設定してください

### チャットが動作しない

1. ブラウザの開発者ツール（F12）でエラーを確認
2. `api.php`に直接アクセスしてPHPが動作しているか確認
3. サーバーのPHPバージョンとcurl拡張機能を確認

### 見積もりが表示されない

1. Claude APIキーが正しく設定されているか確認
2. APIの利用制限に達していないか確認
3. サーバーから外部API（api.anthropic.com）への接続が許可されているか確認

## セキュリティ注意事項

- `config.php`は必ず`.gitignore`に追加してください
- APIキーは絶対に公開しないでください
- 本番環境では必ずHTTPS接続を使用してください

## ライセンス

このプロジェクトは自由に使用・改変できます。

## サポート

問題が発生した場合は、サーバーのエラーログとブラウザのコンソールログを確認してください。
