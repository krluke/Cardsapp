import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Lock } from 'lucide-react'
import './AccountPage.css'

export default function AccountPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [totalCards, setTotalCards] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('ja')
      const [showPasswordModal, setShowPasswordModal] = useState(false)
      const [oldPassword, setOldPassword] = useState('')
      const [newPassword, setNewPassword] = useState('')
      const [confirmPassword, setConfirmPassword] = useState('')
      const [passwordError, setPasswordError] = useState('')
      const [passwordSuccess, setPasswordSuccess] = useState(false)

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
      const res = await apiFetch(`/folders?tab=my-folders&userEmail=${encodeURIComponent(userEmail)}`)
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

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

      try {
      const session = JSON.parse(localStorage.getItem('session') || '{}')
      const csrfToken = session.csrfToken || ''
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword })
      })

    const data = await res.json()
    if (res.ok) {
      setPasswordSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
      setTimeout(() => setShowPasswordModal(false), 2000)
      setTimeout(() => setPasswordSuccess(false), 5000)
    } else {
      setPasswordError(data.error || 'Failed to change password')
    }
  } catch (err) {
  setPasswordError('Error changing password')
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
    change_password_btn: "パスワードを変更",
    change_password_title: "パスワードを変更",
    current_password: "現在のパスワード",
    new_password: "新しいパスワード",
    confirm_new_password: "新しいパスワードを確認",
    cancel: "キャンセル",
    update: "更新",
    password_change_success: "パスワードを正常に変更しました！",
  },
  en: {
    account_title: "Account Info",
    account_username: "Username",
    account_email: "Email",
    account_total_cards: "Total Cards",
    btn_back: "Back",
    change_password_btn: "Change Password",
    change_password_title: "Change Password",
    current_password: "Current Password",
    new_password: "New Password",
    confirm_new_password: "Confirm New Password",
    cancel: "Cancel",
    update: "Update",
    password_change_success: "Password changed successfully!",
  },
    }
    return translations[lang]?.[key] || key
  }

  if (loading) return <div className="page-container">Loading...</div>

  if (passwordSuccess) {
    return (
      <div className="page-container">
        <div className="account-page">
          <div className="empty-state-password-success">
            {t('password_change_success')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
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
                onClick={() => setShowPasswordModal(true)}
              >
                <Lock size={16} />
                {t('change_password_btn')}
              </button>
            </div>
          </div>
        </main>
      </div>

      {showPasswordModal && (
        <div className="password-modal-overlay">
          <div className="password-modal-container">
            <div className="account-header">
              <h2 className="modal-title">{t('change_password_title')}</h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="close-modal-btn"
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-input-group">
                <label htmlFor="oldPassword" className="form-label">
                  {t('current_password')}
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-input-group">
                <label htmlFor="newPassword" className="form-label">
                  {t('new_password')}
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  minLength={8}
                  required
                />
              </div>
              <div className="form-input-group">
                <label htmlFor="confirmPassword" className="form-label">
                  {t('confirm_new_password')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              {passwordError && <p className="password-error">{passwordError}</p>}
              <div className="modal-action-buttons">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn-outline-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {t('update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}