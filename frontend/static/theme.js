// theme.js – handles theme selection globally (no login required)
function getCsrfToken(){
  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  return session.csrfToken || null;
}

function initThemeSelector() {
  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const userEmail = session.email || session.id;
  if (userEmail) {
    fetch(`/api/user/theme?userEmail=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(data => {
        const theme = data.theme || 'light';
        applyTheme(theme);
      })
      .catch(() => {
        applyTheme('light');
      });
  } else {
    const current = localStorage.getItem('app-theme') || 'light';
    applyTheme(current);
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = current === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  // Persist for logged-in user if available
  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const userEmail = session.email || session.id;
  if (userEmail) {
    fetch('/api/user/theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken()
      },
      body: JSON.stringify({ userEmail, theme: newTheme })
    }).catch(() => {});
  } else {
    localStorage.setItem('app-theme', newTheme);
  }
}
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = current === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('app-theme', theme);
  
  // Update toggle icons if they exist
  const sunIcons = document.querySelectorAll('#theme-icon-sun');
  const moonIcons = document.querySelectorAll('#theme-icon-moon');
  
  if (theme === 'dark') {
    sunIcons.forEach(el => el.classList.add('hidden'));
    moonIcons.forEach(el => el.classList.remove('hidden'));
  } else {
    sunIcons.forEach(el => el.classList.remove('hidden'));
    moonIcons.forEach(el => el.classList.add('hidden'));
  }

  // Backward compatibility for any remaining selectors
  const selectors = document.querySelectorAll('.theme-selector, #theme-selector');
  selectors.forEach(s => { s.value = theme; });
}

// Cross-tab synchronization
window.addEventListener('storage', e => {
  if (e.key === 'app-theme') {
    const newTheme = e.newValue || 'light';
    applyTheme(newTheme);
  }
});
