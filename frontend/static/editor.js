// ==========================================
// 1. 初期設定と状態管理
// ==========================================
let isTextMode = false;
let selectedTextEl = null;
let cards = [{ front: "", back: "" }]; 
let currentCardIndex = 0;
let isLocked = false;

// Simple translation helper used across the editor
function t(key) {
    const lang = localStorage.getItem('selectedLang') || 'ja';
    if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    return key;
}

let textBoxCounter = 0;

function getCsrfToken() {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    return session.csrfToken || null;
}

async function authenticatedFetch(url, options = {}) {
    const csrfToken = getCsrfToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
    };
    
    if (options.body && typeof options.body === 'string') {
        try {
            const bodyObj = JSON.parse(options.body);
            bodyObj.csrfToken = csrfToken;
            options.body = JSON.stringify(bodyObj);
        } catch (e) {}
    } else if (options.body && typeof options.body === 'object') {
        options.body = { ...options.body, csrfToken };
    }
    
    return fetch(url, { ...options, headers: { ...headers, ...options.headers } });
}

// Translation helper function
function t(key) {
    const lang = localStorage.getItem('selectedLang') || 'ja';
    if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    return key;
}

window.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/');
    const folderId = pathParts[pathParts.length - 1];
    window.CURRENT_FOLDER_ID = folderId;
    // 文字色・図形色のリアルタイム変更
    const textColorPicker = document.getElementById('text-color-picker');
    if (textColorPicker) {
        textColorPicker.oninput = (e) => {
            if (!selectedTextEl) return;
            
            // 図形(draggable-shape)の場合
            const text = selectedTextEl.querySelector('.text-content');
            if (text) {
                text.style.color = e.target.value;
            }
        };
        // 入力終了時に保存
        textColorPicker.onchange = () => saveCurrentCardState();
    }

    // カード背景色のリアルタイム変更
    const cardBgPicker = document.getElementById('card-bg-picker');
    if (cardBgPicker) {
        cardBgPicker.oninput = (e) => {
            const isBack = document.getElementById('current-card').classList.contains('is-flipped');
            const targetFace = isBack ? document.getElementById('card-back') : document.getElementById('card-front');
            targetFace.style.backgroundColor = e.target.value;
        };
        cardBgPicker.onchange = () => saveCurrentCardState();
    }

    renderTemplateList(); // テンプレート一覧の初期描画

    if (folderId && folderId !== 'editor') {
        loadSavedCards(folderId);
    } else {
        renderCard(); 
    }

    // 🖼️ 画像URL入力欄のエンターキー検知
    const imgInput = document.getElementById('image-url-input');
    if (imgInput) {
        imgInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addImageToCard(e.target.value);
                e.target.value = ''; // 追加後は入力欄を空にする
            }
        });
    }

    updateThumbnailBar();
    refreshIcons();
});

function goToHome() { 
    if(confirm(t('confirm_discard_exit'))) {
        window.location.href = '/';
    }
}

// ==========================================
// 2. カードの描画とデータ管理
// ==========================================
function renderCard() {
    const frontEl = document.getElementById('card-front');
    const backEl = document.getElementById('card-back');
    
    frontEl.innerHTML = cards[currentCardIndex].front || "";
    backEl.innerHTML = cards[currentCardIndex].back || "";
    
    // 【追加】背景色を描画
    frontEl.style.backgroundColor = cards[currentCardIndex].frontBg || "";
    backEl.style.backgroundColor = cards[currentCardIndex].backBg || "";
    
    restoreUIElements(frontEl);
    restoreUIElements(backEl);
    rebindEvents(frontEl);
    rebindEvents(backEl);
    updateNavButtons();
    refreshIcons();
}

function saveCurrentCardState() {
    const frontEl = document.getElementById('card-front');
    const backEl = document.getElementById('card-back');
    if (frontEl && backEl) {
        deselectText();
        cards[currentCardIndex].front = frontEl.innerHTML;
        cards[currentCardIndex].back = backEl.innerHTML;
        cards[currentCardIndex].frontBg = frontEl.style.backgroundColor;
        cards[currentCardIndex].backBg = backEl.style.backgroundColor;
    }
}

