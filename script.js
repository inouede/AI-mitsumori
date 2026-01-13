// チャット履歴を保持
let conversationHistory = [];
let currentEstimate = {
    items: [],
    total: 0
};

// デバッグモード（本番環境では false に設定）
const DEBUG_MODE = true;

// デバッグログ関数
function debugLog(message, data = null) {
    if (DEBUG_MODE) {
        console.log(`[DEBUG] ${message}`, data || '');
    }
}

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

    debugLog('ユーザーメッセージ:', message);

    // ユーザーメッセージを表示
    addMessage(message, 'user');

    // 入力欄をクリア
    userInput.value = '';

    // 送信ボタンを無効化
    sendButton.disabled = true;

    // タイピングインジケータを表示
    const typingId = showTypingIndicator();

    try {
        const requestBody = {
            message: message,
            history: conversationHistory
        };

        debugLog('APIリクエスト:', requestBody);

        // APIにリクエスト送信
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        debugLog('APIレスポンスステータス:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        debugLog('APIレスポンスデータ:', data);

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

            // 電話・メールキーワードをチェックしてボタンを表示
            checkForContactButtons(message.toLowerCase());

            // 見積もり情報を更新
            if (data.estimate) {
                updateEstimate(data.estimate);
            }
        } else {
            // エラーの詳細を表示
            const errorMessage = data.error || 'エラーが発生しました。もう一度お試しください。';
            addMessage('⚠️ ' + errorMessage, 'bot');
            console.error('API Error:', data);
        }
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('⚠️ 通信エラーが発生しました。接続を確認してください。<br><br>詳細: ' + error.message, 'bot');
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

    if (sender === 'bot') {
        const img = document.createElement('img');
        img.src = 'images/receptionist.png';
        img.alt = 'AI受付';
        img.onerror = function() {
            // 画像が見つからない場合はフォールバック
            this.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233B82F6\'/%3E%3Ctext x=\'50\' y=\'65\' font-size=\'50\' text-anchor=\'middle\' fill=\'white\'%3E👩‍💼%3C/text%3E%3C/svg%3E';
        };
        avatar.appendChild(img);
    } else {
        avatar.textContent = '👤';
    }

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

    // JSON形式のコードブロックを削除（改行の有無に関わらず）
    cleaned = cleaned.replace(/```json[\s\S]*?```/gi, '');
    cleaned = cleaned.replace(/```[\s\S]*?```/gi, '');

    // JSONオブジェクトを削除（より強力な正規表現）
    // {"estimate": で始まるものをすべて削除
    cleaned = cleaned.replace(/\{\s*["']?estimate["']?\s*:\s*\{[\s\S]*?\}\s*\}/gi, '');
    // json から始まる行を削除
    cleaned = cleaned.replace(/^json\s*$/gmi, '');
    // { と } のみの行を削除
    cleaned = cleaned.replace(/^\s*[\{\}]\s*$/gm, '');

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
    const img = document.createElement('img');
    // タイピング中はGIFアニメーションを表示
    img.src = 'images/receptionist.gif';
    img.alt = 'AI受付';
    img.onerror = function() {
        // GIFが見つからない場合は静止画にフォールバック
        this.src = 'images/receptionist.png';
        this.onerror = function() {
            // 静止画も見つからない場合はデフォルトアイコン
            this.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233B82F6\'/%3E%3Ctext x=\'50\' y=\'65\' font-size=\'50\' text-anchor=\'middle\' fill=\'white\'%3E👩‍💼%3C/text%3E%3C/svg%3E';
        };
    };
    avatar.appendChild(img);

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
    debugLog('見積もり情報を更新:', estimate);

    if (estimate.total && estimate.total > 0) {
        currentEstimate = estimate;

        // 合計金額を表示
        totalAmount.textContent = '¥' + estimate.total.toLocaleString();
        totalDisplay.style.display = 'block';

        debugLog('合計金額を表示:', estimate.total);

        // 見積もり明細をメッセージとして表示
        if (estimate.items && estimate.items.length > 0) {
            let detailsHTML = '<div class="estimate-details">';
            detailsHTML += '<div style="font-weight: bold; margin-bottom: 10px; color: #3B82F6;">📋 見積もり明細</div>';

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
            const img = document.createElement('img');
            img.src = 'images/receptionist.png';
            img.alt = 'AI受付';
            img.onerror = function() {
                this.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233B82F6\'/%3E%3Ctext x=\'50\' y=\'65\' font-size=\'50\' text-anchor=\'middle\' fill=\'white\'%3E👩‍💼%3C/text%3E%3C/svg%3E';
            };
            avatar.appendChild(img);

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

// 電話・メールキーワードをチェックしてボタンを表示
function checkForContactButtons(message) {
    // 電話関連のキーワード
    if (message.includes('電話') || message.includes('でんわ') || message.includes('tel')) {
        addContactButton('phone');
    }

    // メール関連のキーワード
    if (message.includes('メール') || message.includes('mail') || message.includes('めーる')) {
        addContactButton('email');
    }
}

// 連絡先ボタンを追加
function addContactButton(type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar bot-avatar';
    const img = document.createElement('img');
    img.src = 'images/receptionist.png';
    img.alt = 'AI受付';
    img.onerror = function() {
        this.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233B82F6\'/%3E%3Ctext x=\'50\' y=\'65\' font-size=\'50\' text-anchor=\'middle\' fill=\'white\'%3E👩‍💼%3C/text%3E%3C/svg%3E';
    };
    avatar.appendChild(img);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (type === 'phone') {
        bubble.innerHTML = `
            <div style="margin-bottom: 10px;">こちらからお電話いただけます：</div>
            <a href="tel:0120-XXX-XXXX" class="contact-action-button phone-action">
                <span class="button-icon">📞</span>
                <span>0120-XXX-XXXX に電話する</span>
            </a>
        `;
    } else if (type === 'email') {
        bubble.innerHTML = `
            <div style="margin-bottom: 10px;">こちらからメールをお送りいただけます：</div>
            <a href="mailto:info@example.com" class="contact-action-button email-action">
                <span class="button-icon">✉️</span>
                <span>info@example.com にメールする</span>
            </a>
        `;
    }

    contentDiv.appendChild(bubble);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}
