// theme.js – handles theme selection globally (no login required)
function initThemeSelector() {
  const current = localStorage.getItem('app-theme') || 'light';
  applyTheme(current);
}

function toggleTheme() {
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
