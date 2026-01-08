<?php
/**
 * AI見積もりチャットボット 設定ファイル
 *
 * このファイルをコピーして config.php として保存してください
 * cp config.sample.php config.php
 */

// Claude API キー
// https://console.anthropic.com/ から取得してください
$CLAUDE_API_KEY = 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// 会社情報（index.htmlで使用）
// 必要に応じてindex.htmlの該当箇所を直接編集してください
define('COMPANY_PHONE', '0120-XXX-XXXX');
define('COMPANY_EMAIL', 'info@example.com');
