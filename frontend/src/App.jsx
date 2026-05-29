import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { X, FolderPlus, Palette, Globe, User, LogOut, LogIn, Settings, Trash2, Search, ChevronLeft, ChevronRight, BookOpen, Plus, Bookmark } from 'lucide-react'
import { ClerkProvider, useAuth, useClerk } from '@clerk/clerk-react'

import AccountPage from './pages/AccountPage'
import EditorPage from './pages/EditorPage'
import ViewerPage from './pages/ViewerPage'
import StudyPage from './pages/study/StudyPage'
import { GlobalSearchModal } from './components/GlobalSearchModal'
import { AddToFolderModal } from './components/AddToFolderModal'
import { CardPreview } from './components/CardPreview'
import { useModal, Modal } from './components/Modal'
import { apiFetch, API_BASE, ApiError } from './lib/api'
import './App.css'

const CLERK_THEMES = {
  light: {
    bgCanvas: '#F4F0EB', bgSurface: '#FFFFFF', bgSurfaceHover: '#FAF8F5',
    textMain: '#3D3935', textMuted: '#8A847C', borderColor: '#E2DCD0',
    accentColor: '#D97757', accentHover: '#C06040', accentLight: 'rgba(217,119,87,0.1)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(61,57,53,0.08)',
  },
  dark: {
    bgCanvas: '#1E1B18', bgSurface: '#2D2A26', bgSurfaceHover: '#383430',
    textMain: '#EAE6DF', textMuted: '#9E9891', borderColor: '#4A453F',
    accentColor: '#D97757', accentHover: '#C06040', accentLight: 'rgba(217,119,87,0.15)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(0,0,0,0.3)',
  },
  blue: {
    bgCanvas: '#0D1B3E', bgSurface: '#223768', bgSurfaceHover: '#324063',
    textMain: '#c7cbdd', textMuted: '#b1b8c9', borderColor: '#65779c',
    accentColor: '#D94F6E', accentHover: '#BF3A58', accentLight: 'rgba(217,79,110,0.15)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(0,0,0,0.3)',
  },
  sakura: {
    bgCanvas: '#FFF5F6', bgSurface: '#FFFFFF', bgSurfaceHover: '#FFF0F2',
    textMain: '#4A3B3F', textMuted: '#8A7579', borderColor: '#F0D5D8',
    accentColor: '#D4727A', accentHover: '#B85C64', accentLight: 'rgba(212,114,122,0.1)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(74,59,63,0.08)',
  },
  forest: {
    bgCanvas: '#F4F1EB', bgSurface: '#FFFFFF', bgSurfaceHover: '#F0EDE6',
    textMain: '#2D3A2E', textMuted: '#6E7D6F', borderColor: '#D5DFD0',
    accentColor: '#2D6A4F', accentHover: '#1B4332', accentLight: 'rgba(45,106,79,0.1)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(45,58,46,0.08)',
  },
  autumn: {
    bgCanvas: '#FBF5EE', bgSurface: '#FFFFFF', bgSurfaceHover: '#F7EDE0',
    textMain: '#3D3225', textMuted: '#8A7A65', borderColor: '#E8DBC5',
    accentColor: '#B45309', accentHover: '#92400E', accentLight: 'rgba(180,83,9,0.1)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(61,50,37,0.08)',
  },
  nord: {
    bgCanvas: '#F0F3F8', bgSurface: '#FFFFFF', bgSurfaceHover: '#E8ECF4',
    textMain: '#3B4252', textMuted: '#7B8394', borderColor: '#D8DEE9',
    accentColor: '#5E81AC', accentHover: '#4C6B91', accentLight: 'rgba(94,129,172,0.1)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(59,66,82,0.08)',
  },
  lavender: {
    bgCanvas: '#F6F3FB', bgSurface: '#FFFFFF', bgSurfaceHover: '#F0EBFA',
    textMain: '#3B3450', textMuted: '#7E7599', borderColor: '#DDD6F3',
    accentColor: '#7C3AED', accentHover: '#6D28D9', accentLight: 'rgba(124,58,237,0.1)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(59,52,80,0.08)',
  },
  matcha: {
    bgCanvas: '#F2EFE6', bgSurface: '#FFFFFF', bgSurfaceHover: '#EDE9DE',
    textMain: '#3D3D2E', textMuted: '#7A7A66', borderColor: '#D8D5C4',
    accentColor: '#7C8B6A', accentHover: '#5F6D4F', accentLight: 'rgba(124,139,106,0.1)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(61,61,46,0.08)',
  },
  sunset: {
    bgCanvas: '#FFF7ED', bgSurface: '#FFFFFF', bgSurfaceHover: '#FFF0DB',
    textMain: '#3D2E1E', textMuted: '#8A7A65', borderColor: '#F0DCC5',
    accentColor: '#E8722A', accentHover: '#C25A16', accentLight: 'rgba(232,114,42,0.1)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(61,46,30,0.08)',
  },
  monochrome: {
    bgCanvas: '#F5F5F5', bgSurface: '#FFFFFF', bgSurfaceHover: '#EDEDED',
    textMain: '#1A1A1A', textMuted: '#6B6B6B', borderColor: '#D4D4D4',
    accentColor: '#6B7280', accentHover: '#4B5563', accentLight: 'rgba(107,114,128,0.1)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(26,26,26,0.08)',
  },
  ocean: {
    bgCanvas: '#0A1929', bgSurface: '#132F4C', bgSurfaceHover: '#1A3A5C',
    textMain: '#C9D8EC', textMuted: '#8BA3C4', borderColor: '#2E4A6B',
    accentColor: '#06B6D4', accentHover: '#0891B2', accentLight: 'rgba(6,182,212,0.15)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(0,0,0,0.3)',
  },
  cyberpunk: {
    bgCanvas: '#0D0D1A', bgSurface: '#1A1A2E', bgSurfaceHover: '#252540',
    textMain: '#E0E0FF', textMuted: '#9898CC', borderColor: '#3A3A5C',
    accentColor: '#FF00FF', accentHover: '#CC00CC', accentLight: 'rgba(255,0,255,0.15)',
    dangerColor: '#FF4444', dangerHover: '#CC3333',
    shadowMd: '0 8px 24px rgba(0,0,0,0.4)',
  },
  'wabi-sabi': {
    bgCanvas: '#E8E2D8', bgSurface: '#DFD8CB', bgSurfaceHover: '#D5CEBF',
    textMain: '#3E3830', textMuted: '#7D756A', borderColor: '#C8C0B2',
    accentColor: '#A8966A', accentHover: '#8E7D56', accentLight: 'rgba(168,150,106,0.12)',
    dangerColor: '#B85C5C', dangerHover: '#A04848',
    shadowMd: '0 8px 24px rgba(62,56,48,0.1)',
  },
  eclipse: {
    bgCanvas: '#2A1520', bgSurface: '#3D2232', bgSurfaceHover: '#4D2E40',
    textMain: '#F0D5DA', textMuted: '#B08890', borderColor: '#5A3348',
    accentColor: '#D4727A', accentHover: '#B85C64', accentLight: 'rgba(212,114,122,0.15)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(0,0,0,0.35)',
  },
  midnight: {
    bgCanvas: '#0D1A12', bgSurface: '#162B1E', bgSurfaceHover: '#1E3A28',
    textMain: '#C5D8C0', textMuted: '#7FA878', borderColor: '#2E4A38',
    accentColor: '#40916C', accentHover: '#2D6A4F', accentLight: 'rgba(64,145,108,0.15)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(0,0,0,0.35)',
  },
  shadow: {
    bgCanvas: '#1A1208', bgSurface: '#2C2010', bgSurfaceHover: '#3A2C18',
    textMain: '#E8D5BC', textMuted: '#A89070', borderColor: '#4A3A28',
    accentColor: '#D97706', accentHover: '#B45309', accentLight: 'rgba(217,119,6,0.15)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(0,0,0,0.35)',
  },
  polar: {
    bgCanvas: '#181D28', bgSurface: '#222A3A', bgSurfaceHover: '#2A3448',
    textMain: '#C8D0E0', textMuted: '#8898B0', borderColor: '#3A4458',
    accentColor: '#81A1C1', accentHover: '#5E81AC', accentLight: 'rgba(129,161,193,0.15)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(0,0,0,0.35)',
  },
  amethyst: {
    bgCanvas: '#1A1228', bgSurface: '#261E3A', bgSurfaceHover: '#302848',
    textMain: '#D8CCF0', textMuted: '#9888C0', borderColor: '#3E3458',
    accentColor: '#A78BFA', accentHover: '#7C3AED', accentLight: 'rgba(167,139,250,0.15)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(0,0,0,0.35)',
  },
  moss: {
    bgCanvas: '#161610', bgSurface: '#222218', bgSurfaceHover: '#2C2C22',
    textMain: '#D0D0B8', textMuted: '#908870', borderColor: '#3A3A2E',
    accentColor: '#8FA87C', accentHover: '#7C8B6A', accentLight: 'rgba(143,168,124,0.15)',
    dangerColor: '#E05252', dangerHover: '#C93E3E',
    shadowMd: '0 8px 24px rgba(0,0,0,0.35)',
  },
}

