import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export function AddToFolderModal({ card, onClose, onSuccess }) {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [lang] = useState(() => localStorage.getItem('app-lang') || 'ja')

  const loadPrivateFolders = async () => {
    try {
      const res = await apiFetch('/folders?tab=my-folders')
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

  useEffect(() => {
    requestAnimationFrame(() => loadPrivateFolders())
  }, [])

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
      const res = await apiFetch(`/cards/load-auth/${folderId}`)
      const existingCards = await res.json()

      const newCard = {
        front: card.front,
        back: card.back,
        frontBg: card.frontBg,
        backBg: card.backBg,
      }

      const updatedCards = [...(Array.isArray(existingCards) ? existingCards : []), newCard]

      const saveRes = await apiFetch('/cards/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId,
          cards: updatedCards,
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
