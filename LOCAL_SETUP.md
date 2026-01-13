# ローカル環境での動作確認方法

GitHub PagesではPHPが動作しないため、ローカル環境で確認する方法を説明します。

## Windows の場合: XAMPP

### 1. XAMPPのインストール
1. https://www.apachefriends.org/ にアクセス
2. Windows版をダウンロード
3. インストーラーを実行（デフォルト設定でOK）

### 2. ファイルの配置
1. XAMPPコントロールパネルを起動
2. Apache の「Start」ボタンをクリック
3. エクスプローラーで `C:\xampp\htdocs\` を開く
4. `AI-mitsumori` フォルダを作成
5. すべてのファイルをコピー:
   ```
   C:\xampp\htdocs\AI-mitsumori\
   ├── index.html
   ├── style.css
   ├── script.js
   ├── api.php
   ├── config.php
   └── images\
       └── receptionist.png
   ```

### 3. 動作確認
ブラウザで `http://localhost/AI-mitsumori/` にアクセス

---

## Mac の場合: MAMP

### 1. MAMPのインストール
1. https://www.mamp.info/ にアクセス
2. Mac版をダウンロード（無料版でOK）
3. インストーラーを実行

### 2. ファイルの配置
1. MAMPを起動
2. 「Start Servers」をクリック
3. Finderで `/Applications/MAMP/htdocs/` を開く
4. `AI-mitsumori` フォルダを作成
5. すべてのファイルをコピー

### 3. 動作確認
ブラウザで `http://localhost:8888/AI-mitsumori/` にアクセス

---

## Linux の場合: PHP内蔵サーバー

### 1. PHPがインストールされているか確認
```bash
php -v
```

### 2. プロジェクトフォルダに移動
```bash
cd /home/user/AI-mitsumori
```

### 3. PHPサーバーを起動
```bash
php -S localhost:8000
```

### 4. 動作確認
ブラウザで `http://localhost:8000/` にアクセス

---

## トラブルシューティング

### エラー: config.phpが見つかりません
→ config.phpが正しく配置されているか確認

### エラー: CORS エラー
→ ローカル環境では通常発生しません。ブラウザのキャッシュをクリアしてください

### エラー: API Key が無効
→ config.phpのAPIキーが正しく設定されているか確認

---

## 本番環境へのデプロイ

動作確認後、以下のいずれかにデプロイ：

1. **InfinityFree**（無料、推奨）
   - https://www.infinityfree.com/
   - PHPとMySQLが使える無料ホスティング

2. **X-Server**（有料、高品質）
   - https://www.xserver.ne.jp/
   - 日本の高速PHPホスティング

3. **さくらのレンタルサーバー**（安価）
   - https://www.sakura.ne.jp/
   - 月額129円からのPHPホスティング
