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
        // Auth alerts
        "code_sent":                "確認コードを送信しました",
        "send_failed":              "送信に失敗しました",
        "server_connect_error":     "サーバーに接続できません",
        "fill_all_fields":          "すべての項目を入力してください",
        "signup_failed":            "登録に失敗しました",
        "network_error":            "ネットワークエラー",
        "login_success":            "ログインしました",
        "login_failed":             "ログインに失敗しました",
        "logged_out":               "ログアウトしました",
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

        // index.js
        "prompt_folder_name":       "フォルダ名を入力",
        "untitled_folder":          "無題のフォルダ",
        "alert_folder_create_failed": "フォルダの作成に失敗しました",
        "alert_comm_error":         "通信エラー",
        "alert_save_failed":        "保存に失敗しました",
        "confirm_delete_folder":    "本当に削除しますか？",
        "alert_delete_failed":      "削除に失敗しました",
        "alert_login_required":     "ログインしてください",
        "label_creator":            "作成者: ",
        "unknown_user":             "不明",
        "label_id":                 "ID: ",
        // editor.js
        "confirm_discard_exit":     "編集内容を破棄してホームに戻りますか？",
        "placeholder_text_input":   "テキストを入力",
        "confirm_discard_card":     "このカードを破棄しますか？",
        "confirm_delete_card":      "本当に削除しますか？",
        "alert_card_deleted":       "カードを削除しました",
        "alert_card_delete_failed": "カードの削除に失敗しました",
        "label_textbox":            "テキストボックス",
        "prompt_template_name":     "テンプレート名を入力",
        "new_template":             "新しいテンプレート",
        "alert_template_saved":     "テンプレートを保存しました",
        "tooltip_rename":           "名前を変更",
        "tooltip_delete_template":  "テンプレートを削除",
        "prompt_new_name":          "新しい名前を入力",
        "confirm_delete_template":  "このテンプレートを削除しますか？",
        "confirm_apply_template":   "テンプレート「",
        "confirm_apply_template_end": "」を適用しますか？",
        "alert_login_to_save":      "保存するにはログインしてください",
        "alert_card_saved":         "カードを保存しました",
        "alert_load_failed":        "読み込みに失敗しました",
        "alert_image_load_failed":  "画像の読み込みに失敗しました",
        "alt_card_image":           "カード画像",
        "unnamed_textbox":          "名称未設定",
        // viewer.js
        "alert_data_load_failed":   "データの読み込みに失敗しました",
        // change_password.js
        "alert_not_logged_in":      "ログインしていません。ログイン画面に戻ります。",
        "password_mismatch":        "新しいパスワードが一致しません。",
        "password_changed_success": "パスワードが正常に変更されました！",
        "password_change_failed":   "パスワードの変更に失敗しました。",
        "comm_error_occurred":      "通信エラーが発生しました。",
        // account.js
        "session_error":            "セッションエラー",
        "load_failed":              "読み込み失敗",

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
        // Auth alerts
        "code_sent":                "Verification code sent",
        "send_failed":              "Failed to send",
        "server_connect_error":     "Cannot connect to server",
        "fill_all_fields":          "Please fill in all fields",
        "signup_failed":            "Registration failed",
        "network_error":            "Network error",
        "login_success":            "Logged in successfully",
        "login_failed":             "Login failed",
        "logged_out":               "Logged out",
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

        // index.js
        "prompt_folder_name":       "Enter folder name",
        "untitled_folder":          "Untitled Folder",
        "alert_folder_create_failed": "Failed to create folder",
        "alert_comm_error":         "Communication error",
        "alert_save_failed":        "Failed to save",
        "confirm_delete_folder":    "Are you sure you want to delete?",
        "alert_delete_failed":      "Failed to delete",
        "alert_login_required":     "Please log in",
        "label_creator":            "By: ",
        "unknown_user":             "Unknown",
        "label_id":                 "ID: ",
        // editor.js
        "confirm_discard_exit":     "Discard changes and return to home?",
        "placeholder_text_input":   "Type text here",
        "confirm_discard_card":     "Discard this card?",
        "confirm_delete_card":      "Are you sure you want to delete?",
        "alert_card_deleted":       "Card deleted",
        "alert_card_delete_failed": "Failed to delete card",
        "label_textbox":            "Text Box",
        "prompt_template_name":     "Enter template name",
        "new_template":             "New Template",
        "alert_template_saved":     "Template saved",
        "tooltip_rename":           "Rename",
        "tooltip_delete_template":  "Delete template",
        "prompt_new_name":          "Enter new name",
        "confirm_delete_template":  "Delete this template?",
        "confirm_apply_template":   "Apply template \"",
        "confirm_apply_template_end": "\"?",
        "alert_login_to_save":      "Please log in to save",
        "alert_card_saved":         "Card saved",
        "alert_load_failed":        "Failed to load",
        "alert_image_load_failed":  "Failed to load image",
        "alt_card_image":           "Card image",
        "unnamed_textbox":          "Unnamed",
        // viewer.js
        "alert_data_load_failed":   "Failed to load data",
        // change_password.js
        "alert_not_logged_in":      "Not logged in. Returning to login screen.",
        "password_mismatch":        "New passwords do not match.",
        "password_changed_success": "Password changed successfully!",
        "password_change_failed":   "Failed to change password.",
        "comm_error_occurred":      "A communication error occurred.",
        // account.js
        "session_error":            "Session error",
        "load_failed":              "Load failed",

     }
}

// --- Initialize translations on page load (with proper language detection) ---
// This will run after translations object is defined
let initTranslations = () => {
    const lang = localStorage.getItem('selectedLang') || 'ja';
    
    // data-i18n-title：title属性（tooltip）の書き換え
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const text = translations[lang]?.[key];
        if (text) el.title = text;
    });
};

// Call on DOM ready and after page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTranslations);
} else {
    initTranslations();
}

// --- 3. 言語ドロップダウンの開閉 ---
function toggleLangMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('lang-dropdown');
    const isHidden = dropdown.classList.contains('hidden');
    document.getElementById('auth-dropdown')?.classList.add('hidden');
    document.getElementById('theme-dropdown')?.classList.add('hidden');
    dropdown.classList.toggle('hidden', !isHidden);
}

function selectLanguage(lang, event) {
    event.stopPropagation();
    document.getElementById('lang-dropdown').classList.add('hidden');
    document.getElementById('current-lang-text').textContent = lang.toUpperCase();
    changeLanguage(lang);
}

// --- changeLanguage function: Update all UI elements to selected language ---
function changeLanguage(lang) {
    // Save selected language to localStorage
    localStorage.setItem('selectedLang', lang);
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            const text = translations[lang][key];
            
            // For input elements, use placeholder; for textareas, use placeholder; otherwise use textContent
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else if (el.tagName === 'OPTION') {
                // For option elements, set text content
                el.textContent = text;
            } else {
                // For buttons, labels, divs, spans, etc., set text content
                el.textContent = text;
            }
        }
    });
    
    // Update all elements with data-i18n-placeholder attribute (explicit placeholder)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });
    
    // Update all elements with data-i18n-title attribute (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (translations[lang] && translations[lang][key]) {
            el.title = translations[lang][key];
        }
    });
    
    // Update data-i18n-value attributes (for options, buttons, etc.)
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
        const key = el.getAttribute('data-i18n-value');
        if (translations[lang] && translations[lang][key]) {
            el.value = translations[lang][key];
        }
    });
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