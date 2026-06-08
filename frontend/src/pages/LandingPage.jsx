import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Palette, Globe, LogIn } from 'lucide-react'

const translations = {
  ja: {
    tagline: 'カードで学ぶ、\nカードで広がる。',
    description: 'CardsApp は、フラッシュカード作成から間隔反復学習まで、すべてを一つの場所で。美しいエディタで自由にデザインし、SM-2 アルゴリズムで効率よく記憶を定着。',
    cta: 'はじめる',
    login: 'ログイン',
    cta_guest: 'ログインせずに見る',
    feature_editor: 'ビジュアルエディタ',
    feature_editor_desc: 'ドラッグ＆ドロップで自由にカードをデザイン',
    feature_srs: '間隔反復学習',
    feature_srs_desc: 'SM-2 アルゴリズムで最適な復習タイミング',
    feature_themes: '20+ テーマ',
    feature_themes_desc: 'お好みのスタイルに合わせてカスタマイズ',
  },
  en: {
    tagline: 'Learn with cards.\nGrow with cards.',
    description: 'CardsApp brings flashcard creation and spaced-repetition study together in one place. Design freely with a beautiful editor, and let the SM-2 algorithm fix memory efficiently.',
    cta: 'Get Started',
    login: 'Login',
    cta_guest: 'Browse without login',
    feature_editor: 'Visual Editor',
    feature_editor_desc: 'Design cards freely with drag & drop',
    feature_srs: 'Spaced Repetition',
    feature_srs_desc: 'SM-2 algorithm for optimal review timing',
    feature_themes: '20+ Themes',
    feature_themes_desc: 'Customize to match your style',
  },
}

function t(key) {
  const lang = localStorage.getItem('app-lang') || 'ja'
  return translations[lang]?.[key] || key
}

export default function LandingPage({ clerkAvailable, clerkLoaded, clerk, onDevLogin }) {
 const navigate = useNavigate()
 const [langMenuOpen, setLangMenuOpen] = useState(false)
 const [lang, setLang] = useState(() => localStorage.getItem('app-lang') || 'ja')

 const selectLanguage = (newLang) => {
  setLang(newLang)
  localStorage.setItem('app-lang', newLang)
  setLangMenuOpen(false)
 }

  const handleAuth = async () => {
    if (clerkAvailable && clerkLoaded && typeof clerk?.openSignIn === 'function') {
      clerk.openSignIn({ redirectUrl: '/home' })
    } else if (!clerkAvailable && onDevLogin) {
      const session = await onDevLogin()
      if (session) {
        localStorage.setItem('session:v1', JSON.stringify(session))
        navigate('/home')
      }
    } else {
      navigate('/home')
    }
  }

  const handleGuest = () => {
    navigate('/home?tab=global-folders')
  }

  return (
    <div className="landing-page">
      <div className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo-mark">Cards</span>
          <span className="landing-logo-app">App</span>
        </div>
  <div className="landing-nav-actions">
   <div className="lang-menu">
    <button className="lang-btn" onClick={() => setLangMenuOpen(!langMenuOpen)}>
     <Globe size={15} /> <span>{lang.toUpperCase()}</span>
    </button>
    {langMenuOpen && (
     <div className="lang-dropdown">
      <button className={`lang-option ${lang === 'ja' ? 'active' : ''}`} onClick={() => selectLanguage('ja')}>🇯🇵 日本語</button>
      <button className={`lang-option ${lang === 'en' ? 'active' : ''}`} onClick={() => selectLanguage('en')}>🇺🇸 English</button>
     </div>
    )}
   </div>
   {(clerkAvailable || onDevLogin) && (
          <button className="landing-nav-login" onClick={handleAuth}>
            <LogIn size={16} /> {t('login')}
          </button>
        )}
        <button className="landing-nav-cta" onClick={handleAuth}>
          {clerkAvailable ? t('cta') : onDevLogin ? t('login') : t('cta_guest')}
        </button>
        </div>
      </div>

      <main className="landing-hero">
        <h1 className="landing-headline">{t('tagline')}</h1>
        <p className="landing-description">{t('description')}</p>
        <div className="landing-actions">
      <button className="landing-primary-cta" onClick={handleAuth}>
        {clerkAvailable || onDevLogin ? t('cta') : t('cta_guest')} <ArrowRight size={18} />
      </button>
      {clerkAvailable && (
            <button className="landing-secondary-cta" onClick={handleGuest}>
              {t('cta_guest')}
            </button>
          )}
        </div>
      </main>

      <section className="landing-features">
        <div className="landing-feature">
          <div className="landing-feature-icon">
            <BookOpen size={28} />
          </div>
          <h3>{t('feature_editor')}</h3>
          <p>{t('feature_editor_desc')}</p>
        </div>
        <div className="landing-feature">
          <div className="landing-feature-icon">
            <Palette size={28} />
          </div>
          <h3>{t('feature_srs')}</h3>
          <p>{t('feature_srs_desc')}</p>
        </div>
        <div className="landing-feature">
          <div className="landing-feature-icon">
            <Globe size={28} />
          </div>
          <h3>{t('feature_themes')}</h3>
          <p>{t('feature_themes_desc')}</p>
        </div>
      </section>

      <footer className="landing-footer">
        &copy; 2024-2025 Cardsapp
      </footer>
    </div>
  )
}