// ==========================================
// 変更箇所 1: テキスト入力のイベント修正
// ==========================================
// 【変更】テキストと図形の両方にイベントを割り当てる
function rebindEvents(container) {
    container.querySelectorAll('.draggable-text, .draggable-image').forEach(el => {
        const deleteBtn = el.querySelector('.delete-btn');
        const dragHandle = el.querySelector('.drag-handle');
        const resizeHandle = el.querySelector('.resize-handle')
        const textContent = el.querySelector('.text-content');

        el.onclick = (ev) => ev.stopPropagation();
        el.onmouseup = (ev) => ev.stopPropagation();

        if (deleteBtn) {
            deleteBtn.onclick = (ev) => { 
                ev.stopPropagation(); 
                el.remove();
                saveCurrentCardState();
                updateThumbnailBar();
                syncPanelWithCard()
            };
            deleteBtn.onmousedown = (ev) => ev.stopPropagation(); // ボタンを押した時も貫通防止
        }
                
        if (textContent) {
            textContent.onfocus = () => {
                selectText(el);
                if (textContent.innerText.trim() === t('placeholder_text_input')) {
                    textContent.innerText = "";
                }
            };
            textContent.onblur = () => {
                if (textContent.innerText.trim() === "") {
                    textContent.innerText = t('placeholder_text_input');
                }
            };
            textContent.onmousedown = (ev) => ev.stopPropagation(); 
        }

        if (dragHandle) {
            dragHandle.onmousedown = (ev) => {
                ev.stopPropagation(); 
                selectText(el); 
                startDrag(ev, el);
            };
        }
        // 🔄 rebindEvents 内の画像リサイズ処理部分を以下に差し替え
        if (resizeHandle) {
            resizeHandle.onmousedown = (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                selectText(el); // 確実に選択状態にする

                const startX = ev.clientX;
                const startWidth = el.offsetWidth;
                // 比率を保持（保存されていない場合のみ計算）
                const aspect = parseFloat(el.dataset.aspect) || (el.offsetWidth / el.offsetHeight);

                const onResizeMove = (moveEv) => {
                    // 🛑 粘着防止：ボタンが離されていたら強制終了
                    if (moveEv.buttons === 0) {
                        onResizeUp();
                        return;
                    }

                    const deltaX = moveEv.clientX - startX;
                    let newWidth = startWidth + deltaX;

                    // 最小サイズの制限
                    if (newWidth < 50) newWidth = 50;
                    
                    // 親要素の幅を超えないように制限
                    const parent = el.parentElement;
                    if (parent) {
                        const maxW = parent.clientWidth - el.offsetLeft - 20;
                        if (newWidth > maxW) newWidth = maxW;
                    }

                    el.style.width = newWidth + 'px';
                    el.style.height = (newWidth / aspect) + 'px'; // 比率を維持
                };

                const onResizeUp = () => {
                    // イベントを確実に解除
                    window.removeEventListener('mousemove', onResizeMove);
                    window.removeEventListener('mouseup', onResizeUp);
                    saveCurrentCardState();
                    updateThumbnailBar();
                };

                // window全体でマウス移動を監視
                window.addEventListener('mousemove', onResizeMove);
                window.addEventListener('mouseup', onResizeUp);
            };
        }
        el.onmousedown = (ev) => {
            ev.stopPropagation();
            if(ev.target !== deleteBtn && ev.target !== dragHandle && ev.target !== textContent && ev.target !== resizeHandle) {
                selectText(el);
            }
        };
    });
}


// ==========================================
// 3. カードの追加・移動・削除
// ==========================================
function addNewCard() {
    saveCurrentCardState();
    cards.push({ front: "", back: "" });
    currentCardIndex = cards.length - 1;
    document.getElementById('current-card').classList.remove('is-flipped');
    updateThumbnailBar();
    renderCard();
}

function prevCard() {
    if (currentCardIndex > 0) { saveCurrentCardState(); currentCardIndex--; renderCard(); jumpToFace(true);}
    updateThumbnailBar();
    syncPanelWithCard();
}

function nextCard() {
    if (currentCardIndex < cards.length - 1) { saveCurrentCardState(); currentCardIndex++; renderCard(); jumpToFace(false); }
    updateThumbnailBar();
    syncPanelWithCard();
}

function updateNavButtons() {
    const counterEl = document.getElementById('card-counter');
    if (counterEl) counterEl.innerText = `${currentCardIndex + 1} / ${cards.length}`;
}

async function deleteCurrentCard() {
    const currentCardData = cards[currentCardIndex]; 
    if (!currentCardData) return;

    // データベース保存前の新規カード
    if (!currentCardData.id) {
        if (confirm(t('confirm_discard_card'))) {
            cards.splice(currentCardIndex, 1);
            if (cards.length === 0) {
                cards = [{ front: "", back: "" }];
                currentCardIndex = 0;
            } else if (currentCardIndex >= cards.length) {
                currentCardIndex--;
            }
            syncPanelWithCard();
            renderCard();
        }
        return;
    }

    // 保存済みカードの削除
    if (!confirm(t('confirm_delete_card'))) return;

    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) return;
    const session = JSON.parse(sessionStr);

    try {
        const res = await authenticatedFetch('/api/cards/delete', {
            method: 'POST',
            body: JSON.stringify({ cardId: currentCardData.id, userEmail: session.id })
        });

        if (res.ok) {
            cards.splice(currentCardIndex, 1);
            if (cards.length === 0) {
                cards = [{ front: "", back: "" }];
                currentCardIndex = 0;
            } else if (currentCardIndex >= cards.length) {
                currentCardIndex--;
            }
            alert(t('alert_card_deleted'));
            renderCard();
        } else {
            alert(t('alert_card_delete_failed'));
        }
    } catch (e) {
        console.error("Delete Error:", e);
        alert(t('alert_comm_error'));
    }
}

