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

// --- キーボード操作の修正版（完全な表裏サイクル） ---
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const cardInner = document.getElementById('current-card');
    const isFlipped = cardInner.classList.contains('is-flipped');

    if (e.key === 'ArrowRight') {
        // 右矢印：表 → 裏 → 次の表
        if (!isFlipped) {
            cardInner.classList.add('is-flipped'); // 表面なら裏返す（アニメあり）
        } else {
            nextCard(); // すでに裏面なら次のカードへ（アニメなしで表面へ）
        }
    } 
    else if (e.key === 'ArrowLeft') {
        // 左矢印：裏 → 表 → 前の裏（右矢印の完全な逆再生）
        if (isFlipped) {
            cardInner.classList.remove('is-flipped'); // 裏面なら表面に戻す（アニメあり）
        } else {
            prevCard(); // すでに表面なら前のカードへ（アニメなしで裏面へ）
        }
    } 
    else if (e.key === ' ' || e.key === 'Enter') {
        // スペース/エンター：単純な反転
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