const FONT_FAMILY = '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif'

function buildClerkAppearance(theme) {
  const c = CLERK_THEMES[theme] || CLERK_THEMES.light
  return {
    variables: {
      colorPrimary: c.accentColor,
      colorPrimaryHover: c.accentHover,
      colorPrimaryActive: c.accentHover,
      colorPrimaryOnBackground: c.accentColor,
      colorBackground: c.bgSurface,
      colorBackgroundHover: c.bgSurfaceHover,
      colorInputBackground: c.bgSurface,
      colorInputText: c.textMain,
      colorText: c.textMain,
      colorTextSecondary: c.textMuted,
      colorTextOnPrimary: '#FFFFFF',
      colorBorder: c.borderColor,
      colorDanger: c.dangerColor,
      colorDangerHover: c.dangerHover,
      colorSuccess: '#10b981',
      borderRadius: '12px',
      borderRadiussm: '6px',
      borderRadiuslg: '24px',
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
    },
    elements: {
      card: {
        boxShadow: c.shadowMd,
        border: `1px solid ${c.borderColor}`,
      },
      modalBackdrop: {
        backgroundColor: 'rgba(0,0,0,0.6)',
      },
      modalContent: {
        boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
      },
      rootBox: {
        boxShadow: c.shadowMd,
      },
      formButtonPrimary: {
        backgroundColor: c.accentColor,
        color: '#FFFFFF',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'background-color 0.2s',
        '&:hover': {
          backgroundColor: c.accentHover,
        },
        '&:active': {
          backgroundColor: c.accentHover,
        },
      },
      formButtonSecondary: {
        backgroundColor: c.bgSurfaceHover,
        color: c.textMain,
        borderRadius: '12px',
        border: `1px solid ${c.borderColor}`,
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s',
        '&:hover': {
          backgroundColor: c.borderColor,
        },
      },
      formFieldInput: {
        backgroundColor: c.bgSurface,
        color: c.textMain,
        borderRadius: '6px',
        border: `1px solid ${c.borderColor}`,
        fontSize: '14px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:focus': {
          borderColor: c.accentColor,
          boxShadow: `0 0 0 3px ${c.accentLight}`,
        },
      },
      formFieldLabel: {
        color: c.textMain,
        fontSize: '13px',
        fontWeight: '600',
      },
      formFieldHintText: {
        color: c.textMuted,
        fontSize: '12px',
      },
      formHeaderTitle: {
        color: c.textMain,
        fontSize: '20px',
        fontWeight: '700',
      },
      formHeaderSubtitle: {
        color: c.textMuted,
        fontSize: '14px',
      },
      socialButtonsBlockButton: {
        backgroundColor: c.bgSurfaceHover,
        color: c.textMain,
        borderRadius: '12px',
        border: `1px solid ${c.borderColor}`,
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s',
        '&:hover': {
          backgroundColor: c.borderColor,
        },
      },
      socialButtonsBlockButtonText: {
        color: c.textMain,
      },
      dividerLine: {
        backgroundColor: c.borderColor,
      },
      dividerText: {
        color: c.textMuted,
        fontSize: '13px',
      },
      alertText: {
        fontSize: '13px',
      },
      navbar: {
        backgroundColor: c.bgSurface,
        borderBottom: `1px solid ${c.borderColor}`,
      },
      navbarButton: {
        color: c.textMuted,
        '&:hover': {
          color: c.textMain,
        },
      },
      userButtonAvatarBox: {
        border: `2px solid ${c.accentColor}`,
      },
      userButtonPopoverCard: {
        boxShadow: c.shadowMd,
        border: `1px solid ${c.borderColor}`,
      },
      userProfileCard: {
        border: `1px solid ${c.borderColor}`,
        boxShadow: c.shadowMd,
      },
      pages: {
        theme: {
          backgroundColor: c.bgCanvas,
        },
      },
    },
  }
}

