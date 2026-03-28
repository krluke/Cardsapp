// --- static/account.js ---

// static/account.js の冒頭部分
document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();

    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) {
        window.location.href = "/";
        return;
    }

    const session = JSON.parse(sessionStr);
    // session.id か session.email のどちらか入っている方を使う
    const userEmail = session.id || session.email;

    if (!userEmail) {
        console.error("Email not found in session");
        document.getElementById('display-username').innerText = "セッションエラー";
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
        document.getElementById('display-username').innerText = "読み込み失敗";
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