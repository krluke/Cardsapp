// --- static/account.js ---

document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();

    function t(key) {
        const lang = localStorage.getItem('selectedLang') || 'ja';
        if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
            return translations[lang][key];
        }
        return key;
    }

    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) {
        window.location.href = "/";
        return;
    }

    const session = JSON.parse(sessionStr);
    const userEmail = session.id || session.email;

    if (!userEmail) {
        console.error("Email not found in session");
        document.getElementById('display-username').innerText = t('session_error');
        return;
    }

    try {
        const response = await fetch(`/api/user/stats?email=${encodeURIComponent(userEmail)}&authEmail=${encodeURIComponent(userEmail)}`);
        const data = await response.json();

        if (response.ok) {
            document.getElementById('display-username').innerText = data.username;
            document.getElementById('display-email').innerText = data.email;
            document.getElementById('stat-cards').innerText = data.cardsCount;
            document.getElementById('stat-likes').innerText = formatCount(data.likesCount);
            document.getElementById('stat-favorites').innerText = formatCount(data.favoritesCount);
        } else {
            throw new Error(data.error);
        }
    } catch (e) {
        console.error(e);
        document.getElementById('display-username').innerText = t('load_failed');
    }
});

// 数値フォーマット関数（index.jsで使ったものと同じ）
function formatCount(num) {
    if (!num) return 0;
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num;
}