// ==========================================
// 4. エディタ操作（テキスト追加・装飾・ドラッグ）
// ==========================================
function flipCard(e) {
    // 【修正】図形(.draggable-shape)をクリックした時も裏返らないようにする
    if (isLocked || isTextMode || e.target.closest('.draggable-text')) return;
    document.getElementById('current-card').classList.toggle('is-flipped');
    deselectText();
}

function activateTextMode() {
    isTextMode = !isTextMode;
    document.getElementById('text-tool-btn').classList.toggle('active', isTextMode);
    document.querySelector('.flashcard-scene').style.cursor = isTextMode ? 'crosshair' : 'default';
}

document.querySelectorAll('.card-face').forEach(face => {
    face.addEventListener('click', function(e) {
        // テキストモードでない、またはすでにテキストボックスの上なら無視
        if (!isTextMode || e.target.closest('.draggable-text')) return;
        
        e.stopPropagation(); // カードの裏返しイベントを阻止

        const rect = this.getBoundingClientRect();
        const textWrapper = document.createElement('div');
        textWrapper.className = 'draggable-text';
        
        // 1. 名前とラベルの作成
        textBoxCounter++;
        const boxName = `${t('label_textbox')} ${textBoxCounter}`;
        textWrapper.setAttribute('data-name', boxName);

        const labelEl = document.createElement('div');
        labelEl.className = 'textbox-label';
        labelEl.textContent = boxName;
        textWrapper.appendChild(labelEl);

        // 2. 座標設定
        textWrapper.style.left = `${e.clientX - rect.left}px`;
        textWrapper.style.top = `${e.clientY - rect.top}px`;
        
        // 3. ボタンと中身の作成
        const textContent = document.createElement('div');
        textContent.contentEditable = "true";
        textContent.innerText = t('placeholder_text_input');
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
        this.appendChild(textWrapper);
        
        // 4. イベント登録と選択
        rebindEvents(this);
        selectText(textWrapper);
        if (window.lucide) lucide.createIcons();
        syncPanelWithCard();

        // --- 【重要】1回追加したらテキストモードを終了する ---
        isTextMode = false;
        const toolBtn = document.getElementById('text-tool-btn');
        if (toolBtn) toolBtn.classList.remove('active');
        document.querySelector('.flashcard-scene').style.cursor = 'default';

        textContent.focus();
    });
});
// 241行目付近の selectText / deselectText を書き換え
function selectText(el) { 
    deselectText(); 
    selectedTextEl = el; 
    el.classList.add('is-selected'); 

    // --- 【追加】リサイズ制限の更新 ---
    updateResizeLimits(el);

    const sizePicker = document.getElementById('font-size-picker');
    const text = el.querySelector('.text-content');
    if (text && sizePicker) sizePicker.value = parseInt(text.style.fontSize) || 16;
}
function deselectText() { 
    if(selectedTextEl) { 
        selectedTextEl.classList.remove('is-selected'); 
        selectedTextEl = null; 
    } 
}

// 標準エディタ機能（太字・下線・色・サイズ）
function formatText(command) {
    // テキストボックスが選択されていない場合は何もしない
    if (!selectedTextEl) return; 
    
    const textContent = selectedTextEl.querySelector('.text-content');
    if (!textContent) return;

    // 選択された範囲の文字ではなく、テキストボックス「全体」のスタイルを切り替える
    if (command === 'bold') {
        textContent.style.fontWeight = textContent.style.fontWeight === 'bold' ? 'normal' : 'bold';
    } else if (command === 'underline') {
        textContent.style.textDecoration = textContent.style.textDecoration.includes('underline') ? 'none' : 'underline';
    } else if (command === 'italic') {
        textContent.style.fontStyle = textContent.style.fontStyle === 'italic' ? 'normal' : 'italic';
    }
}

// 標準エディタ機能（太字・下線・色・サイズ）の少し下にある changeFontSize を書き換え
function changeFontSize(e) { 
    if(!selectedTextEl) return;
    const newSize = e.target.value + 'px';

    const c = selectedTextEl.querySelector('.text-content'); 
    if (c) c.style.fontSize = newSize;
    saveCurrentCardState();
}



// ドラッグ機能
let isDragging = false; 
let startX, startY, initialLeft, initialTop;
const UI_MARGIN = 20;
function startDrag(e, el) { 
    // マウス操作の時だけデフォルトの画像ドラッグを防止（タッチ操作時のエラーを防ぐ）
    e.stopPropagation();
    if (e.type === 'mousedown') {
        // e.button !== 0 は左クリック以外を除外
        if (e.button !== 0) return;
        e.preventDefault();
    }
    
    isDragging = true; 

    selectText(el);
    
    // マウスとタッチ両方の座標を正確に取得
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    startX = clientX; 
    startY = clientY; 
    
    // parseFloatのエラーを回避するため offsetLeft / offsetTop を使用
    initialLeft = el.offsetLeft; 
    initialTop = el.offsetTop; 
    
    // マウスとタッチの両方の移動イベントを監視
    window.addEventListener('mousemove', drag, { passive: false }); 
    window.addEventListener('mouseup', stopDrag); 
    window.addEventListener('touchmove', drag, { passive: false }); 
    window.addEventListener('touchend', stopDrag); 
}

