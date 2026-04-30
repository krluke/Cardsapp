import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const API_BASE = '/api'

export function AddToFolderModal({ card, userEmail, onClose, onSuccess }) {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('ja')

  const getJwtToken = () => {
    const session = JSON.parse(localStorage.getItem('session') || '{}')
    return session.token || ''
  }

  useEffect(() => {
    setLang(localStorage.getItem('app-lang') || 'ja')
    loadPrivateFolders()
  }, [userEmail])

  const loadPrivateFolders = async () => {
    try {
      const jwtToken = getJwtToken()
      const res = await fetch(`${API_BASE}/folders?tab=my-folders&userEmail=${userEmail}`, {
        headers: jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {},
      })
      const data = await res.json()
      if (data.folders) {
        setFolders(data.folders.filter(f => f.visibility === 'private'))
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
        select_folder: "フォルダを選択",
        btn_add_to_folder: "フォルダに追加",
        success_add_card: "カードを追加しました",
        error_add_card: "カードの追加に失敗しました",
        cancel: "キャンセル",
      },
      en: {
        select_folder: "Select folder",
        btn_add_to_folder: "Add to folder",
        success_add_card: "Card added successfully",
        error_add_card: "Failed to add card",
        cancel: "Cancel",
      },
    }
    return translations[lang]?.[key] || key
  }

  const addCardToFolder = async (folderId) => {
    try {
      const jwtToken = getJwtToken()
      const res = await fetch(`${API_BASE}/cards/load-auth/${folderId}`, {
        headers: jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {},
      })
      const existingCards = await res.json()
      
      const newCard = {
        front: card.front,
        back: card.back,
        frontBg: card.frontBg,
        backBg: card.backBg,
      }
      
      const updatedCards = [...(Array.isArray(existingCards) ? existingCards : []), newCard]
      
      const saveRes = await fetch(`${API_BASE}/cards/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {}),
        },
        body: JSON.stringify({
          folderId,
          cards: updatedCards,
          userEmail,
        }),
      })
      
      if (saveRes.ok) {
        onSuccess(t('success_add_card'))
      } else {
        onSuccess(t('error_add_card'))
      }
    } catch (e) {
      console.error(e)
      onSuccess(t('error_add_card'))
    }
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="auth-box" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
        <h2 className="auth-title">{t('select_folder')}</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : folders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>{lang === 'ja' ? 'プライベートフォルダがありません' : 'No private folders'}</p>
        ) : (
          <div className="folder-list-modal">
            {folders.map(folder => (
              <button key={folder.id} className="folder-list-item" onClick={() => addCardToFolder(folder.id)}>
                {folder.title}
              </button>
            ))}
          </div>
        )}
        
        <button className="secondary-btn w-full mt-1" onClick={onClose}>{t('cancel')}</button>
      </div>
    </div>
  )
}
