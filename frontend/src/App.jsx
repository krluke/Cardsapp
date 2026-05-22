import { useState, useEffect, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
import { X, FolderPlus, Palette, Globe, User, LogOut, LogIn, Settings, Trash2, Search, ChevronLeft, ChevronRight, BookOpen, Plus } from 'lucide-react'
import { useAuth, useClerk } from '@clerk/clerk-react'
import AccountPage from './pages/AccountPage'
import EditorPage from './pages/EditorPage'
import ViewerPage from './pages/ViewerPage'
import StudyPage from './pages/study/StudyPage'
import { GlobalSearchModal } from './components/GlobalSearchModal'
import { AddToFolderModal } from './components/AddToFolderModal'
import { useModal, Modal } from './components/Modal'
import { apiFetch, API_BASE } from './lib/api'
import './i18n'

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
       <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
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
  const [totalCards, setTotalCards] = useState(0)
  const { modalState, showAlert, showConfirm, showPrompt, closeModal, handleConfirm, handlePromptSubmit } = useModal()

  const { isSignedIn, getToken } = useAuth()
  const clerk = useClerk()
  const exchangingRef = useRef(false)
  const exchangeFailCount = useRef(0)

  const loadFolders = useCallback(async () => {
    if (activeTab === 'my-folders' && !user) {
      setFolders([])
      return
    }
    const endpoint = '/folders'
    const params = new URLSearchParams({
      page,
      q: searchInput,
      tab: activeTab,
    })
    try {
      const res = await apiFetch(`${endpoint}?${params}`)
      const data = await res.json()
      if (data.folders !== undefined) {
        setFolders(data.folders || [])
        setTotalPages(data.totalPages || 1)
      } else if (data.message) {
        console.error('loadFolders error:', data.message)
      }
    } catch (e) {
      if (activeTab === 'my-folders' || activeTab === 'global-folders') {
        console.warn('loadFolders failed, will retry in 15s:', e?.message)
      }
    }
  }, [activeTab, page, searchInput, user])

  const loadTotalCards = useCallback(async () => {
    if (!user) return
    try {
      const res = await apiFetch('/folders?tab=my-folders')
      const data = await res.json()
      if (data.folders) {
        setTotalCards(data.folders.reduce((sum, f) => sum + (f.card_count || 0), 0))
      }
    } catch (e) { /* expected on transient failure */ }
  }, [user])

  const loadGlobalCards = useCallback(async () => {
    const params = new URLSearchParams({
      page,
      search: searchInput,
    })
    try {
      const res = await apiFetch(`/cards/public?${params}`)
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
  }, [page, searchInput])

  const exchangeClerkToken = useCallback(async () => {
    if (exchangingRef.current) return
    exchangingRef.current = true
    try {
      const clerkToken = await getToken()
      if (!clerkToken) return
      const res = await fetch(`${API_BASE}/clerk-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerk_token: clerkToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Clerk auth failed:', data.message)
        exchangeFailCount.current += 1
        return
      }
      exchangeFailCount.current = 0
      const session = {
        user: { id: data.email, username: data.username, email: data.email, clerkUserId: data.clerkUserId },
        csrfToken: data.csrfToken,
        token: data.token,
      }
      localStorage.setItem('session', JSON.stringify(session))
      setUser(session.user)
      loadFolders()
      loadTotalCards()
    } catch (err) {
      console.warn('Clerk token exchange error:', err?.message || err)
      exchangeFailCount.current += 1
    } finally {
      exchangingRef.current = false
    }
  }, [getToken, loadFolders])

  useEffect(() => {
    if (isSignedIn && !user && exchangeFailCount.current < 3) {
      exchangeClerkToken()
    }
  }, [isSignedIn, user, exchangeClerkToken])

  useEffect(() => {
    if (!clerk.addListener) return
    const unsubscribe = clerk.addListener(({ event }) => {
      if (event === 'signedOut') {
        localStorage.removeItem('session')
        setUser(null)
        setFolders([])
        setGlobalCards([])
        setActiveTab('my-folders')
      }
    })
    return unsubscribe
  }, [clerk])

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light'
    const savedLang = localStorage.getItem('app-lang') || 'ja'
    setTheme(savedTheme)
    setLang(savedLang)
    document.documentElement.setAttribute('data-theme', savedTheme)

    const session = JSON.parse(localStorage.getItem('session') || '{}')
    if (session.user) {
      setUser(session.user)
      loadTotalCards()
    }
  }, [loadTotalCards])

  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  useEffect(() => {
    const handleFocus = () => {
      loadFolders()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadFolders])

  useEffect(() => {
    if (activeTab === 'global-cards') {
      loadGlobalCards()
    }
  }, [activeTab, loadGlobalCards])

  const handleLogout = () => {
    localStorage.removeItem('session')
    setUser(null)
    setFolders([])
    setGlobalCards([])
    setActiveTab('my-folders')
    setAuthMenuOpen(false)
    if (clerk.signOut) {
      clerk.signOut({ redirectUrl: window.location.origin + '/home' })
    }
  }

  const createNewFolder = async () => {
    const title = await showPrompt('Untitled', t('placeholder_folder_name'))
    if (!title || !user) return

    try {
      const res = await apiFetch('/folders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
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
    } catch { showAlert(t('error_create_folder')) }
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
      const res = await apiFetch('/folders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: editingFolder.id,
          title: editingFolder.title,
          visibility: editingFolder.visibility,
        }),
      })
      if (res.ok) {
        setShowSettingsModal(false)
        loadFolders()
      }
    } catch { showAlert(t('error_save')) }
  }

  const exportFolder = async () => {
    if (!editingFolder || !user) return
    try {
      const res = await apiFetch(`/folders/export?folderId=${editingFolder.id}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editingFolder.title}.json`;
      a.click();
    } catch { showAlert(t('error_export')) }
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
      const res = await apiFetch('/folders/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderData }),
      });
          if (res.ok) {
            showAlert(t('success_import'))
            loadFolders();
          }
        } catch { showAlert(t('error_import')) }
      };
      reader.readAsText(file);
    };
    input.click();
  }

const deleteFolder = async () => {
const confirmed = await showConfirm(t('confirm_delete_folder'), t('confirm_delete_folder'))
if (!confirmed || !editingFolder || !user) return
try {
      const res = await apiFetch('/folders/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId: editingFolder.id }),
      })
      if (res.ok) {
        setShowSettingsModal(false)
        loadFolders()
      }
    } catch { showAlert(t('error_delete')) }
  }

  return (
    <div className="min-h-screen home-page-shell">
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
                  <button className="dropdown-item" onClick={() => { if (!isSignedIn) { clerk.openSignIn() } else { exchangeClerkToken() }; setAuthMenuOpen(false) }}>
                    <LogIn size={18} /> {!isSignedIn ? t('menu_login') : t('guest_login_btn')}
                  </button>
                ) : (
                  <>
                    <div className="menu-header">
                      <span style={{fontWeight:'bold'}}>{user.username}</span>
                      <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{totalCards} cards</span>
                    </div>
                    <button className="dropdown-item" onClick={() => { navigate('/account'); setAuthMenuOpen(false) }}><User size={18} /> Manage Account</button>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout-btn" onClick={handleLogout}><LogOut size={18} /> {t('menu_logout')}</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="page-container home-page-main">
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
            <button className="primary-btn" onClick={() => { if (!isSignedIn) { clerk.openSignIn() } else { exchangeClerkToken() } }}>{t('guest_login_btn')}</button>
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

      <footer className="home-page-footer">
        © 2024-2025 Cardsapp. All rights reserved.
      </footer>




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
      onSelectCard={(res) => {
        setShowSearchModal(false);
        navigate(`/editor/${res.folder_id}`);
      }}
    />
        )}

        {showAddToFolderModal && selectedCard && (
    <AddToFolderModal
      card={selectedCard}
      onClose={() => { setShowAddToFolderModal(false); setSelectedCard(null) }}
      onSuccess={(msg) => { setShowAddToFolderModal(false); setSelectedCard(null); showAlert(msg) }}
    />
        )}
        <Modal state={modalState} onClose={closeModal} onConfirm={handleConfirm} onSubmit={handlePromptSubmit} />
      </div>
    )
  }

function PrivacyPolicyPage() {
  return (
    <div className="page-container policy-page">
      <h1>Privacy Policy (Personal Information Protection Policy)</h1>
      <p>This page explains how Cardsapp handles personal information.</p>

      <h2>1. Information We Collect</h2>
      <p>We may collect account information such as username, email address, and usage data needed to operate the service.</p>

      <h2>2. Purpose of Use</h2>
      <p>Collected information is used for authentication, card and folder management, security, and service improvement.</p>

      <h2>3. Data Protection</h2>
      <p>We apply reasonable technical and organizational safeguards to protect personal information.</p>

      <h2>4. Contact</h2>
      <p>For questions about this policy, please contact the service administrator.</p>

      <Link className="secondary-btn policy-back-btn" to="/home">Back to Home</Link>
    </div>
  )
}

function TermsOfServicePage() {
  return (
    <div className="page-container policy-page">
      <h1>Terms of Service</h1>
      <p>By using Cardsapp, you agree to these terms.</p>

      <h2>1. Account Responsibility</h2>
      <p>You are responsible for your account credentials and all activity under your account.</p>

      <h2>2. Acceptable Use</h2>
      <p>You must not misuse the service, attempt unauthorized access, or upload harmful or unlawful content.</p>

      <h2>3. Content</h2>
      <p>You retain ownership of your content and are responsible for what you create, store, and share.</p>

      <h2>4. Service Changes</h2>
      <p>We may modify features or availability as needed for quality, security, and maintenance.</p>

      <Link className="secondary-btn policy-back-btn" to="/home">Back to Home</Link>
    </div>
  )
}