function t(key) {
  const lang = localStorage.getItem('app-lang') || 'ja'
  const translations = {
    ja: {
      btn_create_folder: "新規作成",
    theme_sand: "サンド＆クリーム",
    theme_dark: "ダークモード",
    theme_blue: "青",
    theme_sakura: "桜",
    theme_forest: "森",
    theme_autumn: "秋",
    theme_nord: "ノード",
    theme_lavender: "ラベンダー",
    theme_matcha: "抹茶",
    theme_sunset: "夕焼け",
    theme_monochrome: "モノクローム",
    theme_ocean: "オーシャン",
    theme_cyberpunk: "サイバーパンク",
    theme_wabi_sabi: "侘寂",
    theme_eclipse: "エクリプス",
    theme_midnight: "ミッドナイト",
    theme_shadow: "シャドウ",
    theme_polar: "ポーラー",
    theme_amethyst: "アメジスト",
    theme_moss: "モス",
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
    theme_sakura: "Sakura",
    theme_forest: "Forest",
    theme_autumn: "Autumn",
    theme_nord: "Nord",
    theme_lavender: "Lavender",
    theme_matcha: "Matcha",
    theme_sunset: "Sunset",
    theme_monochrome: "Monochrome",
    theme_ocean: "Ocean",
    theme_cyberpunk: "Cyberpunk",
    theme_wabi_sabi: "Wabi-Sabi",
    theme_eclipse: "Eclipse",
    theme_midnight: "Midnight",
    theme_shadow: "Shadow",
    theme_polar: "Polar",
    theme_amethyst: "Amethyst",
    theme_moss: "Moss",
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

export default function App({ clerkAvailable }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'light')
  const clerkKey = clerkAvailable ? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY : null
  const clerkAppearance = useMemo(() => buildClerkAppearance(theme), [theme])

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.theme) {
        setTheme(e.detail.theme)
      }
    }
    window.addEventListener('theme-changed', handler)
    return () => window.removeEventListener('theme-changed', handler)
  }, [])

  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={clerkAvailable ? <ClerkHomePage /> : <HomePage clerkAvailable={false} />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      <Route path="/editor/:folderId" element={<EditorPage />} />
      <Route path="/viewer/:folderId" element={<ViewerPage />} />
      <Route path="/study/:folderId" element={<StudyPage />} />
    </Routes>
  )

  return (
    <BrowserRouter>
      {clerkAvailable && clerkKey ? (
        <ClerkProvider publishableKey={clerkKey} afterSignOutUrl="/" appearance={clerkAppearance}>
          {routes}
        </ClerkProvider>
      ) : (
        routes
      )}
    </BrowserRouter>
  )
}

