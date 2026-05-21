import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User } from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import './AccountPage.css'

export default function AccountPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [totalCards, setTotalCards] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('ja')
  const clerk = useClerk()

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('session') || '{}')
    if (!session.user) {
      navigate('/home')
      return
    }
    setUser(session.user)

    const savedTheme = localStorage.getItem('app-theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)

    const savedLang = localStorage.getItem('app-lang') || 'ja'
    setLang(savedLang)

    loadTotalCards()
  }, [navigate])

  const loadTotalCards = async () => {
    try {
      const res = await apiFetch('/folders?tab=my-folders')
      const data = await res.json()
      if (data.folders) {
        const total = data.folders.reduce((sum, folder) => sum + (folder.card_count || 0), 0)
        setTotalCards(total)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const t = (key) => {
    const translations = {
      ja: {
        account_title: "アカウント情報",
        account_username: "ユーザー名",
        account_email: "メールアドレス",
        account_total_cards: "保有カード数",
        btn_back: "戻る",
        manage_account_btn: "アカウントを管理",
      },
      en: {
        account_title: "Account Info",
        account_username: "Username",
        account_email: "Email",
        account_total_cards: "Total Cards",
        btn_back: "Back",
        manage_account_btn: "Manage Account",
      },
    }
    return translations[lang]?.[key] || key
  }

  if (loading) return <div className="page-container">Loading...</div>

  return (
    <div className="account-page">
      <header className="account-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <ArrowLeft size={20} /> {t('btn_back')}
        </button>
        <User size={20} className="user-icon-header" />
        <h1 className="account-title">{t('account_title')}</h1>
      </header>
      <main className="account-main">
        <div className="account-card">
          <div className="account-info-row">
            <span className="account-label">{t('account_username')}</span>
            <span className="account-value">{user?.username || '-'}</span>
          </div>
          <div className="account-info-row">
            <span className="account-label">{t('account_email')}</span>
            <span className="account-value">{user?.email || '-'}</span>
          </div>
          <div className="account-info-row">
            <span className="account-label">{t('account_total_cards')}</span>
            <span className="account-value">{totalCards}</span>
          </div>
          <div className="account-action-row">
            <button
              className="change-password-btn"
              onClick={() => clerk.openUserProfile()}
            >
              {t('manage_account_btn')}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}