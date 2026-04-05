// i18n.js - i18next migration
// This handles loading translations from JSON files and updating the DOM.

async function initI18n() {
    const savedLang = localStorage.getItem('selectedLang') || 'ja';

    await i18next
        .use(i18nextHttpBackend)
        .init({
            lng: savedLang,
            fallbackLng: 'en',
            backend: {
                loadPath: '/static/locales/{{lng}}.json',
            }
        });

    updateDOM();
    document.body.classList.remove('i18n-loading');
    
    // Set language switcher text if it exists
    const textSpan = document.getElementById('current-lang-text');
    if (textSpan) textSpan.textContent = savedLang.toUpperCase();
}

function updateDOM() {
    // 1. Text, placeholders, and options
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = i18next.t(key);
        if (!text || text === key) return;

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = text;
        } else if (el.tagName === 'OPTION') {
            el.textContent = text;
        } else if (el.tagName === 'TITLE') {
            document.title = text;
        } else {
            // Check for Lucide icons (i or svg)
            const icon = el.querySelector('[data-lucide]');
            if (icon) {
                // Keep the icon and update only the text node
                // Clear all but the icon
                Array.from(el.childNodes).forEach(node => {
                    if (node !== icon && !icon.contains(node)) {
                        el.removeChild(node);
                    }
                });
                el.appendChild(document.createTextNode(' ' + text));
            } else {
                el.textContent = text;
            }
        }
    });

    // 2. Tooltips (title attributes)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const text = i18next.t(key);
        if (text && text !== key) el.title = text;
    });
}

function changeLanguage(lang) {
    i18next.changeLanguage(lang, () => {
        localStorage.setItem('selectedLang', lang);
        updateDOM();
        const textSpan = document.getElementById('current-lang-text');
        if (textSpan) textSpan.textContent = lang.toUpperCase();
    });
}

// Global helpers for other scripts
function toggleLangMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('lang-dropdown');
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains('hidden');
    document.getElementById('auth-dropdown')?.classList.add('hidden');
    dropdown.classList.toggle('hidden', !isHidden);
}

function selectLanguage(lang, event) {
    event.stopPropagation();
    document.getElementById('lang-dropdown')?.classList.add('hidden');
    changeLanguage(lang);
}

// Close dropdown on outside click
window.addEventListener('click', function (e) {
    const langMenu = document.querySelector('.lang-menu');
    const langDropdown = document.getElementById('lang-dropdown');
    if (langDropdown && langMenu && !langMenu.contains(e.target)) {
        langDropdown.classList.add('hidden');
    }
});

// Auto-init (Wait for DOM because we need to remove the loading class)
document.addEventListener('DOMContentLoaded', initI18n);
