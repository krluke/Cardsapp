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

<<<<<<< HEAD
function updateDOM() {
    // 1. Text, placeholders, and options
=======
        "stat_cards":            "カード",
        "stat_likes":          "いいね",
        "stat_favorites":        "お気に入り",

        "setting_theme":         "テーマ",
        "theme_sand":          "サンド＆クリーム",
        "theme_dark":           "ダークモード",
        "theme_blue":           "青",

        "change_password_title":    "パスワード変更",
        "change_password_heading":  "パスワードの変更",
        "btn_back_to_account":      "アカウントに戻る",
        "label_current_password":   "現在のパスワード",
        "placeholder_current_password": "現在のパスワード",
        "label_new_password":       "新しいパスワード",
        "placeholder_new_password": "新しいパスワード",
        "label_confirm_password":   "新しいパスワード（確認用）",
        "placeholder_confirm_password": "もう一度入力",
        "btn_save_password":        "変更を保存",

    },
    en: {
        // Navigation common
        "btn_create_folder":        "New Folder",
        "btn_home":                 "Go to Home",
        // Home tabs
        "tab_my_folders":           "My Drive",
        "tab_global_folders":       "Public Cards",
        // Home search
        "search_placeholder":       "Search folders...",
        "btn_search":               "🔍 Search",
        // Home guest messages
        "guest_message":            "Login to create folders.",
        "guest_login_btn":          "Login",
        "global_guest_message":     "Login to browse public cards from around the world.",
        // Folder settings modal
        "folder_settings_title":    "Folder Settings",
        "label_folder_name":        "Folder Name",
        "placeholder_folder_name":  "Folder name",
        "label_visibility":         "Visibility",
        "visibility_private":       "Private (Only me)",
        "visibility_public":        "Public (Everyone)",
        "visibility_shared":        "Specific people (Coming soon)",
        "btn_save":                 "Save",
        "btn_delete":               "Delete",
        // Auth modal
        "login_title":              "Login",
        "placeholder_login_id":     "Email or Username",
        "placeholder_password":     "Password",
        "btn_login":                "Login",
        "switch_to_signup_text":    "No account?",
        "switch_to_signup_link":    "Sign Up",
        "signup_title":             "Sign Up",
        "placeholder_username":     "Username",
        "placeholder_email":        "Email address",
        "btn_send_code":            "Send",
        "placeholder_verify_code":  "Verification code",
        "btn_signup":               "Register",
        "switch_to_login_text":     "Already have one?",
        "switch_to_login_link":     "Login",
        // Folder grid
        "no_folders":               "No folders found.",
        "creator_label":            "By: ",
        // Account menu
        "menu_account_info":        "Account Info",
        "menu_logout":              "Logout",
        "menu_login":               "Login / Register",
        // Viewer
        "viewer_title":             "Card Viewer",
        "viewing_mode":             "Viewing Mode",
        "btn_prev_card":            "Previous Card",
        "btn_next_card":            "Next Card",
        // ★ Editor
        "editor_title":             "Card Editor",
        "btn_add_text":             "Add Text",
        "btn_bold":                 "Bold",
        "btn_underline":            "Underline",
        "btn_italic":               "Italic",
        "font_size_label":          "Size",
        "font_standard":            "Standard",
        "font_large":               "Large",
        "font_xlarge":              "X-Large",
        "font_size_input":          "Change size",
        "label_bg_color":           "Background:",
        "label_text_color":         "Text color:",
        "label_add_image":          "Add image:",
        "placeholder_image_url":    "Paste URL and press Enter",
        "btn_list_view":            "List View",
        "text_list_title":          "Text List",
        "btn_template":             "Template",
        "btn_save_template":        "Save current state",
        "btn_save_exit":            "Save & Exit",
        "btn_delete_card":          "Delete",

        "btn_back_home":          "Go to Home",

        "changing_password":    "change the account password.",
        "password_change":      "change password",

        "stat_cards":            "Cards",
        "stat_likes":          "Likes",
        "stat_favorites":        "Favorites",

        "setting_theme":         "Theme",
        "theme_sand":          "Sand & Cream",
        "theme_dark":           "Dark Mode",
        "theme_blue":           "Blue",

        "change_password_title":    "Change Password",
        "change_password_heading":  "Change Password",
        "btn_back_to_account":      "Back to Account",
        "label_current_password":   "Current Password",
        "placeholder_current_password": "Current password",
        "label_new_password":       "New Password",
        "placeholder_new_password": "New password",
        "label_confirm_password":   "Confirm New Password",
        "placeholder_confirm_password": "Enter again",
        "btn_save_password":        "Save Changes",
    }
};

// --- 2. 翻訳を適用する ---
function changeLanguage(lang) {
    localStorage.setItem('selectedLang', lang);

    // data-i18n：テキスト・placeholder・option の書き換え
>>>>>>> main
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
