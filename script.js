// チャット履歴を保持
let conversationHistory = [];
let currentEstimate = {
    items: [],
    total: 0
};

// DOM要素の取得
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const totalDisplay = document.getElementById('totalDisplay');
const totalAmount = document.getElementById('totalAmount');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // Enterキーで送信
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 送信ボタンのクリック
    sendButton.addEventListener('click', sendMessage);
});

// メッセージ送信
async function sendMessage() {
    const message = userInput.value.trim();

    if (!message) return;

    // ユーザーメッセージを表示
    addMessage(message, 'user');

    // 入力欄をクリア
    userInput.value = '';

    // 送信ボタンを無効化
    sendButton.disabled = true;

    // タイピングインジケータを表示
    const typingId = showTypingIndicator();

    try {
        // APIにリクエスト送信
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                history: conversationHistory
            })
        });

        const data = await response.json();

        // タイピングインジケータを削除
        removeTypingIndicator(typingId);

        if (data.success) {
            // ボットの返信を表示
            const cleanedMessage = cleanBotMessage(data.reply);
            addMessage(cleanedMessage, 'bot');

            // 会話履歴に追加
            conversationHistory.push({
                role: 'user',
                content: message
            });
            conversationHistory.push({
                role: 'assistant',
                content: data.reply
            });

            // 見積もり情報を更新
            if (data.estimate) {
                updateEstimate(data.estimate);
            }
        } else {
            addMessage('申し訳ございません。エラーが発生しました。もう一度お試しください。', 'bot');
        }
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('通信エラーが発生しました。接続を確認してください。', 'bot');
        console.error('Error:', error);
    } finally {
        // 送信ボタンを有効化
        sendButton.disabled = false;
        userInput.focus();
    }
}

// メッセージを追加
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${sender}-avatar`;
    avatar.textContent = sender === 'bot' ? '🤖' : '👤';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = formatMessage(text);

    contentDiv.appendChild(bubble);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    chatContainer.appendChild(messageDiv);

    // 自動スクロール（送信したメッセージが見えるように）
    scrollToBottom();
}

// メッセージのフォーマット
function formatMessage(text) {
    // 改行を<br>に変換
    let formatted = text.replace(/\n/g, '<br>');

    // 電話番号を自動リンク化（例: 0120-XXX-XXXX, 03-XXXX-XXXX など）
    formatted = formatted.replace(/(\d{2,4}-\d{2,4}-\d{4}|\d{10,11})/g, '<a href="tel:$1" class="auto-link">$1</a>');

    // メールアドレスを自動リンク化
    formatted = formatted.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" class="auto-link">$1</a>');

    return formatted;
}

// ボットメッセージのクリーンアップ
function cleanBotMessage(message) {
    // 「**」などのMarkdown記号を削除
    let cleaned = message.replace(/\*\*/g, '');
    cleaned = cleaned.replace(/\*/g, '');
    cleaned = cleaned.replace(/#{1,6}\s/g, '');
    cleaned = cleaned.replace(/`{1,3}/g, '');
    cleaned = cleaned.replace(/_{1,2}/g, '');

    // JSON形式のコードブロックを削除
    cleaned = cleaned.replace(/```json[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');

    // JSONオブジェクトそのものを削除（{"estimate":... のような形式）
    cleaned = cleaned.replace(/\{["']estimate["']:\s*\{[\s\S]*?\}\}/g, '');

    return cleaned.trim();
}

// タイピングインジケータを表示
function showTypingIndicator() {
    const messageDiv = document.createElement('div');
    const id = 'typing-' + Date.now();
    messageDiv.id = id;
    messageDiv.className = 'message bot-message';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar bot-avatar';
    avatar.textContent = '🤖';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble typing-indicator';
    bubble.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    contentDiv.appendChild(bubble);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    chatContainer.appendChild(messageDiv);
    scrollToBottom();

    return id;
}

// タイピングインジケータを削除
function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

// 見積もり情報を更新
function updateEstimate(estimate) {
    if (estimate.total && estimate.total > 0) {
        currentEstimate = estimate;

        // 合計金額を表示
        totalAmount.textContent = '¥' + estimate.total.toLocaleString();
        totalDisplay.style.display = 'block';

        // 見積もり明細をメッセージとして表示
        if (estimate.items && estimate.items.length > 0) {
            let detailsHTML = '<div class="estimate-details">';
            detailsHTML += '<div style="font-weight: bold; margin-bottom: 10px; color: #667eea;">📋 見積もり明細</div>';

            estimate.items.forEach(item => {
                const itemTotal = item.price * (item.quantity || 1);
                detailsHTML += `
                    <div class="estimate-item">
                        <span class="estimate-item-name">
                            ${item.name}
                            ${item.quantity > 1 ? ` × ${item.quantity}${item.unit || ''}` : ''}
                        </span>
                        <span class="estimate-item-price">¥${itemTotal.toLocaleString()}</span>
                    </div>
                `;
            });

            detailsHTML += '</div>';

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot-message';

            const avatar = document.createElement('div');
            avatar.className = 'message-avatar bot-avatar';
            avatar.textContent = '🤖';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';

            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.innerHTML = detailsHTML;

            contentDiv.appendChild(bubble);
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(contentDiv);

            chatContainer.appendChild(messageDiv);
            scrollToBottom();
        }
    }
}

// スムーズに最下部までスクロール
function scrollToBottom() {
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
}