function ClerkHomePage() {
  const { isSignedIn, getToken } = useAuth()
  const clerk = useClerk()
  return <HomePage clerkAvailable={true} isSignedIn={isSignedIn} getToken={getToken} clerk={clerk} />
}

function HomePage({ clerkAvailable, isSignedIn: isSignedInProp, getToken: getTokenProp, clerk: clerkProp }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState(() => {
    const session = JSON.parse(localStorage.getItem('session') || '{}')
    return session.user || null
  })
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab')
    return tab === 'global-folders' || tab === 'global-cards' ? tab : 'my-folders'
  })
  const [folders, setFolders] = useState([])
  const [globalCards, setGlobalCards] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'global-folders' || tab === 'global-cards') {
      requestAnimationFrame(() => {
        setActiveTab(tab)
        setPage(1)
      })
    }
  }, [searchParams])
  const [totalPages, setTotalPages] = useState(1)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [authMenuOpen, setAuthMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'light')
  const [lang, setLang] = useState(() => localStorage.getItem('app-lang') || 'ja')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showAddToFolderModal, setShowAddToFolderModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [flippedCards, setFlippedCards] = useState({})
  const [userLoading, setUserLoading] = useState(false)
  const [logoFlipped, setLogoFlipped] = useState(false)
  const { modalState, showAlert, showConfirm, showPrompt, closeModal, handleConfirm, handlePromptSubmit } = useModal()

  const isSignedIn = clerkAvailable ? isSignedInProp : false
  const getToken = useMemo(() => clerkAvailable ? getTokenProp : async () => null, [clerkAvailable, getTokenProp])
  const clerk = useMemo(() => clerkAvailable ? clerkProp : {}, [clerkAvailable, clerkProp])
  const exchangingRef = useRef(false)
  const exchangeFailCount = useRef(0)
  const sessionExpiredRef = useRef(false)
  const foldersLoadingRef = useRef(false)
  const foldersRetryAfterRef = useRef(0)

  const loadFolders = useCallback(async () => {
    if (sessionExpiredRef.current) return
    if (userLoading) return
    if (foldersLoadingRef.current) return
    if (Date.now() < foldersRetryAfterRef.current) return
    foldersLoadingRef.current = true
    if (activeTab === 'my-folders' && !user) {
      setFolders([])
      foldersLoadingRef.current = false
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
      console.error(e)
      if (e instanceof ApiError && e.status === 429) {
        foldersRetryAfterRef.current = Date.now() + 30000
      }
    } finally {
      foldersLoadingRef.current = false
    }
  }, [activeTab, page, searchInput, user, userLoading])

  const toggleFavorite = async (folderId) => {
    if (!user) return
    setFolders(prev => {
      const updated = prev.map(f =>
        f.id === folderId ? { ...f, is_favorite: !f.is_favorite } : f
      )
      return updated.sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0) || b.id - a.id)
    })
    try {
      await apiFetch('/folders/toggle-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, action: 'favorite' }),
      })
    } catch (e) {
      console.error(e)
      setFolders(prev => {
        const reverted = prev.map(f =>
          f.id === folderId ? { ...f, is_favorite: !f.is_favorite } : f
        )
        return reverted.sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0) || b.id - a.id)
      })
    }
  }

  const globalCardsLoadingRef = useRef(false)
  const globalCardsRetryAfterRef = useRef(0)

  const loadGlobalCards = useCallback(async () => {
    if (sessionExpiredRef.current) return
    if (globalCardsLoadingRef.current) return
    if (Date.now() < globalCardsRetryAfterRef.current) return
    globalCardsLoadingRef.current = true
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
    } catch (e) {
      console.error(e)
      if (e instanceof ApiError && e.status === 429) {
        globalCardsRetryAfterRef.current = Date.now() + 30000
      }
    } finally {
      globalCardsLoadingRef.current = false
    }
  }, [page, searchInput])

  const exchangeClerkToken = useCallback(async () => {
    if (exchangingRef.current) return
    exchangingRef.current = true
    setUserLoading(true)
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
      sessionExpiredRef.current = false
      const session = {
        user: { id: data.email, username: data.username, email: data.email, clerkUserId: data.clerkUserId },
        csrfToken: data.csrfToken,
        token: data.token,
      }
      localStorage.setItem('session', JSON.stringify(session))
      setUser(session.user)
    } catch (err) {
      console.warn('Clerk token exchange error:', err?.message || err)
      exchangeFailCount.current += 1
    } finally {
      exchangingRef.current = false
      setUserLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    if (isSignedIn && !user && !userLoading && exchangeFailCount.current < 3) {
      exchangeClerkToken()
    }
    if (!isSignedIn) {
      exchangeFailCount.current = 0
    }
  }, [isSignedIn, user, userLoading, exchangeClerkToken])

  useEffect(() => {
    if (typeof clerk?.addListener !== 'function') return
    const unsubscribe = clerk.addListener(({ event }) => {
      if (event === 'signedOut') {
        localStorage.removeItem('session')
        setUser(null)
        setFolders([])
        setGlobalCards([])
        setActiveTab('my-folders')
        sessionExpiredRef.current = false
        exchangeFailCount.current = 0
      }
    })
    return () => { if (typeof unsubscribe === 'function') unsubscribe() }
  }, [clerk])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', localStorage.getItem('app-theme') || 'light')
  }, [])

  useEffect(() => {
    const handleSessionExpired = async () => {
      if (sessionExpiredRef.current) return
      sessionExpiredRef.current = true
      if (isSignedIn && exchangeFailCount.current < 3) {
        exchangeFailCount.current = 0
        await exchangeClerkToken()
        if (!sessionExpiredRef.current) return
      }
      setUser(null)
      setFolders([])
      setGlobalCards([])
      setActiveTab('my-folders')
    }
    window.addEventListener('session-expired', handleSessionExpired)
    return () => window.removeEventListener('session-expired', handleSessionExpired)
  }, [isSignedIn, exchangeClerkToken])

  useEffect(() => {
    if (!userLoading) requestAnimationFrame(() => loadFolders())
  }, [loadFolders, userLoading])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) loadFolders()
    }, 30000)
    return () => clearInterval(interval)
  }, [loadFolders])

  useEffect(() => {
    const handleFocus = () => {
      if (!document.hidden) loadFolders()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadFolders])

  useEffect(() => {
    if (activeTab === 'global-cards') requestAnimationFrame(() => loadGlobalCards())
  }, [activeTab, loadGlobalCards])

  const handleLogout = () => {
    localStorage.removeItem('session')
    setUser(null)
    setFolders([])
    setGlobalCards([])
    setActiveTab('my-folders')
    setAuthMenuOpen(false)
    if (clerkAvailable && typeof clerk.signOut === 'function') {
      clerk.signOut({ redirectUrl: window.location.origin + '/home' })
    }
  }

  const createNewFolder = async () => {
    const title = await showPrompt('Untitled', t('placeholder_folder_name'))
    if (!title || !user) return

    try {
      await apiFetch('/folders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })
      loadFolders()
    } catch (e) {
      if (e instanceof ApiError && (e.message?.includes('同じ名前') || e.message?.includes('already exists'))) {
        showAlert(t('error_folder_exists'))
      } else {
        showAlert(t('error_create_folder'))
      }
    }
  }

  const selectTheme = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('app-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: newTheme } }))
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
      await apiFetch('/folders/update', {
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
      setShowSettingsModal(false)
      loadFolders()
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
          await apiFetch('/folders/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ folderData }),
          });
          showAlert(t('success_import'))
          loadFolders();
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
      await apiFetch('/folders/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId: editingFolder.id }),
      })
      setShowSettingsModal(false)
      loadFolders()
    } catch { showAlert(t('error_delete')) }
  }

  return (
    <div className="min-h-screen home-page-shell">
      <header className="navbar">
        <div
          className={`logo${logoFlipped ? ' flipped' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="CardsApp"
          onClick={() => setLogoFlipped(f => !f)}
          onMouseLeave={() => setLogoFlipped(false)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLogoFlipped(f => !f) } }}
        >
          <div className="logo-scene">
            <div className="logo-flipper">
              <div className="logo-sizer" aria-hidden="true">
                <span>Cards</span>
                <span>カード</span>
              </div>
              <div className="logo-face logo-face-front">
                <span className="logo-word">Cards</span>
              </div>
              <div className="logo-face logo-face-back">
                <span className="logo-word">カード</span>
              </div>
            </div>
          </div>
          <span className="logo-app">App</span>
        </div>
        
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
            <button className={`theme-option ${theme === 'sakura' ? 'active' : ''}`} onClick={() => selectTheme('sakura')}>
              <span className="theme-dots"><span style={{background:'#FFF5F6'}}></span><span style={{background:'#D4727A'}}></span><span style={{background:'#FFF0F2'}}></span></span>
              <span>{t('theme_sakura')}</span>
            </button>
            <button className={`theme-option ${theme === 'forest' ? 'active' : ''}`} onClick={() => selectTheme('forest')}>
              <span className="theme-dots"><span style={{background:'#F4F1EB'}}></span><span style={{background:'#2D6A4F'}}></span><span style={{background:'#D5DFD0'}}></span></span>
              <span>{t('theme_forest')}</span>
            </button>
            <button className={`theme-option ${theme === 'autumn' ? 'active' : ''}`} onClick={() => selectTheme('autumn')}>
              <span className="theme-dots"><span style={{background:'#FBF5EE'}}></span><span style={{background:'#B45309'}}></span><span style={{background:'#E8DBC5'}}></span></span>
              <span>{t('theme_autumn')}</span>
            </button>
            <button className={`theme-option ${theme === 'nord' ? 'active' : ''}`} onClick={() => selectTheme('nord')}>
              <span className="theme-dots"><span style={{background:'#F0F3F8'}}></span><span style={{background:'#5E81AC'}}></span><span style={{background:'#D8DEE9'}}></span></span>
              <span>{t('theme_nord')}</span>
            </button>
            <button className={`theme-option ${theme === 'lavender' ? 'active' : ''}`} onClick={() => selectTheme('lavender')}>
              <span className="theme-dots"><span style={{background:'#F6F3FB'}}></span><span style={{background:'#7C3AED'}}></span><span style={{background:'#DDD6F3'}}></span></span>
              <span>{t('theme_lavender')}</span>
            </button>
            <button className={`theme-option ${theme === 'matcha' ? 'active' : ''}`} onClick={() => selectTheme('matcha')}>
              <span className="theme-dots"><span style={{background:'#F2EFE6'}}></span><span style={{background:'#7C8B6A'}}></span><span style={{background:'#D8D5C4'}}></span></span>
              <span>{t('theme_matcha')}</span>
            </button>
            <button className={`theme-option ${theme === 'sunset' ? 'active' : ''}`} onClick={() => selectTheme('sunset')}>
              <span className="theme-dots"><span style={{background:'#FFF7ED'}}></span><span style={{background:'#E8722A'}}></span><span style={{background:'#F0DCC5'}}></span></span>
              <span>{t('theme_sunset')}</span>
            </button>
            <button className={`theme-option ${theme === 'monochrome' ? 'active' : ''}`} onClick={() => selectTheme('monochrome')}>
              <span className="theme-dots"><span style={{background:'#F5F5F5'}}></span><span style={{background:'#6B7280'}}></span><span style={{background:'#D4D4D4'}}></span></span>
              <span>{t('theme_monochrome')}</span>
            </button>
            <button className={`theme-option ${theme === 'ocean' ? 'active' : ''}`} onClick={() => selectTheme('ocean')}>
              <span className="theme-dots"><span style={{background:'#0A1929'}}></span><span style={{background:'#06B6D4'}}></span><span style={{background:'#132F4C'}}></span></span>
              <span>{t('theme_ocean')}</span>
            </button>
            <button className={`theme-option ${theme === 'cyberpunk' ? 'active' : ''}`} onClick={() => selectTheme('cyberpunk')}>
              <span className="theme-dots"><span style={{background:'#0D0D1A'}}></span><span style={{background:'#FF00FF'}}></span><span style={{background:'#1A1A2E'}}></span></span>
              <span>{t('theme_cyberpunk')}</span>
            </button>
            <button className={`theme-option ${theme === 'wabi-sabi' ? 'active' : ''}`} onClick={() => selectTheme('wabi-sabi')}>
              <span className="theme-dots"><span style={{background:'#E8E2D8'}}></span><span style={{background:'#A8966A'}}></span><span style={{background:'#D5CEBF'}}></span></span>
              <span>{t('theme_wabi_sabi')}</span>
            </button>
            <button className={`theme-option ${theme === 'eclipse' ? 'active' : ''}`} onClick={() => selectTheme('eclipse')}>
              <span className="theme-dots"><span style={{background:'#2A1520'}}></span><span style={{background:'#D4727A'}}></span><span style={{background:'#3D2232'}}></span></span>
              <span>{t('theme_eclipse')}</span>
            </button>
            <button className={`theme-option ${theme === 'midnight' ? 'active' : ''}`} onClick={() => selectTheme('midnight')}>
              <span className="theme-dots"><span style={{background:'#0D1A12'}}></span><span style={{background:'#40916C'}}></span><span style={{background:'#162B1E'}}></span></span>
              <span>{t('theme_midnight')}</span>
            </button>
            <button className={`theme-option ${theme === 'shadow' ? 'active' : ''}`} onClick={() => selectTheme('shadow')}>
              <span className="theme-dots"><span style={{background:'#1A1208'}}></span><span style={{background:'#D97706'}}></span><span style={{background:'#2C2010'}}></span></span>
              <span>{t('theme_shadow')}</span>
            </button>
            <button className={`theme-option ${theme === 'polar' ? 'active' : ''}`} onClick={() => selectTheme('polar')}>
              <span className="theme-dots"><span style={{background:'#181D28'}}></span><span style={{background:'#81A1C1'}}></span><span style={{background:'#222A3A'}}></span></span>
              <span>{t('theme_polar')}</span>
            </button>
            <button className={`theme-option ${theme === 'amethyst' ? 'active' : ''}`} onClick={() => selectTheme('amethyst')}>
              <span className="theme-dots"><span style={{background:'#1A1228'}}></span><span style={{background:'#A78BFA'}}></span><span style={{background:'#261E3A'}}></span></span>
              <span>{t('theme_amethyst')}</span>
            </button>
            <button className={`theme-option ${theme === 'moss' ? 'active' : ''}`} onClick={() => selectTheme('moss')}>
              <span className="theme-dots"><span style={{background:'#161610'}}></span><span style={{background:'#8FA87C'}}></span><span style={{background:'#222218'}}></span></span>
              <span>{t('theme_moss')}</span>
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
            {clerk?.user?.hasImage ? <img src={clerk.user.imageUrl} alt="Profile" className="profile-avatar" /> : <User size={20} />}
          </button>
            {authMenuOpen && (
              <div className="dropdown">
                {!user ? (
          <button className="dropdown-item" onClick={() => { if (clerkAvailable && !isSignedIn && typeof clerk.openSignIn === 'function') { clerk.openSignIn() } else if (isSignedIn) { exchangeClerkToken() }; setAuthMenuOpen(false) }}>
            <LogIn size={18} /> {(!clerkAvailable || !isSignedIn) ? t('menu_login') : t('guest_login_btn')}
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
            <button className="primary-btn" onClick={() => { if (clerkAvailable && !isSignedIn && typeof clerk.openSignIn === 'function') { clerk.openSignIn() } else if (isSignedIn) { exchangeClerkToken() } }}>{t('guest_login_btn')}</button>
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
  navigate(canEdit ? `/editor/${folder.id}` : `/viewer/${folder.id}`, { state: { fromTab: activeTab } });
}}>
                        <div className="folder-actions" onClick={e => e.stopPropagation()}>
                          {activeTab === 'global-folders' && user && (
                            <button
                              className={`folder-settings-icon folder-bookmark-btn ${folder.is_favorite ? 'is-favorited' : ''}`}
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(folder.id) }}
                              title={folder.is_favorite ? 'Remove bookmark' : 'Bookmark'}
                            >
                              {folder.is_favorite ? <Bookmark size={16} fill="currentColor" /> : <Bookmark size={16} />}
                            </button>
                          )}
                          {(folder.card_count || folder.cardCount) > 0 && (
                            <button className="folder-settings-icon" onClick={() => navigate(`/study/${folder.id}`, { state: { canEdit: user && activeTab === 'my-folders', fromTab: activeTab } })} title="Study">
                              <BookOpen size={16} />
                            </button>
                          )}
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
        <div className="global-card-front" style={{ backgroundColor: card.frontBg || 'var(--bg-surface)' }}>
          <CardPreview html={card.front} />
          <div className="global-card-folder-info">
            {card.folder_title} • {card.folder_owner}
          </div>
        </div>
        <div className="global-card-back" style={{ backgroundColor: card.backBg || 'var(--bg-surface)' }}>
            <CardPreview html={card.back} />
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
          © 2024-2025 Cardsapp. All rights reserved.{" "}
          <a href="https://github.com/krluke/Cardsapp" target="_blank" rel="noopener noreferrer" className="footer-github-link">
            &lt;/&gt;github
          </a>
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