function drag(e) {
    if (!isDragging || !selectedTextEl) return;
    if (e.type === 'mousemove' && e.buttons === 0) {
        stopDrag();
        return;
    }
    // 画面全体がスクロールしてしまうのを防ぐ
    if (e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const parent = selectedTextEl.parentElement;
    const parentRect = parent.getBoundingClientRect();
    
    const elWidth = selectedTextEl.offsetWidth;
    const elHeight = selectedTextEl.offsetHeight;

    let newLeft = initialLeft + (clientX - startX);
    let newTop = initialTop + (clientY - startY);

    const maxLeft = parentRect.width - elWidth - UI_MARGIN;
    const maxTop = parentRect.height - elHeight - UI_MARGIN;

    if (newLeft < UI_MARGIN) newLeft = UI_MARGIN;
    if (newLeft > maxLeft) newLeft = maxLeft;
    if (newTop < UI_MARGIN) newTop = UI_MARGIN;
    if (newTop > maxTop) newTop = maxTop;

    selectedTextEl.style.left = `${newLeft}px`;
    selectedTextEl.style.top = `${newTop}px`;

    updateResizeLimits(selectedTextEl);
}

// 🔄 リサイズ制限を画像にも適用するように修正
function updateResizeLimits(el) {
    const parent = el.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const left = parseFloat(el.style.left) || 0;
    const top = parseFloat(el.style.top) || 0;

    const maxWidth = parentRect.width - left - UI_MARGIN;
    const maxHeight = parentRect.height - top - UI_MARGIN;

    const textContent = el.querySelector('.text-content');
    if (textContent) {
        textContent.style.maxWidth = `${maxWidth}px`;
        textContent.style.maxHeight = `${maxHeight}px`;
    } else if (el.classList.contains('draggable-image')) {
        // 【変更点】画像の場合はコンテナ自身に最大サイズ制限をかける
        el.style.maxWidth = `${maxWidth}px`;
        el.style.maxHeight = `${maxHeight}px`;
    }
}
function stopDrag() { 
    if (!isDragging) return;
    isDragging = false; 
    window.removeEventListener('mousemove', drag); 
    window.removeEventListener('mouseup', stopDrag); 
    window.removeEventListener('touchmove', drag); 
    window.removeEventListener('touchend', stopDrag); 
    
    // --- 修正箇所：再選択の処理を追加 ---
    // 保存処理によって選択が解除される前に、掴んでいた要素を記憶しておく
    const targetEl = selectedTextEl; 

    // 移動終了時に確実に保存する（※この中で一度選択が解除される）
    saveCurrentCardState(); 

    // 保存完了後、記憶しておいた要素をすぐに「再選択」する
    if (targetEl) {
        selectText(targetEl);
    }
}

// ==========================================
// 5. テンプレート機能
// ==========================================
function toggleTemplateMenu(e) {
    e.stopPropagation();
    const menu = document.querySelector('.template-menu');
    if (menu) menu.classList.toggle('show');
}

document.addEventListener('click', () => {
    const menu = document.querySelector('.template-menu');
    if (menu) menu.classList.remove('show');
});

function saveTemplate() {
    // 画面の見た目を崩さないよう、HTMLのクローンを作成
    const frontClone = document.getElementById('card-front').cloneNode(true);
    const backClone = document.getElementById('card-back').cloneNode(true);

    // テキストボックスの中身だけをリセットする関数
    const resetTextContent = (container) => {
        container.querySelectorAll('.draggable-text').forEach(el => {
            const textContent = el.querySelector('.text-content');
            if (textContent) {
                // ここを「テキストを入力」に統一します
                textContent.innerText = t('placeholder_text_input'); 
            }
            el.classList.remove('is-selected'); 
        });
    };

    resetTextContent(frontClone);
    resetTextContent(backClone);

    const templateName = prompt(t('prompt_template_name'), t('new_template'));
    if (!templateName) return;

    let templates = JSON.parse(localStorage.getItem('card_templates') || '[]');
    templates.push({ 
        id: Date.now(), 
        name: templateName, 
        front: frontClone.innerHTML, 
        back: backClone.innerHTML,
        frontBg: document.getElementById('card-front').style.backgroundColor,
        backBg: document.getElementById('card-back').style.backgroundColor
    });
    localStorage.setItem('card_templates', JSON.stringify(templates));
    renderTemplateList();
    alert(t('alert_template_saved'));
}

// ==========================================
// 変更箇所 3: テンプレートリストの描画と名前変更関数
// ==========================================
function renderTemplateList() {
    const listContainer = document.getElementById('saved-templates-list');
    if (!listContainer) return;
    
    let templates = JSON.parse(localStorage.getItem('card_templates') || '[]');
    listContainer.innerHTML = '';

    if (templates.length === 0) {
        listContainer.innerHTML = '<div class="template-menu-item" style="color:#999; cursor:default;">保存済なし</div>';
        return;
    }

    templates.forEach(template => {
        const row = document.createElement('div');
        row.className = 'template-item-row';

        const loadBtn = document.createElement('div');
        loadBtn.className = 'template-menu-item';
        loadBtn.innerHTML = `<i data-lucide="file-text"></i> <span>${template.name}</span>`;
        loadBtn.onclick = () => loadTemplate(template.id);

        // ボタンをまとめるコンテナ
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'template-item-actions';

        // 編集（リネーム）ボタン
        const editBtn = document.createElement('button');
        editBtn.className = 'template-item-edit';
        editBtn.innerHTML = `<i data-lucide="edit-2"></i>`;
        editBtn.title = t('tooltip_rename');
        editBtn.onclick = (e) => {
            e.stopPropagation();
            renameTemplate(template.id);
        };

        // 削除ボタン
        const delBtn = document.createElement('button');
        delBtn.className = 'template-item-delete';
        delBtn.innerHTML = `<i data-lucide="x"></i>`;
        delBtn.title = t('tooltip_delete_template');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTemplate(template.id);
        };

        actionsContainer.appendChild(editBtn);
        actionsContainer.appendChild(delBtn);

        row.appendChild(loadBtn);
        row.appendChild(actionsContainer);
        listContainer.appendChild(row);
    });

    refreshIcons();
}

