document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('change-password-form');
    const errorMsg = document.getElementById('error-message');
    const successMsg = document.getElementById('success-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // メッセージをリセット
        errorMsg.classList.add('hidden');
        successMsg.classList.add('hidden');

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // 1. パスワードの一致確認
        if (newPassword !== confirmPassword) {
            errorMsg.textContent = '新しいパスワードが一致しません。';
            errorMsg.style.display = 'block';
            return;
        }

        // 2. ローカルストレージからユーザー情報を取得
        const sessionStr = localStorage.getItem('user_session');
        if (!sessionStr) {
            alert('ログインしていません。ログイン画面に戻ります。');
            window.location.href = '/';
            return;
        }
        const session = JSON.parse(sessionStr);

        // 3. サーバーへリクエスト送信
        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // CSRFトークンが必要な場合はここに追加
                    'X-CSRF-Token': session.csrfToken || ''
                },
                body: JSON.stringify({
                    userEmail: session.id,
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                // 成功時
                successMsg.textContent = 'パスワードが正常に変更されました！';
                successMsg.classList.remove('hidden');
                form.reset(); // フォームを空にする
            } else {
                // エラー時（現在のパスワードが違うなど）
                errorMsg.textContent = data.error || data.message || 'パスワードの変更に失敗しました。';
                errorMsg.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
            errorMsg.textContent = '通信エラーが発生しました。';
            successMsg.classList.remove('hidden');
        }
    });
});