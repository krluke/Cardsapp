// Viewer script with AI translation support added
let cards = [{ front: "", back: "" }]; 
let currentCardIndex = 0;

function goToHome() { window.location.href = '/'; }

// --- カードの描画 ---
function renderCard() {
    if (!cards || cards.length === 0) return;

    const frontEl = document.getElementById('card-front');
    const backEl = document.getElementById('card-back');
    const cardData = cards[currentCardIndex];
    
    // HTMLの流し込み
    frontEl.innerHTML = cardData.front || "<p style='text-align:center; color: var(--text-muted);'>表面</p>";
    backEl.innerHTML = cardData.back || "<p style='text-align:center; color: var(--text-muted);'>裏面</p>";
    
    // 🎨 背景色を適用（エディター側で設定した色を反映）
    frontEl.style.backgroundColor = cardData.frontBg || "var(--bg-card)";
    backEl.style.backgroundColor = cardData.backBg || "var(--bg-card-back)";
    
    // 編集機能を強制的に剥奪
    disableEditing(frontEl);
    disableEditing(backEl);
    updateNavButtons();
}
// --- 1. 編集機能の完全無効化（修正版） ---
function disableEditing(container) {
    // 編集用のUIパーツをHTMLから完全削除
    const editUI = container.querySelectorAll('.delete-btn, .drag-handle, .resize-handle, .textbox-label');
    editUI.forEach(el => el.remove());

    // テキストボックスと画像ボックスの装飾・状態をリセット
    container.querySelectorAll('.draggable-text, .draggable-image').forEach(el => {
        el.classList.remove('is-selected'); 
        el.removeAttribute('data-name');    
        el.style.resize = "none"; // ✨ JS側でも念のためリサイズを無効化
    });

    // テキストの編集を不可にする
    container.querySelectorAll('.text-content').forEach(el => {
        el.removeAttribute('contenteditable'); 
        el.style.cursor = "text"; 
        el.style.resize = "none"; // ✨ JS側でも念のためリサイズを無効化
        
        // テキスト選択時のクリックでカードが裏返らないようにする
        el.onclick = (ev) => ev.stopPropagation();
    });
}
// --- カウンター表示の更新 ---
function updateNavButtons() {
    const counterEl = document.getElementById('card-counter');
    if (counterEl) {
        // 「現在のインデックス + 1」 / 「カードの総数」 を表示
        counterEl.innerText = `${currentCardIndex + 1} / ${cards.length}`;
    }
}

function jumpToFace(isBack) {
    const cardInner = document.getElementById('current-card');
    
    // 1. アニメーションを一時的にオフにする
    cardInner.style.transition = 'none'; 
    
    // 2. 面をセットする
    if (isBack) {
        cardInner.classList.add('is-flipped');
    } else {
        cardInner.classList.remove('is-flipped');
    }
    
    // 3. ブラウザに変更を即座に認識させる（強制リフロー）
    void cardInner.offsetWidth; 
    
    // 4. アニメーションを元に戻す
    cardInner.style.transition = ''; 
}

// --- カード操作 ---
function prevCard() {
    if (currentCardIndex > 0) { 
        currentCardIndex--; 
        jumpToFace(true); // ⬅️ 前のカードに戻る時は「裏面」からスタート
        renderCard(); 
    }
}

function nextCard() {
    if (currentCardIndex < cards.length - 1) { 
        currentCardIndex++; 
        jumpToFace(false); // ⬅️ 次のカードに進む時は「表面」からスタート
        renderCard(); 
    }
}

function flipCard(event) {
    const selection = window.getSelection().toString();
    if (selection.length > 0) return;
    
    document.getElementById('current-card').classList.toggle('is-flipped');
}
// --- データの読み込み ---
async function loadSavedCards(folderId) {
    const sessionStr = localStorage.getItem('user_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    
    try {
        const url = `/api/cards/load/${folderId}${session ? `?userEmail=${encodeURIComponent(session.id)}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
            alert('データの読み込みに失敗しました');
            return;
        }

        const savedCards = await response.json();
        if (savedCards && savedCards.length > 0) {
            cards = savedCards;
            currentCardIndex = 0;
            renderCard(); 
        } else {
            document.getElementById('card-front').innerHTML = "<p style='text-align:center; padding: 20px; color: var(--text-muted, #888);'>このフォルダーにはまだカードがありません。</p>";
            document.getElementById('card-back').innerHTML = "";
            document.getElementById('card-counter').innerText = "0 / 0";
        }
    } catch (e) {
        console.error("読み込み失敗", e);
    }
}

