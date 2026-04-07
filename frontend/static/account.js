// --- static/account.js ---

async function loadUserStats() {
    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);
    const userEmail = session.id || session.email;
    if (!userEmail) return;

    try {
        const response = await fetch(`/api/user/stats?email=${encodeURIComponent(userEmail)}&authEmail=${encodeURIComponent(userEmail)}`);
        const data = await response.json();

        if (response.ok) {
            const foldersCount = data.foldersCount || 0;
            const likesCount = data.likesCount || 0;
            const favoritesCount = data.favoritesCount || 0;

            const usernameEl = document.getElementById('display-username');
            const emailEl = document.getElementById('display-email');
            const foldersEl = document.getElementById('stat-cards');
            const likesEl = document.getElementById('stat-likes');
            const favoritesEl = document.getElementById('stat-favorites');

            if (usernameEl) usernameEl.innerText = data.username;
            if (emailEl) emailEl.innerText = data.email;
            if (foldersEl) foldersEl.innerText = foldersCount;
            if (likesEl) likesEl.innerText = formatCount(likesCount);
            if (favoritesEl) favoritesEl.innerText = formatCount(favoritesCount);
        }
    } catch (e) {
        console.error('Failed to load user stats:', e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    await loadUserStats();
});

document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
        await loadUserStats();
    }
});

window.addEventListener('focus', async () => {
    await loadUserStats();
});

function formatCount(num) {
    if (!num || num === 0) return 0;
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num;
}