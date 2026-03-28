
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
    if (!email) return alert(I18n.t('alert_email_required'));
 
    const COOLDOWN_MS = 60 * 1000;
    const lastSentAt = parseInt(localStorage.getItem('codeSentAt') || '0', 10);
    const elapsed = Date.now() - lastSentAt;
 
    if (elapsed < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        alert(I18n.t('alert_code_resend_cooldown', { seconds: remaining }));
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
            alert(I18n.t('alert_code_sent'));
        } else {
            alert(I18n.t('alert_send_failed') + (data.message ? ': ' + data.message : ''));
            localStorage.removeItem('codeSentAt');
            btn.disabled = false;
            btn.innerText = I18n.t('btn_send_code');
        }
    } catch (e) {
        console.error("Fetch Error:", e);
        alert(I18n.t('alert_server_unreachable'));
        localStorage.removeItem('codeSentAt');
        btn.disabled = false;
        btn.innerText = I18n.t('btn_send_code');
    }
}

function startCooldownTimer(btn) {
    const COOLDOWN_SEC = 60;
    const update = () => {
        const lastSentAt = parseInt(localStorage.getItem('codeSentAt') || '0', 10);
        const remaining = COOLDOWN_SEC - Math.floor((Date.now() - lastSentAt) / 1000);
        if (remaining <= 0) {
            btn.disabled = false;
            btn.innerText = I18n.t('btn_send_code');
        } else {
            btn.innerText = I18n.t('alert_code_resend_cooldown', { seconds: remaining });
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

    if (!username || !email || !code || !password) return alert(I18n.t('alert_fill_all_fields'));

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
            alert(I18n.t('alert_signup_failed', { message: data.message || '' }));
        }
    } catch (e) {
        console.error("Signup Error:", e);
        alert(I18n.t('alert_network_error'));
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

            alert(I18n.t('alert_login_success'));
            closeAuthModal();
            window.location.reload();
        } else {
            alert(I18n.t('alert_login_failed'));
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert(I18n.t('alert_login_error'));
    }
}

// --- ログアウト ---
function handleLogout() {
    localStorage.removeItem('user_session');
    localStorage.removeItem('csrf_token');
    alert(I18n.t('alert_logout_success'));
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
                <a href="/account" class="dropdown-item"><i data-lucide="user"></i> <span data-i18n="menu_account_info">${I18n.t('menu_account_info')}</span></a>
                <div class="dropdown-divider"></div>
                <button onclick="handleLogout()" class="dropdown-item logout-btn"><i data-lucide="log-out"></i> <span data-i18n="btn_logout">${I18n.t('btn_logout')}</span></button>
            `;
            dropdown.classList.remove('hidden');
        }
    } else {
        if (authBtn) {
            authBtn.innerHTML = `<i data-lucide="user"></i>`;
        }
        if (dropdown) {
            dropdown.innerHTML = `
                <button onclick="showLogin()" class="dropdown-item"><i data-lucide="log-in"></i> <span data-i18n="btn_login">${I18n.t('btn_login')}</span></button>
            `;
            dropdown.classList.remove('hidden');
        }
    }

    if (window.lucide) lucide.createIcons();
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
        if (loginView) loginView.style.display = 'block';
        if (signupView) signupView.style.display = 'none';
    } else {
        if (loginView) loginView.style.display = 'none';
        if (signupView) signupView.style.display = 'block';
    }
}