// ---------- 新規追加：CSRF トークン取得 ----------
function getCsrfToken() {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    return session.csrfToken || null;
}

// ---------- 新規追加：テキストボックス作成ユーティリティ ----------
function createTextBox(x, y, content = "テキストを入力") {
    const textWrapper = document.createElement('div');
    textWrapper.className = 'draggable-text';
    
    // 名前は自動生成（viewer ではカウンタは不要なので簡易）
    textWrapper.setAttribute('data-name', 'テキストボックス');
    
    const labelEl = document.createElement('div');
    labelEl.className = 'textbox-label';
    labelEl.textContent = 'テキストボックス';
    textWrapper.appendChild(labelEl);
    
    textWrapper.style.left = `${x}px`;
    textWrapper.style.top = `${y}px`;
    
    const textContent = document.createElement('div');
    textContent.contentEditable = "true";
    textContent.innerText = content;
    textContent.className = 'text-content';
    
    const dragHandle = document.createElement('div');
    dragHandle.innerHTML = '<i data-lucide="move"></i>';
    dragHandle.className = 'drag-handle';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.innerHTML = '<i data-lucide="x"></i>';
    deleteBtn.className = 'delete-btn';
    
    textWrapper.appendChild(dragHandle);
    textWrapper.appendChild(textContent);
    textWrapper.appendChild(deleteBtn);
    
    return textWrapper;
}

// ---------- AI 翻訳機能 ----------
async function translateWithAI() {
    const currentCard = document.getElementById('current-card');
    const isBack = currentCard.classList.contains('is-flipped');
    const sourceFace = isBack ? document.getElementById('card-back') : document.getElementById('card-front');
    const targetFace = isBack ? document.getElementById('card-front') : document.getElementById('card-back');

    let sourceText = "";
    const selectedBox = sourceFace.querySelector('.draggable-text.is-selected .text-content');
    if (selectedBox) {
        sourceText = selectedBox.innerText;
    } else {
        const firstBox = sourceFace.querySelector('.text-content');
        if (firstBox) sourceText = firstBox.innerText;
    }

    if (!sourceText || !sourceText.trim()) {
        alert('翻訳するテキストが見つかりません。');
        return;
    }

    const btn = document.getElementById('ai-translate-btn');
    const originalContent = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Loading...';
    }
    if (window.lucide) lucide.createIcons();

    const session = JSON.parse(localStorage.getItem('user_session'));
    const userEmail = session ? (session.id || session.email) : null;
    const targetLang = (localStorage.getItem('selectedLang') || 'ja') === 'ja' ? 'en' : 'ja';

    try {
        const response = await fetch('/api/ai/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCsrfToken()
            },
            body: JSON.stringify({
                text: sourceText,
                target_lang: targetLang,
                userEmail: userEmail
            })
        });
        const data = await response.json();
        if (response.ok) {
            // Insert or replace text on target face
            let targetBox = targetFace.querySelector('.text-content');
            if (!targetBox) {
                const newBox = createTextBox(50, 50, data.translatedText);
                targetFace.appendChild(newBox);
            } else {
                targetBox.innerText = data.translatedText;
            }
            // Switch face to show result
            jumpToFace(!isBack);
            renderCard(); // re-render to apply any new elements
        } else {
            alert(data.error || 'AI 翻訳に失敗しました。');
        }
    } catch (e) {
        console.error(e);
        alert('通信エラーが発生しました。');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
        if (window.lucide) lucide.createIcons();
    }
}

// --- キーボード操作の修正版（完全な表裏サイクル） ---
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const cardInner = document.getElementById('current-card');
    const isFlipped = cardInner.classList.contains('is-flipped');

    if (e.key === 'ArrowRight') {
        if (!isFlipped) {
            cardInner.classList.add('is-flipped');
        } else {
            nextCard();
        }
    } else if (e.key === 'ArrowLeft') {
        if (isFlipped) {
            cardInner.classList.remove('is-flipped');
        } else {
            prevCard();
        }
    } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        cardInner.classList.toggle('is-flipped');
    }
});
// --- 初期化 ---
window.addEventListener('DOMContentLoaded', () => {
    const folderId = window.CURRENT_FOLDER_ID;
    if (folderId) {
        loadSavedCards(folderId);
    }
});
