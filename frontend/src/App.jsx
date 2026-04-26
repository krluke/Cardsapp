import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { X, FolderPlus, Palette, Globe, User, LogOut, LogIn, Settings, Trash2, Search, ChevronLeft, ChevronRight, BookOpen, Plus } from 'lucide-react'
import EditorPage from './pages/EditorPage'
import ViewerPage from './pages/ViewerPage'
import StudyPage from './pages/study/StudyPage'
import AccountPage from './pages/AccountPage'
import { GlobalSearchModal } from './components/GlobalSearchModal'
import { AddToFolderModal } from './components/AddToFolderModal'
import { useModal, Modal } from './components/Modal'
import './i18n'

const API_BASE = '/api'

function t(key) {
  const lang = localStorage.getItem('app-lang') || 'ja'
  const translations = {
    ja: {
      btn_create_folder: "新規作成",
      theme_sand: "サンド＆クリーム",
      theme_dark: "ダークモード",
      theme_blue: "青",
      menu_login: "ログイン/登録",
      menu_account_info: "アカウント情報",
      menu_logout: "ログアウト",
      tab_my_folders: "マイドライブ",
      tab_global_folders: "公開フォルダ",
      search_placeholder: "フォルダーを検索...",
      btn_search: "検索",
      guest_message: "ログインするとフォルダを作成できます。",
      guest_login_btn: "ログインする",
      folder_settings_title: "フォルダ設定",
      label_folder_name: "フォルダ名",
      placeholder_folder_name: "フォルダ名",
      label_visibility: "公開設定",
      visibility_private: "プライベート (自分のみ)",
      visibility_public: "パブリック (全体公開)",
      visibility_shared: "特定の人のみ (準備中)",
      btn_save: "保存",
      btn_delete: "削除",
      error_folder_exists: "同じ名前のフォルダが既に存在します",
      error_create_folder: "フォルダの作成中にエラーが発生しました",
      error_save: "保存中にエラーが発生しました",
      error_delete: "削除中にエラーが発生しました",
      confirm_delete_folder: "このフォルダを削除してもよろしいですか？",
      success_import: "インポートが完了しました！",
      error_import: "無効なファイル形式です",
      success_export: "エクスポートが完了しました",
      error_export: "エクスポートに失敗しました",
      no_public_folders: "公開されているフォルダはありません",
      login_title: "ログイン",
      placeholder_login_id: "メール または ユーザー名",
      placeholder_password: "パスワード",
      btn_login: "ログイン",
      switch_to_signup_text: "アカウントがない？",
      switch_to_signup_link: "新規登録",
      signup_title: "新規登録",
      placeholder_username: "ユーザー名",
      placeholder_email: "メールアドレス",
      btn_send_code: "送信",
      placeholder_verify_code: "認証コード",
      btn_signup: "登録",
      switch_to_login_text: "作成済み？",
      switch_to_login_link: "ログイン",
      account_title: "アカウント情報",
      account_username: "ユーザー名",
      account_email: "メールアドレス",
      account_total_cards: "保有カード数",
      btn_back: "戻る",
      tab_global_cards: "公開カード一覧",
      search_placeholder_cards: "カードを検索...",
      no_public_cards: "公開されているカードはありません",
      btn_add_to_folder: "フォルダに追加",
      select_folder: "フォルダを選択",
      success_add_card: "カードを追加しました",
      error_add_card: "カードの追加に失敗しました",
    },
    en: {
      btn_create_folder: "New Folder",
      theme_sand: "Sand & Cream",
      theme_dark: "Dark Mode",
      theme_blue: "Blue",
      menu_login: "Login / Register",
      menu_account_info: "Account Info",
      menu_logout: "Logout",
      tab_my_folders: "My Drive",
      tab_global_folders: "Public Folders",
      search_placeholder: "Search folders...",
      btn_search: "Search",
      guest_message: "Log in to create folders.",
      guest_login_btn: "Login",
      folder_settings_title: "Folder Settings",
      label_folder_name: "Folder Name",
      placeholder_folder_name: "Folder name",
      label_visibility: "Visibility",
      visibility_private: "Private (only me)",
      visibility_public: "Public (everyone)",
      visibility_shared: "Specific people (coming soon)",
      btn_save: "Save",
      btn_delete: "Delete",
      error_folder_exists: "A folder with the same name already exists",
      error_create_folder: "Error creating folder",
      error_save: "Error saving",
      error_delete: "Error deleting folder",
      confirm_delete_folder: "Are you sure you want to delete this folder?",
      success_import: "Import successful!",
      error_import: "Invalid file format",
      success_export: "Export successful",
      error_export: "Export failed",
      no_public_folders: "No public folders yet",
      login_title: "Login",
      placeholder_login_id: "Email or Username",
      placeholder_password: "Password",
      btn_login: "Login",
      switch_to_signup_text: "No account?",
      switch_to_signup_link: "Sign up",
      signup_title: "Sign Up",
      placeholder_username: "Username",
      placeholder_email: "Email",
      btn_send_code: "Send",
      placeholder_verify_code: "Verification code",
      btn_signup: "Register",
      switch_to_login_text: "Already have one?",
      switch_to_login_link: "Login",
      account_title: "Account Info",
      account_username: "Username",
      account_email: "Email",
      account_total_cards: "Total Cards",
      btn_back: "Back",
      tab_global_cards: "All Public Cards",
      search_placeholder_cards: "Search cards...",
      no_public_cards: "No public cards yet",
      btn_add_to_folder: "Add to folder",
      select_folder: "Select folder",
      success_add_card: "Card added successfully",
      error_add_card: "Failed to add card",
    },
  }
  return translations[lang]?.[key] || key
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/editor/:folderId" element={<EditorPage />} />
        <Route path="/viewer/:folderId" element={<ViewerPage />} />
        <Route path="/study/:folderId" element={<StudyPage />} />
      </Routes>
    </BrowserRouter>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('my-folders')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authView, setAuthView] = useState('login')
  const [loginData, setLoginData] = useState({ id: '', password: '' })
  const [signupData, setSignupData] = useState({ username: '', email: '', code: '', password: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [folders, setFolders] = useState([])
  const [globalCards, setGlobalCards] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [authMenuOpen, setAuthMenuOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [lang, setLang] = useState('ja')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showAddToFolderModal, setShowAddToFolderModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [flippedCards, setFlippedCards] = useState({})
  const { modalState, showAlert, showConfirm, showPrompt, closeModal, handleConfirm, handlePromptSubmit } = useModal()

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light'
    const savedLang = localStorage.getItem('app-lang') || 'ja'
    setTheme(savedTheme)
    setLang(savedLang)
    document.documentElement.setAttribute('data-theme', savedTheme)
    
    const session = JSON.parse(localStorage.getItem('session') || '{}')
    if (session.user) setUser(session.user)
  }, [])

  // --- Gitコンフリクト修正部分：両方の機能（自動更新と未ログイン対応）を統合 ---
  useEffect(() => {
    loadFolders()
  }, [activeTab, page, searchInput, user])

  useEffect(() => {
    // 15秒ごとの定期ポーリング
    const interval = setInterval(() => {
      loadFolders()
    }, 15000)
    return () => clearInterval(interval)
  }, [activeTab, page, searchInput, user])

  useEffect(() => {
    // タブに戻ってきた時のフォーカス更新
    const handleFocus = () => {
      loadFolders()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [activeTab, page, searchInput, user])

  const getCsrfToken = () => {
    const session = JSON.parse(localStorage.getItem('session') || '{}')
    return session.csrfToken || ''
  }

const loadFolders = async () => {
    if (activeTab === 'my-folders' && !user) return
    const endpoint = '/folders'
    const params = new URLSearchParams({
      page,
      q: searchInput,
      tab: activeTab,
      userEmail: user?.email || user?.id || ''
    })
    try {
      const res = await fetch(`${API_BASE}${endpoint}?${params}`)
      const data = await res.json()
      if (data.folders) {
        setFolders(data.folders || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (e) { console.error(e) }
  }

  const loadGlobalCards = async () => {
    const params = new URLSearchParams({
      page,
      search: searchInput,
    })
    try {
      const res = await fetch(`${API_BASE}/cards/public?${params}`)
      const data = await res.json()
      if (data.cards) {
        const filteredCards = (data.cards || []).filter(card => {
          const frontContent = (card.front || '').replace(/[<>]/g, '').trim()
          const backContent = (card.back || '').replace(/[<>]/g, '').trim()
          return frontContent || backContent
        })
        setGlobalCards(filteredCards)
        setTotalPages(data.totalPages || 1)
      }
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    if (activeTab === 'global-cards') {
      loadGlobalCards()
    }
  }, [activeTab, page, searchInput, user])
  // -------------------------------------------------------------------------

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        body: JSON.stringify(loginData),
      })
      const data = await res.json()
      if (!res.ok) {
        const lang = localStorage.getItem('app-lang') || 'ja'
        const translations = {
          ja: { 'IDまたはパスワードが間違っています': 'IDまたはパスワードが間違っています', 'Network error': 'ネットワークエラー' },
          en: { 'IDまたはパスワードが間違っています': 'Invalid ID or password', 'ネットワークエラー': 'Network error' }
        }
        const translatedMsg = translations[lang]?.[data.message] || data.message || 'Login failed'
        setMessage({ type: 'error', text: translatedMsg })
        return
      }
      const session = {
        user: { id: data.email, username: data.username, email: data.email },
        csrfToken: data.csrfToken,
      }
      localStorage.setItem('session', JSON.stringify(session))
      setUser(session.user)
      setShowAuthModal(false)
      loadFolders()
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' })
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        body: JSON.stringify(signupData),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.message || 'Signup failed' })
        return
      }
      const session = {
        user: { id: data.email, username: data.username, email: data.email },
        csrfToken: data.csrfToken,
      }
      localStorage.setItem('session', JSON.stringify(session))
      setUser(session.user)
      setShowAuthModal(false)
      loadFolders()
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('session')
    setUser(null)
    setFolders([])
    setGlobalCards([])
    setActiveTab('my-folders')
    setAuthMenuOpen(false)
  }

