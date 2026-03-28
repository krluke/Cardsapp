// =============================================
// i18n.js - Multilingual Support System
// =============================================

const I18n = {
    translations: {
        ja: {
            // === INDEX PAGE ===
            btn_create_folder: "新規作成",
            btn_login: "ログイン/登録",
            btn_logout: "ログアウト",
            menu_account_info: "アカウント情報",
            tab_my_folders: "マイドライブ",
            tab_global_folders: "公開カード",
            search_placeholder: "フォルダーを検索...",
            btn_search: "🔍 検索",
            guest_message: "ログインするとフォルダを作成できます。",
            global_guest_message: "ログインすると全世界の公開カードを閲覧できます。",
            folder_settings_title: "フォルダ設定",
            label_folder_name: "フォルダ名",
            placeholder_folder_name: "フォルダ名",
            label_visibility: "公開設定",
            visibility_private: "プライベート (自分のみ)",
            visibility_public: "パブリック (全体公開)",
            visibility_shared: "特定の人のみ (準備中)",
            btn_save: "保存",
            btn_delete: "削除",
            login_title: "ログイン",
            signup_title: "新規登録",
            placeholder_login_id: "メール または ユーザー名",
            placeholder_password: "パスワード",
            placeholder_username: "ユーザー名",
            placeholder_email: "メールアドレス",
            btn_send_code: "送信",
            placeholder_verify_code: "認証コード",
            btn_signup: "登録",
            switch_to_signup_text: "アカウントがない？",
            switch_to_signup_link: "新規登録",
            switch_to_login_text: "作成済み？",
            switch_to_login_link: "ログイン",
            menu_guest: "ゲストユーザー",
            btn_login_required: "ログインする",

            // === EDITOR PAGE ===
            editor_title: "カードエディタ",
            btn_home: "ホームに戻る",
            btn_add_text: "テキスト追加",
            btn_bold: "太字",
            btn_underline: "下線",
            btn_italic: "斜体",
            font_size: "サイズ",
            font_standard: "標準",
            font_large: "やや大",
            font_xlarge: "特大",
            label_bg_color: "背景色:",
            label_text_color: "テキスト色:",
            label_add_image: "画像追加:",
            placeholder_image_url: "URLをペーストしてEnter",
            btn_list_view: "一覧表示",
            btn_template: "テンプレート",
            btn_save_template: "現在の状態を保存",
            btn_save: "セーブ",
            btn_save_exit: "セーブして終了",
            btn_delete_card: "削除",
            card_counter: "{current} / {total}",
            text_list_title: "テキスト一覧",
            btn_close: "閉じる",

            // === VIEWER PAGE ===
            viewer_title: "カードビューワー",
            btn_prev_card: "前のカード (←キー)",
            btn_next_card: "次のカード (→キー)",
            viewing_mode: "閲覧モード",

            // === ACCOUNT PAGE ===
            account_title: "アカウント情報",
            btn_back_home: "ホームに戻る",
            stat_cards: "カード",
            stat_likes: "いいね",
            stat_favorites: "お気に入り",
            setting_theme: "サイトのテーマ",
            theme_sand: "🌅 サンド＆クリーム",
            theme_dark: "🌙 ダークモード",

            // === ALERTS & PROMPTS ===
            alert_email_required: "メールアドレスを入力してください",
            alert_code_resend_cooldown: "送信済みです。あと {seconds} 秒後に再送できます。",
            alert_code_sent: "認証コードを送信しました！メールをご確認ください。",
            alert_send_failed: "エラー: 送信に失敗しました",
            alert_server_unreachable: "サーバーに接続できません。",
            alert_fill_all_fields: "すべての項目を入力してください",
            alert_signup_failed: "登録失敗: {message}",
            alert_network_error: "通信エラーが発生しました。インターネット接続やサーバーの状態を確認してください。",
            alert_login_success: "ログインに成功しました！",
            alert_login_failed: "ログイン失敗: IDまたはパスワードが違います",
            alert_login_error: "通信エラーが発生しました",
            alert_logout_success: "ログアウトしました",
            prompt_folder_name: "新しいフォルダ名を入力してください",
            prompt_default_folder: "新しいフォルダ",
            alert_folder_created: "フォルダを作成しました",
            alert_folder_create_failed: "作成に失敗しました",
            alert_save_failed: "保存に失敗しました",
            alert_delete_failed: "削除に失敗しました",
            alert_network: "通信エラー",
            alert_login_required: "ログインが必要です",
            alert_card_deleted: "削除しました",
            alert_card_delete_failed: "削除に失敗しました",
            alert_save_template_name: "テンプレート名を入力:",
            alert_default_template: "マイテンプレート",
            alert_template_saved: "レイアウトをテンプレートとして保存しました！",
            alert_template_rename: "新しいテンプレート名を入力してください:",
            alert_login_required_save: "セーブするにはログインが必要です。",
            alert_cards_saved: "カードを保存しました！",
            alert_save_failed_server: "サーバー保存失敗: {message}",
            alert_save_network_error: "通信エラーが発生しました。",
            alert_load_failed: "過去のデータ読み込みに失敗しました（サーバーエラー）",
            alert_load_network_error: "通信エラーにより、以前のカードを読み込めませんでした",
            alert_image_load_failed: "画像を読み込めませんでした。URLが正しいか確認してください。",
            alert_data_load_failed: "データの読み込みに失敗しました。",
            alert_confirm_delete: "このカードをデータベースから完全に削除しますか？",
            alert_confirm_discard_home: "本当にホームに戻りますか？保存していない変更は失われます。",
            alert_confirm_discard_card: "作成中のカードを破棄しますか？",
            alert_confirm_apply_template: "テンプレート「{name}」を適用しますか？\n（現在の内容が上書きされます）",
            alert_confirm_delete_template: "このテンプレートを削除してもよろしいですか？",
        },
        en: {
            // === INDEX PAGE ===
            btn_create_folder: "New Folder",
            btn_login: "Login / Register",
            btn_logout: "Logout",
            menu_account_info: "Account Info",
            tab_my_folders: "My Drive",
            tab_global_folders: "Public Cards",
            search_placeholder: "Search folders...",
            btn_search: "🔍 Search",
            guest_message: "Login to create folders.",
            global_guest_message: "Login to browse public cards from around the world.",
            folder_settings_title: "Folder Settings",
            label_folder_name: "Folder Name",
            placeholder_folder_name: "Folder name",
            label_visibility: "Visibility",
            visibility_private: "Private (Only me)",
            visibility_public: "Public (Everyone)",
            visibility_shared: "Specific people (Coming soon)",
            btn_save: "Save",
            btn_delete: "Delete",
            login_title: "Login",
            signup_title: "Sign Up",
            placeholder_login_id: "Email or Username",
            placeholder_password: "Password",
            placeholder_username: "Username",
            placeholder_email: "Email address",
            btn_send_code: "Send",
            placeholder_verify_code: "Verification code",
            btn_signup: "Register",
            switch_to_signup_text: "No account?",
            switch_to_signup_link: "Sign Up",
            switch_to_login_text: "Already have one?",
            switch_to_login_link: "Login",
            menu_guest: "Guest User",
            btn_login_required: "Login",

            // === EDITOR PAGE ===
            editor_title: "Card Editor",
            btn_home: "Home",
            btn_add_text: "Add Text",
            btn_bold: "Bold",
            btn_underline: "Underline",
            btn_italic: "Italic",
            font_size: "Size",
            font_standard: "Standard",
            font_large: "Large",
            font_xlarge: "X-Large",
            label_bg_color: "Background:",
            label_text_color: "Text:",
            label_add_image: "Add Image:",
            placeholder_image_url: "Paste URL and Enter",
            btn_list_view: "List View",
            btn_template: "Template",
            btn_save_template: "Save Current State",
            btn_save: "Save",
            btn_save_exit: "Save & Exit",
            btn_delete_card: "Delete",
            card_counter: "{current} / {total}",
            text_list_title: "Text List",
            btn_close: "Close",

            // === VIEWER PAGE ===
            viewer_title: "Card Viewer",
            btn_prev_card: "Previous (←)",
            btn_next_card: "Next (→)",
            viewing_mode: "Viewing Mode",

            // === ACCOUNT PAGE ===
            account_title: "Account Info",
            btn_back_home: "Back to Home",
            stat_cards: "Cards",
            stat_likes: "Likes",
            stat_favorites: "Favorites",
            setting_theme: "Site Theme",
            theme_sand: "🌅 Sand & Cream",
            theme_dark: "🌙 Dark Mode",

            // === ALERTS & PROMPTS ===
            alert_email_required: "Please enter your email address",
            alert_code_resend_cooldown: "Already sent. Try again in {seconds} seconds.",
            alert_code_sent: "Verification code sent! Please check your email.",
            alert_send_failed: "Error: Failed to send",
            alert_server_unreachable: "Cannot connect to server.",
            alert_fill_all_fields: "Please fill in all fields",
            alert_signup_failed: "Registration failed: {message}",
            alert_network_error: "Network error. Please check your connection and try again.",
            alert_login_success: "Login successful!",
            alert_login_failed: "Login failed: Incorrect ID or password",
            alert_login_error: "Communication error",
            alert_logout_success: "Logged out",
            prompt_folder_name: "Enter folder name",
            prompt_default_folder: "New Folder",
            alert_folder_created: "Folder created",
            alert_folder_create_failed: "Failed to create folder",
            alert_save_failed: "Failed to save",
            alert_delete_failed: "Failed to delete",
            alert_network: "Network error",
            alert_login_required: "Login required",
            alert_card_deleted: "Deleted",
            alert_card_delete_failed: "Failed to delete card",
            alert_save_template_name: "Enter template name:",
            alert_default_template: "My Template",
            alert_template_saved: "Layout saved as template!",
            alert_template_rename: "Enter new template name:",
            alert_login_required_save: "Please login to save.",
            alert_cards_saved: "Cards saved!",
            alert_save_failed_server: "Server save failed: {message}",
            alert_save_network_error: "Network error during save.",
            alert_load_failed: "Failed to load previous data (server error)",
            alert_load_network_error: "Could not load previous cards due to network error",
            alert_image_load_failed: "Could not load image. Please check the URL.",
            alert_data_load_failed: "Failed to load data.",
            alert_confirm_delete: "Permanently delete this card from database?",
            alert_confirm_discard_home: "Return to home? Unsaved changes will be lost.",
            alert_confirm_discard_card: "Discard current card?",
            alert_confirm_apply_template: "Apply template \"{name}\"?\n(Current content will be overwritten)",
            alert_confirm_delete_template: "Delete this template?",
        },

    currentLang: 'ja',

    init() {
        const savedLang = localStorage.getItem('selectedLang');
        const browserLang = navigator.language?.split('-')[0];
        
        if (savedLang && this.translations[savedLang]) {
            this.currentLang = savedLang;
        } else if (this.translations[browserLang]) {
            this.currentLang = browserLang;
            localStorage.setItem('selectedLang', this.currentLang);
        }

        this.updateUI();
        return this.currentLang;
    },

    setLang(lang) {
        if (!this.translations[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('selectedLang', lang);
        this.updateUI();
    },

    t(key, params = {}) {
        let text = this.translations[this.currentLang]?.[key] || key;
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, v);
        });
        return text;
    },

    updateUI() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (!text || text === key) return;

            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else if (el.tagName === 'OPTION') {
                el.textContent = text;
            } else if (el.tagName === 'TITLE') {
                document.title = text;
            } else {
                el.textContent = text;
            }
        });

        const textSpan = document.getElementById('current-lang-text');
        if (textSpan) {
            textSpan.textContent = this.currentLang.toUpperCase();
        }

        document.documentElement.lang = this.currentLang;
    }
};

function changeLanguage(lang) {
    I18n.setLang(lang);
}

function toggleLangMenu() {
    const dropdown = document.getElementById('lang-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
    const authDropdown = document.getElementById('auth-dropdown');
    if (authDropdown) authDropdown.classList.add('hidden');
}

function selectLanguage(lang) {
    const dropdown = document.getElementById('lang-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    changeLanguage(lang);
}

window.addEventListener('DOMContentLoaded', () => {
    const lang = I18n.init();
    
    const textSpan = document.getElementById('current-lang-text');
    if (textSpan) {
        textSpan.textContent = lang.toUpperCase();
    }
});

window.I18n = I18n;
