import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import './Viewer.css'

const API_BASE = '/api'

export default function ViewerPage() {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const [folder, setFolder] = useState(null)
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    
    loadData()
  }, [folderId])

  const loadData = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}')
      const jwtToken = session.token || ''

      const cardsRes = await fetch(`${API_BASE}/cards/load/${folderId}`)
      const cardsData = await cardsRes.json()
      setCards(Array.isArray(cardsData) ? cardsData : [])
      
      if (jwtToken) {
        const folderRes = await fetch(`${API_BASE}/folders?tab=my-folders`, {
          headers: { 'Authorization': `Bearer ${jwtToken}` },
        })
        const folderData = await folderRes.json()
        const currentFolder = folderData.folders?.find(f => f.id === parseInt(folderId))
        setFolder(currentFolder || null)
      } else {
        setFolder(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const goNext = () => {
    setFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % cards.length)
  }

  const goPrev = () => {
    setFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }

  if (loading) return <div className="page-container">Loading...</div>

  if (!cards.length) {
    return (
      <div className="viewer-container">
        <header className="viewer-header">
          <button className="back-btn" onClick={() => navigate('/home')}>
            <ArrowLeft size={20} /> Back
          </button>
        </header>
        <div className="viewer-empty">
          <p>No cards in this folder</p>
          <button className="create-cards-btn" onClick={() => navigate(`/editor/${folderId}`)}>
            Create Cards
          </button>
        </div>
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  return (
    <div className="viewer-container">
      <header className="viewer-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="viewer-title">{folder?.title || 'Viewer'}</h1>
        <span className="card-counter">{currentIndex + 1} / {cards.length}</span>
      </header>

      <main className="viewer-main">
        <div className="flashcard-container" onClick={() => setFlipped(!flipped)}>
          <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
            <div className="flashcard-front" style={{ backgroundColor: currentCard.frontBg || '#ffffff' }}>
              <div className="flashcard-content" dangerouslySetInnerHTML={{ __html: currentCard.front || '<p>Empty</p>' }} />
              <div className="flip-hint">Click to flip</div>
            </div>
            <div className="flashcard-back" style={{ backgroundColor: currentCard.backBg || '#ffffff' }}>
              <div className="flashcard-content" dangerouslySetInnerHTML={{ __html: currentCard.back || '<p>Empty</p>' }} />
              <div className="flip-hint">Click to flip</div>
            </div>
          </div>
        </div>

        <div className="viewer-controls">
          <button className="nav-btn" onClick={goPrev}>
            <ChevronLeft size={32} />
          </button>
          <button className="flip-btn" onClick={() => setFlipped(!flipped)}>
            Flip
          </button>
          <button className="nav-btn" onClick={goNext}>
            <ChevronRight size={32} />
          </button>
        </div>
      </main>
    </div>
  )
}
