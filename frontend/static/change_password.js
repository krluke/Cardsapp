document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('change-password-form');
    const errorMsg = document.getElementById('error-message');
    const successMsg = document.getElementById('success-message');

    function t(key) {
        const lang = localStorage.getItem('selectedLang') || 'ja';
        if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
            return translations[lang][key];
        }
        return key;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        errorMsg.classList.add('hidden');
        successMsg.classList.add('hidden');

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            errorMsg.textContent = t('password_mismatch');
            errorMsg.style.display = 'block';
            return;
        }

        const sessionStr = localStorage.getItem('user_session');
        if (!sessionStr) {
            alert(t('alert_not_logged_in'));
            window.location.href = '/';
            return;
        }
        const session = JSON.parse(sessionStr);

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
                successMsg.textContent = t('password_changed_success');
                successMsg.classList.remove('hidden');
                form.reset();
            } else {
                errorMsg.textContent = data.error || data.message || t('password_change_failed');
                errorMsg.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
            errorMsg.textContent = t('comm_error_occurred');
            errorMsg.classList.remove('hidden');
        }
    });
});