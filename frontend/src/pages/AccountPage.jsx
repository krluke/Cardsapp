import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './AccountPage.css'

const API_BASE = '/api'

export default function AccountPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [totalCards, setTotalCards] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('ja')

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

    loadTotalCards(session.user.email || session.user.id)
  }, [navigate])

  const loadTotalCards = async (userEmail) => {
    try {
      const res = await fetch(`${API_BASE}/folders?tab=my-folders&userEmail=${userEmail}`)
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
      },
      en: {
        account_title: "Account Info",
        account_username: "Username",
        account_email: "Email",
        account_total_cards: "Total Cards",
        btn_back: "Back",
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
        </div>
      </main>
    </div>
  )
}