// 名前変更用の関数を追加
function renameTemplate(templateId) {
    let templates = JSON.parse(localStorage.getItem('card_templates') || '[]');
    const target = templates.find(t => t.id === templateId);
    
    if (!target) return;

    const newName = prompt(t('prompt_new_name'), target.name);
    
    if (newName !== null && newName.trim() !== "") {
        target.name = newName.trim();
        localStorage.setItem('card_templates', JSON.stringify(templates));
        renderTemplateList();
    }
}

// テンプレート削除用関数
function deleteTemplate(templateId) {
    if (!confirm(t('confirm_delete_template'))) return;

    let templates = JSON.parse(localStorage.getItem('card_templates') || '[]');
    // 指定したID以外のテンプレートを残す（＝削除）
    const newTemplates = templates.filter(t => t.id !== templateId);
    
    localStorage.setItem('card_templates', JSON.stringify(newTemplates));
    
    // リストを再描画
    renderTemplateList();
}

function loadTemplate(templateId) {
    let templates = JSON.parse(localStorage.getItem('card_templates') || '[]');
    const target = templates.find(t => t.id === templateId);
    
    if (target) {
        if (!confirm(t('confirm_apply_template') + target.name + t('confirm_apply_template_end'))) return;
        
        const frontEl = document.getElementById('card-front');
        const backEl = document.getElementById('card-back');
        
        frontEl.innerHTML = target.front;
        backEl.innerHTML = target.back;
        frontEl.style.backgroundColor = target.frontBg || "";
        backEl.style.backgroundColor = target.backBg || "";
        // 流し込んだ後にイベント（ドラッグや削除など）を再バインド
        rebindEvents(frontEl);
        rebindEvents(backEl);
        
        // Lucideアイコン（移動・削除ボタン）の再描画
        refreshIcons();
        
        // 編集状態として即座に保存
        saveCurrentCardState(); 
        
        document.querySelector('.template-menu').classList.remove('show');

        // 1. 展開された新しいテキストボックスの中身を強制的にリセット
        const textboxes = document.querySelectorAll('.flashcard .draggable-text');
        let maxCounter = 0;
        textboxes.forEach(box => {
            const textContentEl = box.querySelector('.text-content');
            if (textContentEl) {
                textContentEl.innerText = t('placeholder_text_input'); // デフォルト文字にリセット
            }

            // ✨ ラベル（名前）の復元処理
            let labelEl = box.querySelector('.textbox-label');
            let boxName = box.getAttribute('data-name');

            if (!boxName) {
                boxName = `${t('label_textbox')} ${index + 1}`;
                box.setAttribute('data-name', boxName);
            }
            // もしテンプレートのHTMLからラベル要素が欠落していたら、新しく作ってくっつける
            if (!labelEl) {
                labelEl = document.createElement('div');
                labelEl.className = 'textbox-label';
                labelEl.textContent = boxName;
                box.appendChild(labelEl);
            }
            // 「テキストボックス 3」などの数字部分を抽出して、カウンターの最大値を把握する
            const match = boxName.match(/\d+/);
            if (match) {
                const num = parseInt(match[0], 10);
                if (num > maxCounter) maxCounter = num;
            }
        });
        // 次に新しいテキストボックスを追加した時、数字が被らないようにカウンターを更新
        if (typeof textBoxCounter !== 'undefined') {
            textBoxCounter = maxCounter;
        }
        // 2. 新しいテキストボックスとパネルを「再接続」させる（ゴーストを消す）
        if (typeof syncPanelWithCard === 'function') {
            syncPanelWithCard();
        }
    }
}

