// static/index.js
let currentFolderId = null;
let currentTab = 'my-folders';
let currentPage = 1;
let currentSearch = '';

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

document.addEventListener('DOMContentLoaded', () => {
    checkLoginState();
    if (window.lucide) lucide.createIcons();
});

// --- ログイン状態のチェックと表示更新 ---
function checkLoginState() {
    const sessionStr = localStorage.getItem('user_session');
    
    const els = {
        addBtn: document.getElementById('add-folder-btn'),
        guestMsg: document.getElementById('guest-message'),
        myGrid: document.getElementById('my-folders-grid'),
        menuGuest: document.getElementById('menu-guest'),
        menuUser: document.getElementById('menu-user'),
        menuUsername: document.getElementById('menu-username'),
        accountIcon: document.querySelector('#account-icon-btn i'),
        globalGuestMsg: document.getElementById('global-guest-message'),
        globalGrid: document.getElementById('global-folders-grid')
    };

    if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (els.menuUsername) els.menuUsername.innerText = session.username;
        if (els.addBtn) els.addBtn.classList.remove('hidden');
        if (els.myGrid) els.myGrid.classList.remove('hidden');
        if (els.menuUser) els.menuUser.classList.remove('hidden');
        if (els.globalGrid) els.globalGrid.classList.remove('hidden'); 
        if (els.guestMsg) els.guestMsg.classList.add('hidden');
        if (els.menuGuest) els.menuGuest.classList.add('hidden');
        if (els.globalGuestMsg) els.globalGuestMsg.classList.add('hidden');
        if (els.accountIcon) els.accountIcon.style.color = "#3b82f6";

        loadFolders();
    } else {
        if (els.addBtn) els.addBtn.classList.add('hidden');
        if (els.myGrid) els.myGrid.classList.add('hidden');
        if (els.menuUser) els.menuUser.classList.add('hidden');
        if (els.globalGrid) els.globalGrid.classList.add('hidden');
        if (els.guestMsg) els.guestMsg.classList.remove('hidden');
        if (els.menuGuest) els.menuGuest.classList.remove('hidden');
        if (els.globalGuestMsg) els.globalGuestMsg.classList.remove('hidden');
        if (els.accountIcon) els.accountIcon.style.color = "currentColor";
    }
    if (window.lucide) lucide.createIcons();
}

// --- タブ切り替え ---
function switchTab(tabName) {
    currentTab = tabName;
    currentPage = 1;
    currentSearch = ''; 
    
    const tabMy = document.getElementById('tab-my');
    const tabGlobal = document.getElementById('tab-global');
    if (tabMy) tabMy.classList.toggle('active', tabName === 'my-folders');
    if (tabGlobal) tabGlobal.classList.toggle('active', tabName === 'global-folders');
    
    const myArea = document.getElementById('my-folders-area');
    const globalArea = document.getElementById('global-folders-area');
    if (myArea) myArea.classList.toggle('hidden', tabName !== 'my-folders');
    if (globalArea) globalArea.classList.toggle('hidden', tabName !== 'global-folders');
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    loadFolders();
}

// --- フォルダ新規作成 ---
async function createNewFolderUI() {
    const title = prompt(I18n.t('prompt_folder_name'), I18n.t('prompt_default_folder'));
    if (!title) return; 

    const session = JSON.parse(localStorage.getItem('user_session'));
    
    try {
        const res = await authenticatedFetch('/api/folders/create', {
            method: 'POST',
            body: JSON.stringify({ userEmail: session.id, title: title })
        });

        if (res.ok) {
            loadFolders(); 
        } else {
            alert(I18n.t('alert_folder_create_failed'));
        }
    } catch (e) { alert(I18n.t('alert_network')); }
}