const createNewFolder = async () => {
    const title = await showPrompt('Untitled', t('placeholder_folder_name'))
    if (!title || !user) return

    const userEmail = user.email || user.id
    if (!userEmail) return

    try {
      const res = await fetch(`${API_BASE}/folders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        body: JSON.stringify({ userEmail, title }),
      })
      const data = await res.json()
      if (res.ok) {
        loadFolders()
      } else {
        if (data.message?.includes('同じ名前') || data.message?.includes('already exists')) {
          showAlert(t('error_folder_exists'))
        } else {
          showAlert(data.message || t('error_create_folder'))
        }
      }
    } catch (e) { showAlert(t('error_create_folder')) }
  }

  const selectTheme = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('app-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    setThemeMenuOpen(false)
  }

  const selectLanguage = (newLang) => {
    setLang(newLang)
    localStorage.setItem('app-lang', newLang)
    setLangMenuOpen(false)
  }

  const openFolderSettings = (folder) => {
    setEditingFolder(folder)
    setShowSettingsModal(true)
  }

  const saveFolderSettings = async () => {
    if (!editingFolder || !user) return
    try {
      const res = await fetch(`${API_BASE}/folders/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        body: JSON.stringify({
          folderId: editingFolder.id,
          title: editingFolder.title,
          visibility: editingFolder.visibility,
          userEmail: user.email || user.id,
        }),
      })
      if (res.ok) {
        setShowSettingsModal(false)
        loadFolders()
      }
    } catch (e) { showAlert(t('error_save')) }
  }

  const exportFolder = async () => {
    if (!editingFolder || !user) return
    try {
      const res = await fetch(`${API_BASE}/folders/export?folderId=${editingFolder.id}&userEmail=${user.email || user.id}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editingFolder.title}.json`;
      a.click();
    } catch (e) { showAlert(t('error_export')) }
  }

  const importFolder = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const folderData = JSON.parse(event.target.result);
          const res = await fetch(`${API_BASE}/folders/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
            body: JSON.stringify({ folderData, userEmail: user.email || user.id }),
          });
          if (res.ok) {
            showAlert(t('success_import'))
            loadFolders();
          }
        } catch (e) { showAlert(t('error_import')) }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  const deleteFolder = async () => {
    const confirmed = await showConfirm(t('confirm_delete_folder'), t('confirm_delete_folder'))
    if (!confirmed || !editingFolder || !user) return
    try {
      const res = await fetch(`${API_BASE}/folders/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        body: JSON.stringify({ folderId: editingFolder.id, userEmail: user.email || user.id }),
      })
      if (res.ok) {
        setShowSettingsModal(false)
        loadFolders()
      }
    } catch (e) { showAlert(t('error_delete')) }
  }

  return (
    <div className="min-h-screen">
      <header className="navbar">
        <h1 className="logo">CardsApp</h1>
        
        <div className="nav-actions">
          {user && (
            <button className="primary-btn shadow-btn" onClick={createNewFolder}>
              <FolderPlus size={20} /> {t('btn_create_folder')}
            </button>
          )}
          <button className="icon-btn shadow-btn" onClick={() => setShowSearchModal(true)}>
            <Search size={20} />
          </button>
          <div className="theme-menu">
            <button className="theme-btn" onClick={() => { setThemeMenuOpen(!themeMenuOpen); setLangMenuOpen(false); setAuthMenuOpen(false) }}>
              <Palette size={15} />
            </button>
            {themeMenuOpen && (
              <div className="theme-dropdown">
                <button className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => selectTheme('light')}>
                  <span className="theme-dots"><span style={{background:'#F4F0EB'}}></span><span style={{background:'#D97757'}}></span><span style={{background:'#E05252'}}></span></span>
                  <span>{t('theme_sand')}</span>
                </button>
                <button className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => selectTheme('dark')}>
                  <span className="theme-dots"><span style={{background:'#1E1B18'}}></span><span style={{background:'#D97757'}}></span><span style={{background:'#383430'}}></span></span>
                  <span>{t('theme_dark')}</span>
                </button>
                <button className={`theme-option ${theme === 'blue' ? 'active' : ''}`} onClick={() => selectTheme('blue')}>
                  <span className="theme-dots"><span style={{background:'#1B3A6B'}}></span><span style={{background:'#3B8BEB'}}></span><span style={{background:'#D94F6E'}}></span></span>
                  <span>{t('theme_blue')}</span>
                </button>
              </div>
            )}
          </div>

          <div className="lang-menu">
            <button className="lang-btn" onClick={() => { setLangMenuOpen(!langMenuOpen); setThemeMenuOpen(false); setAuthMenuOpen(false) }}>
              <Globe size={15} />
              <span>{lang.toUpperCase()}</span>
            </button>
            {langMenuOpen && (
              <div className="lang-dropdown">
                <button className={`lang-option ${lang === 'ja' ? 'active' : ''}`} onClick={() => selectLanguage('ja')}>🇯🇵 日本語</button>
                <button className={`lang-option ${lang === 'en' ? 'active' : ''}`} onClick={() => selectLanguage('en')}>🇺🇸 English</button>
              </div>
            )}
          </div>

          <div className="account-menu">
            <button className="icon-btn shadow-btn" onClick={() => { setAuthMenuOpen(!authMenuOpen); setThemeMenuOpen(false); setLangMenuOpen(false) }}>
              <User size={20} />
            </button>
            {authMenuOpen && (
              <div className="dropdown">
                {!user ? (
                  <button className="dropdown-item" onClick={() => { setShowAuthModal(true); setAuthMenuOpen(false) }}>
                    <LogIn size={18} /> {t('menu_login')}
                  </button>
                ) : (
                  <>
                    <div className="menu-header"><span style={{fontWeight:'bold'}}>{user.username}</span></div>
                    <a href="/account" className="dropdown-item"><User size={18} /> {t('menu_account_info')}</a>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout-btn" onClick={handleLogout}><LogOut size={18} /> {t('menu_logout')}</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="page-container">
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'my-folders' ? 'active' : ''}`} onClick={() => { setActiveTab('my-folders'); setPage(1) }}>{t('tab_my_folders')}</button>
          <button className={`tab-btn ${activeTab === 'global-folders' ? 'active' : ''}`} onClick={() => { setActiveTab('global-folders'); setPage(1) }}>{t('tab_global_folders')}</button>
          <button className={`tab-btn ${activeTab === 'global-cards' ? 'active' : ''}`} onClick={() => { setActiveTab('global-cards'); setPage(1) }}>{t('tab_global_cards')}</button>
        </div>

        <div className="search-and-pagination-container">
          <div className="search-bar-wrapper">
            <input type="text" id="search-input" placeholder={activeTab === 'global-cards' ? t('search_placeholder_cards') : t('search_placeholder')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <button className="shadow-btn" onClick={activeTab === 'global-cards' ? loadGlobalCards : loadFolders}>{t('btn_search')}</button>
          </div>
          <div className="pagination-controls">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>

        {activeTab === 'my-folders' && !user && (
          <div className="empty-state">
            <p>{t('guest_message')}</p>
            <button className="primary-btn" onClick={() => setShowAuthModal(true)}>{t('guest_login_btn')}</button>
          </div>
        )}

{activeTab === 'global-folders' && folders.length === 0 && (
  <div className="empty-state">
    <p>{t('no_public_folders')}</p>
  </div>
)}

{activeTab === 'global-cards' && globalCards.length === 0 && (
  <div className="empty-state">
    <p>{t('no_public_cards')}</p>
  </div>
)}

          {(activeTab === 'my-folders' || activeTab === 'global-folders') && (
          <div className="folder-grid">
            {folders.map(folder => {
               const isOwner = activeTab === 'my-folders' || folder.username === user?.username;
               return (
                 <div key={folder.id} className="folder-tile" onClick={() => {
                    const canEdit = user && activeTab === 'my-folders';
                    console.log('click:', activeTab, user?.username, folder.username, canEdit);
                    navigate(canEdit ? `/editor/${folder.id}` : `/viewer/${folder.id}`);
                 }}>
                   <div className="folder-actions" onClick={e => e.stopPropagation()}>
                     <button className="folder-settings-icon" onClick={() => navigate(`/study/${folder.id}`, { state: { canEdit: user && activeTab === 'my-folders' } })} title="Study">
                       <BookOpen size={16} />
                     </button>
                     {isOwner && (
                       <button className="folder-settings-icon" onClick={(e) => { e.stopPropagation(); openFolderSettings(folder) }}>
                         <Settings size={16} />
                       </button>
                     )}
                   </div>
                   <h3 style={{margin: 0, fontSize: '1rem'}}>{folder.title}</h3>
                   <p style={{margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                     {activeTab === 'global-folders' && folder.username ? `${folder.username} • ` : ''}{folder.card_count || folder.cardCount || 0} cards
                   </p>
                 </div>
               );
            })}
          </div>
          )}

          {activeTab === 'global-cards' && (
            <div className="global-cards-grid">
              {globalCards.map(card => (
<div key={card.id} className="global-card-tile" onClick={() => setFlippedCards(prev => ({...prev, [card.id]: !prev[card.id]}))}>
          <div className={`global-card-inner ${flippedCards[card.id] ? 'flipped' : ''}`}>
          <div className="global-card-front" style={{ backgroundColor: card.frontBg || '#ffffff' }}>
            <div className="global-card-scaled">
              <div className="global-card-content" dangerouslySetInnerHTML={{ __html: card.front || '<p>Empty</p>' }} />
            </div>
            <div className="global-card-folder-info">
              {card.folder_title} • {card.folder_owner}
            </div>
          </div>
          <div className="global-card-back" style={{ backgroundColor: card.backBg || '#ffffff' }}>
            <div className="global-card-scaled">
              <div className="global-card-content" dangerouslySetInnerHTML={{ __html: card.back || '<p>Empty</p>' }} />
            </div>
          </div>
          </div>
                  <button className="global-card-add-btn" onClick={(e) => { e.stopPropagation(); setSelectedCard(card); setShowAddToFolderModal(true) }} title={t('btn_add_to_folder')}>
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
      </main>

      {showAuthModal && (
        <div className="modal" onClick={() => setShowAuthModal(false)}>
          <div className="auth-box" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAuthModal(false)}><X size={20} /></button>
            
            {authView === 'login' ? (
              <form onSubmit={handleLogin}>
                <h2 className="auth-title">{t('login_title')}</h2>
                {message.text && <div className={`auth-message ${message.type}`}>{message.text}</div>}
                <input className="input-field mb-1" placeholder={t('placeholder_login_id')} value={loginData.id} onChange={e => setLoginData({...loginData, id: e.target.value})} required />
                <input type="password" className="input-field mb-1" placeholder={t('placeholder_password')} value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
                <button type="submit" className="primary-btn w-full">{t('btn_login')}</button>
                <p className="switch-auth-text">{t('switch_to_signup_text')} <span className="text-link" onClick={() => setAuthView('signup')}>{t('switch_to_signup_link')}</span></p>
              </form>
            ) : (
              <form onSubmit={handleSignup}>
                <h2 className="auth-title">{t('signup_title')}</h2>
                {message.text && <div className={`auth-message ${message.type}`}>{message.text}</div>}
                <input className="input-field mb-1" placeholder={t('placeholder_username')} value={signupData.username} onChange={e => setSignupData({...signupData, username: e.target.value})} required />
                <div className="input-with-btn mb-1">
                  <input type="email" className="input-field" placeholder={t('placeholder_email')} value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} required />
                  <button type="button" className="secondary-btn shadow-btn">{t('btn_send_code')}</button>
                </div>
                <input className="input-field mb-1" placeholder={t('placeholder_verify_code')} value={signupData.code} onChange={e => setSignupData({...signupData, code: e.target.value})} required />
                <input type="password" className="input-field mb-1" placeholder={t('placeholder_password')} value={signupData.password} onChange={e => setSignupData({...signupData, password: e.target.value})} required />
                <button type="submit" className="primary-btn w-full">{t('btn_signup')}</button>
                <p className="switch-auth-text">{t('switch_to_login_text')} <span className="text-link" onClick={() => setAuthView('login')}>{t('switch_to_login_link')}</span></p>
              </form>
            )}
          </div>
        </div>
      )}

       {showSettingsModal && editingFolder && (
         <div className="modal" onClick={() => setShowSettingsModal(false)}>
           <div className="auth-box" onClick={e => e.stopPropagation()}>
             <button className="close-btn" onClick={() => setShowSettingsModal(false)}><X size={20} /></button>
             <h2 className="auth-title">{t('folder_settings_title')}</h2>
             <div className="mb-1">
               <label style={{fontSize: '14px', fontWeight: 'bold'}}>{t('label_folder_name')}</label>
               <input className="input-field mt-1" value={editingFolder.title} onChange={e => setEditingFolder({...editingFolder, title: e.target.value})} />
             </div>
             <div className="mb-1">
               <label style={{fontSize: '14px', fontWeight: 'bold'}}>{t('label_visibility')}</label>
               <select className="input-field mt-1" value={editingFolder.visibility} onChange={e => setEditingFolder({...editingFolder, visibility: e.target.value})}>
                 <option value="private">{t('visibility_private')}</option>
                 <option value="public">{t('visibility_public')}</option>
                 <option value="shared" disabled>{t('visibility_shared')}</option>
               </select>
             </div>
             <div style={{display:'flex', gap:'10px', marginTop:'20px', flexDirection: 'column'}}>
               <div style={{display:'flex', gap:'10px'}}>
                 <button className="primary-btn" style={{flex:2}} onClick={saveFolderSettings}>{t('btn_save')}</button>
                 <button className="secondary-btn" style={{flex:1, backgroundColor:'#fee2e2', color:'#dc2626', border:'none'}} onClick={deleteFolder}>{t('btn_delete')}</button>
               </div>
               <div style={{display:'flex', gap:'10px'}}>
                 <button className="secondary-btn" style={{flex:1}} onClick={exportFolder}>Export JSON</button>
                 <button className="secondary-btn" style={{flex:1}} onClick={importFolder}>Import JSON</button>
               </div>
             </div>
           </div>
         </div>
       )}
        {showSearchModal && (
          <GlobalSearchModal 
            isOpen={showSearchModal} 
            onClose={() => setShowSearchModal(false)} 
            userEmail={user?.email || user?.id}
            onSelectCard={(res) => {
               setShowSearchModal(false);
               navigate(`/editor/${res.folder_id}`);
            }}
          />
        )}

        {showAddToFolderModal && selectedCard && (
          <AddToFolderModal
            card={selectedCard}
            userEmail={user?.email || user?.id}
            onClose={() => { setShowAddToFolderModal(false); setSelectedCard(null) }}
            onSuccess={(msg) => { setShowAddToFolderModal(false); setSelectedCard(null); showAlert(msg) }}
          />
        )}
        <Modal state={modalState} onClose={closeModal} onConfirm={handleConfirm} onSubmit={handlePromptSubmit} />
      </div>
    )
  }

function ChangePasswordPage() {
  return <div className="page-container"><h1>Change Password</h1><p>Coming soon...</p></div>
}