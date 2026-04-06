
// auth.js の一番上に追加
const API_URL = "/api";

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
        options.body.csrfToken = csrfToken;
    }
    
    return fetch(url, { ...options, headers: { ...headers, ...options.headers } });
}

// --- 【新規登録】1. コードを送信 ---
async function sendVerificationCode() {
    const email = document.getElementById('signup-email').value;
    if (!email) return alert('メールアドレスを入力してください');
 
    const COOLDOWN_MS = 60 * 1000;
    const lastSentAt = parseInt(localStorage.getItem('codeSentAt') || '0', 10);
    const elapsed = Date.now() - lastSentAt;
 
    if (elapsed < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        alert(`${remaining}秒後に再送信できます`);
        return;
    }
 
    const btn = document.getElementById('send-code-btn');
    btn.disabled = true;
    localStorage.setItem('codeSentAt', Date.now().toString());
    startCooldownTimer(btn);
 
     try {
        const response = await authenticatedFetch(`${API_URL}/send-code`, {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (response.ok) {
            alert('確認コードを送信しました');
        } else {
            alert('送信に失敗しました' + (data.message ? ': ' + data.message : ''));
            localStorage.removeItem('codeSentAt');
            btn.disabled = false;
            btn.innerText = '送信';
        }
    } catch (e) {
        console.error("Fetch Error:", e);
        alert('サーバーに接続できません');
        localStorage.removeItem('codeSentAt');
        btn.disabled = false;
        btn.innerText = '送信';
    }
}

function startCooldownTimer(btn) {
    const COOLDOWN_SEC = 60;
    const update = () => {
        const lastSentAt = parseInt(localStorage.getItem('codeSentAt') || '0', 10);
        const remaining = COOLDOWN_SEC - Math.floor((Date.now() - lastSentAt) / 1000);
        if (remaining <= 0) {
            btn.disabled = false;
            btn.innerText = '送信';
        } else {
            btn.innerText = `${remaining}秒後に再送信できます`;
            setTimeout(update, 1000);
        }
    };
    update();
}

// --- 【新規登録】2. アカウント作成 ---
async function handleSignup(e) {
    if (e) e.preventDefault();

    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const code = document.getElementById('signup-code').value;
    const password = document.getElementById('signup-password').value;

    if (!username || !email || !code || !password) return alert('すべての項目を入力してください');

    try {
        const response = await authenticatedFetch(`${API_URL}/signup`, {
            method: 'POST',
            body: JSON.stringify({ email, code, username, password })
        });
        
        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            document.getElementById('login-id').value = email;
            document.getElementById('login-password').value = password;
            handleLogin();
        } else {
            alert('登録に失敗しました: ' + (data.message || ''));
        }
    } catch (e) {
        console.error("Signup Error:", e);
        alert('ネットワークエラー');
    }
}

// --- 【ログイン】 ---
async function handleLogin(e) {
    if (e) e.preventDefault();

    const loginId = document.getElementById('login-id').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: loginId, password: password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('user_session', JSON.stringify({
                id: data.email || loginId,
                username: data.username,
                email: data.email || loginId,
                isLoggedIn: true,
                csrfToken: data.csrfToken || null
            }));

            alert('ログインしました');
            closeAuthModal();
            window.location.reload();
        } else {
            alert('ログインに失敗しました');
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert('通信エラー');
    }
}

// --- ログアウト ---
function handleLogout() {
    localStorage.removeItem('user_session');
    localStorage.removeItem('csrf_token');
    alert('ログアウトしました');
    window.location.reload();
}

// ページ読み込み時のUI反映処理
window.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('user_session'));
    const authBtn = document.getElementById('account-icon-btn');
    const dropdown = document.getElementById('auth-dropdown');

    if (session && session.isLoggedIn) {
        if (authBtn) {
            authBtn.innerHTML = `<i data-lucide="user-check"></i> <span style="margin-left:8px;font-weight:bold;">${session.username}</span>`;
        }
        if (dropdown) {
            dropdown.innerHTML = `
                <a href="/account" class="dropdown-item" data-i18n="menu_account_info">
                    <i data-lucide="user"></i> アカウント情報
                </a>
                <div class="dropdown-divider"></div>
                <button onclick="handleLogout()" class="dropdown-item logout-btn" data-i18n="menu_logout">
                        <i data-lucide="log-out"></i> ログアウト
                </button>
            `;
        }
    } else {
        if (authBtn) {
            authBtn.innerHTML = `<i data-lucide="user"></i>`;
        }
        if (dropdown) {
            dropdown.innerHTML = `
                <button onclick="showLogin()" class="dropdown-item" data-i18n="menu_login">
                    <i data-lucide="log-in"></i> ログイン/登録
                </button>
            `;
        }
    }

    if (window.lucide) lucide.createIcons();
    if (typeof changeLanguage === 'function') {
        changeLanguage(localStorage.getItem('selectedLang') || 'ja');
    }
});

// --- モーダル制御 ---
function showLogin() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('hidden');
        switchAuthView('login');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
}

function switchAuthView(view) {
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');

    if (view === 'login') {
        if (loginView)  loginView.classList.remove('hidden');
        if (signupView) signupView.classList.add('hidden');
    } else {
        if (loginView)  loginView.classList.add('hidden');
        if (signupView) signupView.classList.remove('hidden');
    }
}