// ==========================================
// 6. サーバー通信 (保存・読み込み)
// ==========================================
async function saveCardSet() {
    saveCurrentCardState(); 
    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) {
        alert(t('alert_login_to_save'));
        return false;
    }
    const session = JSON.parse(sessionStr);

    try {
        const response = await authenticatedFetch('/api/cards/save', {
            method: 'POST',
            body: JSON.stringify({
                folderId: parseInt(window.CURRENT_FOLDER_ID, 10), 
                userEmail: session.id, 
                cards: cards.map(card => ({
                    front:   getServerHTML(card.front   || ''),
                    back:    getServerHTML(card.back    || ''),
                    frontBg: card.frontBg || '',
                    backBg:  card.backBg  || ''
                }))
            })
        });

        if (response.ok) {
            alert(t('alert_card_saved'));
            return true;
        } else {
            const data = await response.json();
            alert(t('alert_save_failed') + ': ' + (data.message || ''));
            return false;
        }
    } catch (e) {
        console.error("Save Error:", e);
        alert(t('network_error'));
        return false;
    }
}

async function saveAndExit() {
    const success = await saveCardSet();
    if (success) window.location.href = '/';
}

async function loadSavedCards(folderId) {
    const sessionStr = localStorage.getItem('user_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;

    try {
        const url = `/api/cards/load/${folderId}${session ? `?userEmail=${encodeURIComponent(session.id)}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
            alert(t('alert_load_failed'));
            return;
        }

        const savedCards = await response.json();
        if (savedCards && savedCards.length > 0) {
            // Only replace local state if we are at the initial empty card or haven't added new ones
            if (cards.length === 1 && cards[0].front === "" && cards[0].back === "") {
                cards = savedCards;
            } else {
                // If user already added cards, we merge or just notify (here we prefer DB for initial load)
                cards = savedCards;
            }
            currentCardIndex = 0;
            renderCard();
            updateThumbnailBar();
        } else {
            renderCard();
        }
    } catch (e) {
        console.error("Load Error:", e);
        alert(t('alert_comm_error'));
    }
}

// 🌟 以下の関数を editor.js のどこかに追加してください
function syncPanelWithCard() {
    const panel = document.getElementById('text-list-panel');
    // パネルが開いている場合のみ、中身を再描画する
    if (panel && panel.classList.contains('is-open')) {
        renderTextList();
    }
}
// パネルの開閉を行う関数
function toggleTextListPanel() {
    const panel = document.getElementById('text-list-panel');
    panel.classList.toggle('is-open');
    
    // パネルが開いた時にリストを最新状態に更新する
    if (panel.classList.contains('is-open')) {
        renderTextList();
    }
}

// 🔄 パネルの中身を生成する関数（修正版）
function renderTextList() {
    const container = document.getElementById('text-list-content');
    if (!container) return; 
    
    container.innerHTML = ''; 

    const textboxes = document.querySelectorAll('.flashcard .draggable-text');

    if (textboxes.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center; margin-top:20px;">このカードにはテキストがありません</p>';
        return;
    }

    textboxes.forEach(box => {
        const textContentEl = box.querySelector('.text-content');
        if (!box.id) box.id = 'box-' + Math.random().toString(36).substr(2, 9);
        
        const boxName = box.getAttribute('data-name') || t('unnamed_textbox');

        if (!textContentEl) return;

        const row = document.createElement('div');
        row.className = 'text-list-row';

        // --- 名前編集用の入力欄 ---
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = boxName;
        nameInput.className = 'name-edit-input'; 
        
        nameInput.addEventListener('input', (e) => {
            const newName = e.target.value;
            box.setAttribute('data-name', newName);
            const labelEl = box.querySelector('.textbox-label');
            if (labelEl) labelEl.textContent = newName;
            if (typeof saveCurrentCardState === 'function') saveCurrentCardState();
        });

        // --- ✨ テキスト中身編集用（ここを大幅改善） ---
        const input = document.createElement('textarea');
        input.value = textContentEl.innerText;
        input.className = 'content-edit-input'; // CSSを当てるためのクラスを追加
        input.placeholder = t('placeholder_text_input');   // 空の時に薄く表示される文字

        // ✨ 追加：クリック（フォーカス）した時に「テキストを入力」なら一瞬で消す
        input.addEventListener('focus', (e) => {
            if (e.target.value.trim() === t('placeholder_text_input')) {
                e.target.value = '';             // パネル側の文字を空にする
                textContentEl.innerText = '';    // カード側の文字も空にする
                if (typeof saveCurrentCardState === 'function') saveCurrentCardState();
            }
        });

        input.addEventListener('input', (e) => {
            textContentEl.innerText = e.target.value;
            if (typeof saveCurrentCardState === 'function') saveCurrentCardState();
        });

        row.appendChild(nameInput);
        row.appendChild(input);
        container.appendChild(row);
    });
}


