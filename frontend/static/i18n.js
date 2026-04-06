// =============================================
// i18n.js - 多言語対応
// =============================================

const translations = {
    ja: {
        // ナビゲーション共通
        "btn_create_folder":        "新規作成",
        "btn_home":                 "ホームに戻る",
        // ホーム タブ
        "tab_my_folders":           "マイドライブ",
        "tab_global_folders":       "公開カード",
        // ホーム 検索
        "search_placeholder":       "フォルダーを検索...",
        "btn_search":               "🔍 検索",
        // ホーム ゲストメッセージ
        "guest_message":            "ログインするとフォルダを作成できます。",
        "guest_login_btn":          "ログインする",
        "global_guest_message":     "ログインすると全世界の公開カードを閲覧できます。",
        // フォルダ設定モーダル
        "folder_settings_title":    "フォルダ設定",
        "label_folder_name":        "フォルダ名",
        "placeholder_folder_name":  "フォルダ名",
        "label_visibility":         "公開設定",
        "visibility_private":       "プライベート (自分のみ)",
        "visibility_public":        "パブリック (全体公開)",
        "visibility_shared":        "特定の人のみ (準備中)",
        "btn_save":                 "セーブ",
        "btn_delete":               "削除",
        // 認証モーダル
        "login_title":              "ログイン",
        "placeholder_login_id":     "メール または ユーザー名",
        "placeholder_password":     "パスワード",
        "btn_login":                "ログイン",
        "switch_to_signup_text":    "アカウントがない？",
        "switch_to_signup_link":    "新規登録",
        "signup_title":             "新規登録",
        "placeholder_username":     "ユーザー名",
        "placeholder_email":        "メールアドレス",
        "btn_send_code":            "送信",
        "placeholder_verify_code":  "認証コード",
        "btn_signup":               "登録",
        "switch_to_login_text":     "作成済み？",
        "switch_to_login_link":     "ログイン",
        // フォルダグリッド
        "no_folders":               "該当するフォルダがありません。",
        "creator_label":            "作成者: ",
        // アカウントメニュー
        "menu_account_info":        "アカウント情報",
        "menu_logout":              "ログアウト",
        "menu_login":               "ログイン / 登録",
        // ビューワー
        "viewer_title":             "カードビューワー",
        "viewing_mode":             "閲覧モード",
        "btn_prev_card":            "前のカード",
        "btn_next_card":            "次のカード",
        // ★ エディタ
        "editor_title":             "カードエディタ",
        "btn_add_text":             "テキスト追加",
        "btn_bold":                 "太字",
        "btn_underline":            "下線",
        "btn_italic":               "斜体",
        "font_size_label":          "サイズ",
        "font_standard":            "標準",
        "font_large":               "やや大",
        "font_xlarge":              "特大",
        "font_size_input":          "サイズ変更",
        "label_bg_color":           "背景色:",
        "label_text_color":         "テキスト色:",
        "label_add_image":          "画像追加:",
        "placeholder_image_url":    "URLをペーストしてEnter",
        "btn_list_view":            "一覧表示",
        "text_list_title":          "テキスト一覧",
        "btn_template":             "テンプレート",
        "btn_save_template":        "現在の状態を保存",
        "btn_save_exit":            "セーブして終了",
        "btn_delete_card":          "削除",

        "btn_back_home":          "ホームに戻る",

        "changing_password":    "アカウントのパスワードを変更します。",
        "password_change":      "パスワードを変更する",

        "stat_cards":            "カード",
        "stat_likes":          "いいね",
        "stat_favorites":        "お気に入り",

        "setting_theme":         "テーマ",
        "theme_sand":          "🏖 サンド＆クリーム",
        "theme_dark":           "🌙 ダークモード",
        "theme_blue":           "💙 青",

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
        "theme_sand":          "🏖 Sand & Cream",
        "theme_dark":           "🌙 Dark Mode",
        "theme_blue":           "💙 Blue",

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
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = translations[lang]?.[key];
        if (!text) return;

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = text;
        } else if (el.tagName === 'OPTION') {
            el.textContent = text;
        } else if (el.tagName === 'TITLE') {
            document.title = text;
        } else if (el.querySelector('i[data-lucide]')) {
            // アイコン付きボタン：アイコンを保持してテキストだけ差し替え
            const icon = el.querySelector('i[data-lucide]');
            el.textContent = ' ' + text;
            el.prepend(icon);
        } else {
            el.textContent = text;
        }
    });

    // data-i18n-title：title属性（tooltip）の書き換え
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const text = translations[lang]?.[key];
        if (text) el.title = text;
    });
}

// --- 3. 言語ドロップダウンの開閉 ---
function toggleLangMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('lang-dropdown');
    const isHidden = dropdown.classList.contains('hidden');
    document.getElementById('auth-dropdown')?.classList.add('hidden');
    dropdown.classList.toggle('hidden', !isHidden);
}

function selectLanguage(lang, event) {
    event.stopPropagation();
    document.getElementById('lang-dropdown').classList.add('hidden');
    document.getElementById('current-lang-text').textContent = lang.toUpperCase();
    changeLanguage(lang);
}

// 外側クリックで言語メニューを閉じる
window.addEventListener('click', function (e) {
    const langMenu = document.querySelector('.lang-menu');
    const langDropdown = document.getElementById('lang-dropdown');
    if (langDropdown && langMenu && !langMenu.contains(e.target)) {
        langDropdown.classList.add('hidden');
    }
});

// --- 4. ページ読み込み時に保存済み言語を適用 ---
window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('selectedLang') || 'ja';
    const textSpan = document.getElementById('current-lang-text');
    if (textSpan) textSpan.textContent = savedLang.toUpperCase();
    changeLanguage(savedLang);
});