// --- フォルダ設定（編集・削除）機能 ---
function openFolderSettings(e, id, title, vis) {
    e.stopPropagation(); 
    currentFolderId = id;
    document.getElementById('edit-folder-title').value = title;
    document.getElementById('edit-folder-visibility').value = vis || 'private';
    document.getElementById('folder-settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('folder-settings-modal').classList.add('hidden');
}

async function saveFolderSettings() {
    const title = document.getElementById('edit-folder-title').value;
    const visibility = document.getElementById('edit-folder-visibility').value;
    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) return;
    const session = JSON.parse(sessionStr);

    try {
        const res = await authenticatedFetch('/api/folders/update', {
            method: 'POST',
            body: JSON.stringify({ folderId: currentFolderId, title: title, visibility: visibility, userEmail: session.id })
        });

        if (res.ok) {
            closeSettingsModal();
            loadFolders();
        } else {
            const data = await res.json();
            alert(I18n.t('alert_save_failed') + (data.message ? ': ' + data.message : ''));
        }
    } catch (e) { alert(I18n.t('alert_network')); }
}

async function confirmDeleteFolder() {
    if (!confirm(I18n.t('alert_confirm_delete'))) return;
    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) return;
    const session = JSON.parse(sessionStr);

    try {
        const res = await authenticatedFetch('/api/folders/delete', {
            method: 'POST',
            body: JSON.stringify({ folderId: currentFolderId, userEmail: session.id })
        });

        if (res.ok) {
            closeSettingsModal();
            loadFolders();
        } else {
            const data = await res.json();
            alert(I18n.t('alert_delete_failed') + (data.message ? ': ' + data.message : ''));
        }
    } catch (e) { alert(I18n.t('alert_network')); }
}

// --- UI操作系 ---
function toggleAuthMenu() {
    const authDropdown = document.getElementById('auth-dropdown');
    // 言語メニューが開いていたら閉じる
    const langDropdown = document.getElementById('lang-dropdown');
    if (langDropdown) langDropdown.classList.add('hidden');

    authDropdown.classList.toggle('hidden');
}

// ★ 修正：window.onclick（代入）→ addEventListener に変更
//    言語メニュー・アカウントメニュー両方を正しくハンドリングする
window.addEventListener('click', function(event) {
    // --- アカウントメニューを閉じる ---
    const accountMenu = document.querySelector('.account-menu');
    const authDropdown = document.getElementById('auth-dropdown');
    if (authDropdown && accountMenu && !accountMenu.contains(event.target)) {
        authDropdown.classList.add('hidden');
    }

    // --- 言語メニューを閉じる ---
    // ※ i18n.js 側でも同様の処理をしているが、
    //    window.onclick の上書き問題を解消したことで i18n.js 側が正常動作するようになる
    const langMenu = document.querySelector('.language-menu');
    const langDropdown = document.getElementById('lang-dropdown');
    if (langDropdown && langMenu && !langMenu.contains(event.target)) {
        langDropdown.classList.add('hidden');
    }
});

// --- 検索 ---
function handleSearch() {
    currentSearch = document.getElementById('search-input').value;
    currentPage = 1;
    loadFolders();
}

// --- サーバーからデータを取得 ---
async function loadFolders() {
    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) return;
    const session = JSON.parse(sessionStr);

    try {
        const queryParams = new URLSearchParams({
            tab: currentTab,
            q: currentSearch,
            page: currentPage,
            userEmail: session.id
        });

        const response = await fetch(`/api/folders?${queryParams.toString()}`);
        if (!response.ok) throw new Error("通信エラー");

        const data = await response.json();
        
        renderFolderGrid(data.folders); 
        renderPagination(data.totalPages, data.currentPage); 

    } catch (e) {
        console.error("読み込み失敗:", e);
    }
}