// 🔄 サムネイル一覧を最新状態に更新する関数
// 🔄 サムネイル一覧を最新状態に更新する関数（完全版）
function updateThumbnailBar() {
    const listContainer = document.getElementById('thumbnail-list');
    if (!listContainer) return;

    listContainer.innerHTML = ''; // 一旦クリア

    if (typeof cards === 'undefined' || cards.length === 0) return;

    cards.forEach((card, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumbnail-item';
        
        // 現在のカードならハイライト
        if (index === currentCardIndex) {
            thumb.classList.add('is-active');
        }

        // --- 🎨 表面の見た目をプレビューとして描画 ---
        const preview = document.createElement('div');
        preview.className = 'thumb-preview';
        
        // 背景色の反映 (保存データ構造に合わせて card.frontBg を使用)
        preview.style.backgroundColor = card.frontBg || 'var(--bg-canvas)';
        
        // カード表面のHTMLをそのまま流し込む
        const previewContent = document.createElement('div');
        previewContent.className = 'thumb-preview-content';
        previewContent.innerHTML = card.front || ''; // 保存されているテキストボックス群を展開
        
        preview.appendChild(previewContent);

        // 👆 クリックで確実にそのカードへ移動する処理
        thumb.onclick = () => {
            if (index === currentCardIndex) return; // 同じカードなら無視
            
            saveCurrentCardState();   // 今のカードの編集状態を保存
            currentCardIndex = index; // ページ番号を更新
            renderCard();             // 🎯 ここが重要：画面にカードを描画！
            
            updateThumbnailBar();     // サムネイルの枠を更新
            if (typeof syncPanelWithCard === 'function') syncPanelWithCard(); // パネルも同期
        };

        // 番号バッジを追加
        const badge = document.createElement('div');
        badge.className = 'thumbnail-number';
        badge.innerText = index + 1;
        
        thumb.appendChild(preview);
        thumb.appendChild(badge);
        listContainer.appendChild(thumb);
    });

    scrollToActiveThumbnail(); // 選択中のカードまで自動スクロール
    refreshIcons(); // Lucideアイコンの再描画
}

// 🎯 選択中のサムネイルへ自動スクロールする関数
function scrollToActiveThumbnail() {
    const activeThumb = document.querySelector('.thumbnail-item.is-active');
    if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

//スクロールする関数
function scrollThumbnails(direction) {
    const list = document.getElementById('thumbnail-list');
    if (list) {
        const scrollAmount = 300; // 1回のクリックでの移動量
        list.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
}
// 🖱️ マウスホイールで横スクロールできるようにするイベント
document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById('thumbnail-list');
    if (list) {
        list.addEventListener('wheel', (e) => {
            // 縦スクロール（ホイールの回転）を横スクロールに変換
            if (e.deltaY !== 0) {
                e.preventDefault(); // 画面全体のスクロールを防ぐ
                if(e.deltaY < 0) {
                    scrollThumbnails(-1); // 上にスクロール → 左へ
                }
                else if(e.deltaY > 0) {
                    scrollThumbnails(1); // 下にスクロール → 右へ
                }
                //list.scrollLeft += e.deltaY;
            }
        });
    }
});
function jumpToFace(isBack) {
    const cardInner = document.getElementById('current-card');
    if (!cardInner) return;

    cardInner.style.transition = 'none'; // アニメを一時オフ
    
    if (isBack) {
        cardInner.classList.add('is-flipped');
    } else {
        cardInner.classList.remove('is-flipped');
    }
    
    void cardInner.offsetWidth; // 強制リフロー
    cardInner.style.transition = ''; // アニメを戻す
}

// --- キーボード操作（エディター用：Viewerと同じ挙動 + 入力欄ガード） ---
window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') return;
    if (document.activeElement.contentEditable === 'true') return;

    const cardInner = document.getElementById('current-card');
    if (!cardInner) return;
    
    const isFlipped = cardInner.classList.contains('is-flipped');

    // 右矢印キーの挙動：表面なら「裏返す」、裏面なら「次のカードの表面へ」
    if (e.key === 'ArrowRight') {
        if (!isFlipped) {
            cardInner.classList.add('is-flipped'); // 表面なら裏返す（アニメあり）
        } else {
            // nextCard() 内で「jumpToFace(false)」が呼ばれ、アニメなしで表面になります
            if (typeof nextCard === 'function') nextCard();
        }
    } 
    // 左矢印キーの挙動：裏面なら「表に戻す」、表面なら「前のカードの裏面へ」
    else if (e.key === 'ArrowLeft') {
        if (isFlipped) {
            cardInner.classList.remove('is-flipped'); // 裏面なら表面に戻す（アニメあり）
        } else {
            // prevCard() 内で「jumpToFace(true)」が呼ばれ、アニメなしで裏面になります
            if (typeof prevCard === 'function') prevCard();
        }
    } 
    // スペースまたはエンターで単純反転
    else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); 
        cardInner.classList.toggle('is-flipped');
    }
});

