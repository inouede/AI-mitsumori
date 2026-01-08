<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// エラーレポートを設定
error_reporting(E_ALL);
ini_set('display_errors', 0);

// 設定ファイルを読み込み
if (file_exists('config.php')) {
    require_once 'config.php';
} else {
    echo json_encode([
        'success' => false,
        'error' => 'config.phpファイルが見つかりません。config.sample.phpをコピーして設定してください。'
    ]);
    exit;
}

// POSTリクエストのみ受け付け
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

// リクエストデータを取得
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['message'])) {
    echo json_encode(['success' => false, 'error' => 'Message is required']);
    exit;
}

$userMessage = $input['message'];
$history = isset($input['history']) ? $input['history'] : [];

// Claude APIにリクエスト
try {
    $response = callClaudeAPI($userMessage, $history);
    echo json_encode($response);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Claude APIを呼び出す
 */
function callClaudeAPI($userMessage, $history) {
    global $CLAUDE_API_KEY;

    // APIキーのチェック
    if (empty($CLAUDE_API_KEY) || strpos($CLAUDE_API_KEY, 'xxxxxx') !== false) {
        throw new Exception('Claude APIキーが設定されていません。config.phpで正しいAPIキーを設定してください。詳しくはREADME.mdをご確認ください。');
    }

    // システムプロンプト
    $systemPrompt = <<<EOT
あなたはリフォーム会社の見積もりアシスタントです。顧客と会話しながら、適切な見積もりを作成してください。

【重要なルール】
1. トイレや風呂の台数は聞かないでください。一般的な家庭では1つなので、自動的に1台として処理してください。
2. 合計金額を出すか確認する必要はありません。情報が揃ったら自動的に見積もりを提示してください。
3. ユーザーが答えられない質問や分からない質問をした場合は、別の質問に変更するか、一般的な選択肢を提案してください。
4. 見積もりが確定したら、必ずJSON形式で見積もり情報を返してください。
5. 親しみやすく、でも丁寧な言葉遣いで対応してください。
6. Markdownの記号（**、#、`など）は使わないでください。

【見積もり価格の目安】
- トイレ交換（スタンダード）: 150,000円
- トイレ交換（高機能）: 250,000円
- トイレ交換（最高級）: 400,000円
- お風呂リフォーム（ユニットバス）: 800,000円
- お風呂リフォーム（高級ユニットバス）: 1,500,000円
- キッチン交換（スタンダード）: 700,000円
- キッチン交換（高級）: 1,500,000円
- 洗面台交換: 150,000円
- 外壁塗装（30坪）: 800,000円
- 外壁塗装（50坪）: 1,200,000円
- 屋根塗装: 500,000円
- 内装クロス張替え（6畳）: 60,000円
- フローリング張替え（6畳）: 120,000円

【会話の流れ】
1. どんなリフォームをしたいか聞く
2. 具体的な要望や予算、グレードを確認
3. 必要な情報が揃ったら見積もりを提示
4. 見積もりを提示する際は、JSONフォーマットで情報を含める

【見積もりJSONフォーマット】
見積もりを提示する際は、メッセージの最後に以下の形式でJSONを含めてください：
```json
{
  "estimate": {
    "items": [
      {
        "name": "商品・サービス名",
        "price": 単価,
        "quantity": 数量,
        "unit": "単位"
      }
    ],
    "total": 合計金額
  }
}
```

【対応例】
ユーザー: 「トイレを交換したい」
あなた: 「トイレ交換ですね！どのようなグレードをお考えですか？
- スタンダード（温水洗浄便座付き）: 約15万円
- 高機能（節水・脱臭機能付き）: 約25万円
- 最高級（全自動・タンクレス）: 約40万円」

ユーザー: 「スタンダードで」
あなた: 「かしこまりました！スタンダードタイプのトイレ交換でお見積もりいたします。

トイレ交換（スタンダード）: 150,000円

こちらでお見積もりをお出しいたしました。他にリフォームをご検討の箇所はございますか？

```json
{
  "estimate": {
    "items": [
      {
        "name": "トイレ交換（スタンダード）",
        "price": 150000,
        "quantity": 1,
        "unit": "式"
      }
    ],
    "total": 150000
  }
}
```」
EOT;

    // 会話履歴を構築
    $messages = [];
    foreach ($history as $msg) {
        $messages[] = [
            'role' => $msg['role'],
            'content' => $msg['content']
        ];
    }

    // 現在のユーザーメッセージを追加
    $messages[] = [
        'role' => 'user',
        'content' => $userMessage
    ];

    // Claude APIリクエストのボディ
    $requestBody = [
        'model' => 'claude-3-haiku-20240307',
        'max_tokens' => 2048,
        'system' => $systemPrompt,
        'messages' => $messages
    ];

    // APIリクエスト
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestBody));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-api-key: ' . $CLAUDE_API_KEY,
        'anthropic-version: 2023-06-01'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        $errorDetail = $response;
        $errorData = json_decode($response, true);

        if (isset($errorData['error']['message'])) {
            $errorDetail = $errorData['error']['message'];
        }

        if ($httpCode === 401) {
            throw new Exception('APIキーが無効です。config.phpでClaude APIキーを正しく設定してください。');
        }

        throw new Exception('Claude API Error (HTTP ' . $httpCode . '): ' . $errorDetail);
    }

    $responseData = json_decode($response, true);

    if (!isset($responseData['content'][0]['text'])) {
        throw new Exception('APIからの応答が不正です: ' . json_encode($responseData));
    }

    $botReply = $responseData['content'][0]['text'];

    // 見積もり情報を抽出
    $estimate = extractEstimate($botReply);

    return [
        'success' => true,
        'reply' => $botReply,
        'estimate' => $estimate
    ];
}

/**
 * ボットの返信から見積もり情報を抽出
 */
function extractEstimate($reply) {
    // JSONブロックを検索
    if (preg_match('/```json\s*(\{[\s\S]*?\})\s*```/', $reply, $matches)) {
        $jsonString = $matches[1];
        $data = json_decode($jsonString, true);

        if (isset($data['estimate'])) {
            return $data['estimate'];
        }
    }

    // JSONブロックなしで直接JSONを検索
    if (preg_match('/\{["\']\s*estimate["\']\s*:\s*\{[\s\S]*?\}\s*\}/', $reply, $matches)) {
        $data = json_decode($matches[0], true);

        if (isset($data['estimate'])) {
            return $data['estimate'];
        }
    }

    return null;
}