// --- 取得したデータをもとにHTMLを作成 ---
function renderFolderGrid(folders) {
    const gridId = currentTab === 'my-folders' ? 'my-folders-grid' : 'global-folders-grid';
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = '';
    grid.classList.remove('hidden');

    if (folders.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 20px;">該当するフォルダがありません。</p>';
        return;
    }

    folders.forEach(folder => {
        const tile = document.createElement('div');
        tile.className = 'folder-tile shadow-btn';
        
        const target = currentTab === 'my-folders' ? 'editor' : 'viewer';
        tile.onclick = () => { window.location.href = `/${target}/${folder.id}`; };

        let settingsHtml = '';
        let statsHtml = '';

        if (currentTab === 'my-folders') {
            settingsHtml = `
                <div class="folder-settings-icon" onclick="openFolderSettings(event, ${folder.id}, '${folder.title}', '${folder.visibility || 'private'}')">
                    <i data-lucide="settings"></i>
                </div>`;
            
            if (folder.like_count > 0) {
                statsHtml = `
                    <div style="margin-top: 10px; color: #666; display: flex; align-items: center; gap: 4px; font-size: 0.9em;">
                        <i data-lucide="thumbs-up" style="width: 16px; height: 16px;"></i> ${formatCount(folder.like_count)}
                    </div>`;
            }
        } else {
            const favStyle = folder.is_favorite ? 'fill: currentColor; color: #eab308;' : 'color: #888;';
            const likeStyle = folder.is_liked ? 'fill: currentColor; color: #3b82f6;' : 'color: #888;';

            statsHtml = `
                <div style="margin-top: 15px; display: flex; gap: 15px; align-items: center;">
                    <button onclick="toggleAction(event, ${folder.id}, 'favorite')" style="background:none; border:none; cursor:pointer; display:flex; align-items:center; padding:5px;">
                        <i data-lucide="star" style="${favStyle}"></i>
                    </button>
                    <button onclick="toggleAction(event, ${folder.id}, 'like')" style="background:none; border:none; cursor:pointer; display:flex; align-items:center; gap:5px; padding:5px;">
                        <i data-lucide="thumbs-up" style="${likeStyle}"></i> 
                        <span style="font-weight: bold; color: ${folder.is_liked ? '#3b82f6' : '#888'};">${formatCount(folder.like_count)}</span>
                    </button>
                </div>`;
        }

        const iconType = currentTab === 'my-folders' ? 'folder' : 'globe';

        tile.innerHTML = `
            ${settingsHtml}
            <div class="folder-icon"><i data-lucide="${iconType}"></i></div>
            <h3>${folder.title}</h3>
            <p>${currentTab === 'my-folders' ? 'ID: ' + folder.id : '作成者: ' + (folder.username || '不明')}</p>
            ${statsHtml}
        `;
        grid.appendChild(tile);
    });

    if (window.lucide) lucide.createIcons();
}

// --- ページネーションの描画 ---
function renderPagination(totalPages, currentPageNum) {
    const container = document.getElementById('pagination-controls');
    container.innerHTML = '';
    if (totalPages <= 1) return;

    let pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 4) {
            pages = [1, 2, 3, 4, 5, '...', totalPages];
        } else if (currentPage >= totalPages - 3) {
            pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
        }
    }

    pages.forEach(p => {
        const btn = document.createElement('button');
        btn.innerText = p;
        btn.className = 'page-btn shadow-btn' + (p === currentPageNum ? ' active' : '');
        
        if (p === '...') {
            btn.disabled = true;
        } else {
            btn.onclick = () => {
                currentPage = p;
                loadFolders();
            };
        }
        container.appendChild(btn);
    });
}

// 数値フォーマット関数
function formatCount(num) {
    if (!num) return 0;
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num;
}

// いいね・お気に入りボタン
async function toggleAction(event, folderId, actionType) {
    event.stopPropagation();
    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) {
        alert(I18n.t('alert_login_required'));
        return;
    }
    const session = JSON.parse(sessionStr);

    try {
        const res = await authenticatedFetch('/api/folders/toggle-action', {
            method: 'POST',
            body: JSON.stringify({ userEmail: session.id, folderId: folderId, action: actionType })
        });
        if (res.ok) {
            loadFolders();
        }
    } catch (e) {
        console.error("アクション失敗:", e);
    }
}