// 🖼️ 画像をカードに追加する関数
function addImageToCard(url) {
    if (!url || !url.trim()) return;
    
    const currentCard = document.getElementById('current-card');
    const isBack = currentCard.classList.contains('is-flipped');
    const targetFace = isBack ? document.getElementById('card-back') : document.getElementById('card-front');

    const frontFace = document.getElementById('card-front');
    const backFace = document.getElementById('card-back');
    const existingFront = frontFace.querySelector('.draggable-image');
    const existingBack = backFace.querySelector('.draggable-image');
    if (existingFront) existingFront.remove();
    if (existingBack) existingBack.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'draggable-image';
    wrapper.style.left = '50px';
    wrapper.style.top = '50px';

    const dragHandle = document.createElement('div');
    dragHandle.innerHTML = '<i data-lucide="move"></i>';
    dragHandle.className = 'drag-handle';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button'; 
    deleteBtn.innerHTML = '<i data-lucide="x"></i>'; 
    deleteBtn.className = 'delete-btn';

    // ✨ 新規追加：サイズ変更用のツマミ
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';

    const imgEl = document.createElement('img');
    imgEl.src = url.trim();
    imgEl.alt = t('alt_card_image');
    imgEl.draggable = false; // ブラウザのデフォルトドラッグ防止
    
    // ✨ 画像が読み込まれたら本来の縦横比を計算して設定する
    imgEl.onload = () => {
        const aspect = imgEl.naturalWidth / imgEl.naturalHeight;
        wrapper.dataset.aspect = aspect; // 比率をHTMLのデータとして記憶
        
        // 初期サイズ（横幅最大200px、縦長の場合は高さ最大200pxに調整）
        let w = 200;
        let h = w / aspect;
        if (h > 200) {
            h = 200;
            w = h * aspect;
        }
        wrapper.style.width = w + 'px';
        wrapper.style.height = h + 'px';
    };

    imgEl.onerror = () => {
        alert(t('alert_image_load_failed'));
        wrapper.remove();
    };

    wrapper.appendChild(dragHandle);
    wrapper.appendChild(imgEl);
    wrapper.appendChild(deleteBtn);
    wrapper.appendChild(resizeHandle); // ツマミを要素に追加
    targetFace.appendChild(wrapper);

    rebindEvents(targetFace);
    if (window.lucide) lucide.createIcons();
    
    saveCurrentCardState();
    selectText(wrapper); 
    updateThumbnailBar(); 
}

function getServerHTML(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    // 削除ボタン・ドラッグハンドル・リサイズハンドル・ラベルを除去
    temp.querySelectorAll('.delete-btn, .drag-handle, .resize-handle, .textbox-label').forEach(el => el.remove());
    // 選択状態クラスを除去
    temp.querySelectorAll('.is-selected').forEach(el => el.classList.remove('is-selected'));
    return temp.innerHTML;
}
function restoreUIElements(container) {
    container.querySelectorAll('.draggable-text').forEach(box => {
        const boxName = box.getAttribute('data-name') || t('label_textbox');
        if (!box.querySelector('.textbox-label')) {
            const label = document.createElement('div');
            label.className = 'textbox-label';
            label.textContent = boxName;
            box.insertBefore(label, box.firstChild);
        }
        if (!box.querySelector('.drag-handle')) {
            const handle = document.createElement('div');
            handle.innerHTML = '<i data-lucide="move"></i>';
            handle.className = 'drag-handle';
            box.insertBefore(handle, box.firstChild);
        }
        if (!box.querySelector('.delete-btn')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.innerHTML = '<i data-lucide="x"></i>';
            btn.className = 'delete-btn';
            box.appendChild(btn);
        }
        const tc = box.querySelector('.text-content');
        if (tc) tc.contentEditable = 'true';
    });

    container.querySelectorAll('.draggable-image').forEach(img => {
        if (!img.querySelector('.drag-handle')) {
            const handle = document.createElement('div');
            handle.innerHTML = '<i data-lucide="move"></i>';
            handle.className = 'drag-handle';
            img.insertBefore(handle, img.firstChild);
        }
        if (!img.querySelector('.delete-btn')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.innerHTML = '<i data-lucide="x"></i>';
            btn.className = 'delete-btn';
            img.appendChild(btn);
        }
        if (!img.querySelector('.resize-handle')) {
            const resize = document.createElement('div');
            resize.className = 'resize-handle';
            img.appendChild(resize);
        }
    });
}
// icon --------------------------------------------------------------------------
// アイコンを再描画する専用の関数を作る
function refreshIcons() {
    if (window.lucide) {
        lucide.createIcons();
    } else {
        console.error("Lucide is not loaded!");
    }
}