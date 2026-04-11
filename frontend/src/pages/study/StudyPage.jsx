import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, RotateCcw, Volume2, Shuffle, BookOpen } from 'lucide-react';
import './Study.css';

const API_BASE = '/api';

function getNextReviewText(quality, currentInterval) {
  const intervals = { 0: '1 day', 2: '1 day', 3: currentInterval === 0 ? '1 day' : currentInterval === 1 ? '6 days' : `${Math.ceil(currentInterval * 2.5)} days`, 5: currentInterval === 0 ? '1 day' : currentInterval === 1 ? '6 days' : `${Math.ceil(currentInterval * 3)} days` };
  return intervals[quality] || '';
}

export default function StudyPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [studyMode, setStudyMode] = useState('due'); // 'due' or 'all'
  const [shuffled, setShuffled] = useState(false);
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0, total: 0 });

  const session = JSON.parse(localStorage.getItem('session') || '{}');
  const user = session.user;

  const loadCards = useCallback(async (mode, shuffle = false) => {
    try {
      const url = mode === 'all' 
        ? `${API_BASE}/cards/load/${folderId}?userEmail=${user.email || user.id}`
        : `${API_BASE}/study/cards?userEmail=${user.email || user.id}&folderId=${folderId}`;
      const res = await fetch(url);
      let data = await res.json();
      
      // Handle error responses
      if (!res.ok || data.message) {
        console.error('API Error:', data.message || 'Unknown error');
        setCards([]);
        setLoading(false);
        return;
      }
      
      if (mode === 'all' && Array.isArray(data)) {
        data = data.map((c, i) => ({ ...c, id: c.id || i + 1000 }));
      }
      
      if (shuffle && Array.isArray(data)) {
        data = [...data].sort(() => Math.random() - 0.5);
      }
      
      setCards(Array.isArray(data) ? data : []);
      setCurrentIndex(0);
      setIsFlipped(false);
      setFinished(false);
    } catch (e) { 
      console.error(e); 
      setCards([]);
    }
    finally { setLoading(false); }
  }, [folderId, user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    if (!user) { navigate('/home'); return; }
    loadCards(studyMode, shuffled);
  }, [folderId, studyMode, shuffled]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (finished || loading) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(!isFlipped);
      }
      if (isFlipped) {
        if (e.key === '1') handleRate(0);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(5);
      }
      if (e.key === 'ArrowRight' && currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setIsFlipped(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, finished, loading, currentIndex, cards.length]);

  const handleRate = async (quality) => {
    const card = cards[currentIndex];
    setStats(s => ({ ...s, [quality === 0 ? 'again' : quality === 2 ? 'hard' : quality === 3 ? 'good' : 'easy']: s[quality === 0 ? 'again' : quality === 2 ? 'hard' : quality === 3 ? 'good' : 'easy'] + 1, total: s.total + 1 }));
    
    if (studyMode === 'due') {
      try {
        await fetch(`${API_BASE}/study/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken || '' },
          body: JSON.stringify({ cardId: card.id, quality, userEmail: user.email || user.id }),
        });
      } catch (e) { console.error(e); }
    }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setFinished(true);
    }
  };

  const speak = (e, content) => {
    e.stopPropagation();
    const text = content.replace(/<[^>]*>/g, '').trim();
    if (!text) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Detect language patterns (Japanese, Chinese, Korean, etc.)
    const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text);
    const hasChinese = /[\u4e00-\u9fff]/.test(text);
    const hasKorean = /[\uac00-\ud7af\u1100-\u11ff]/.test(text);
    
    let lang = 'en-US';
    if (hasJapanese) lang = 'ja-JP';
    else if (hasChinese) lang = 'zh-CN';
    else if (hasKorean) lang = 'ko-KR';
    else if (/[àâäéèêëïîôùûüÿœæç]/.test(text)) lang = 'fr-FR';
    else if (/[äöüß]/.test(text)) lang = 'de-DE';
    else if (/[áéíóúñ¿¡]/.test(text)) lang = 'es-ES';
    else if (/[а-яё]/.test(text)) lang = 'ru-RU';
    
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    // Try to get a better voice for the language
    const voices = window.speechSynthesis?.getVoices() || [];
    const bestVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0])) || voices[0];
    if (bestVoice) utterance.voice = bestVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  if (loading) return <div className="study-container">Loading...</div>;
  if (cards.length === 0) return (
    <div className="study-container">
      <h2>No cards to study! 🎉</h2>
      <div className="finished-buttons">
        <button className="primary-btn" onClick={() => navigate(`/editor/${folderId}`)}>Back to Editor</button>
        <button className="secondary-btn" onClick={() => navigate('/home')}>Home</button>
      </div>
    </div>
  );

  if (finished) {
    const accuracy = stats.total > 0 ? Math.round(((stats.good + stats.easy) / stats.total) * 100) : 0;
    return (
      <div className="study-container">
        <h2>Study Session Complete! 🌟</h2>
        <div className="session-stats">
          <div className="stat-item"><span className="stat-value">{stats.total}</span><span className="stat-label">Cards Reviewed</span></div>
          <div className="stat-item"><span className="stat-value">{accuracy}%</span><span className="stat-label">Accuracy</span></div>
          <div className="stat-item stat-easy"><span className="stat-value">{stats.easy}</span><span className="stat-label">Easy</span></div>
          <div className="stat-item stat-good"><span className="stat-value">{stats.good}</span><span className="stat-label">Good</span></div>
          <div className="stat-item stat-hard"><span className="stat-value">{stats.hard}</span><span className="stat-label">Hard</span></div>
          <div className="stat-item stat-again"><span className="stat-value">{stats.again}</span><span className="stat-label">Again</span></div>
        </div>
        <div className="finished-buttons">
          <button className="primary-btn" onClick={() => { setStats({ again: 0, hard: 0, good: 0, easy: 0, total: 0 }); loadCards(studyMode, shuffled); }}>Study Again</button>
          <button className="secondary-btn" onClick={() => navigate(`/editor/${folderId}`)}>Back to Editor</button>
          <button className="secondary-btn" onClick={() => navigate('/home')}>Home</button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="study-container">
      <header className="study-header">
        <button className="toolbar-btn" onClick={() => navigate(`/editor/${folderId}`)}><ArrowLeft size={18} /> Back</button>
        <div className="study-mode-toggle">
          <button className={`mode-btn ${studyMode === 'due' ? 'active' : ''}`} onClick={() => setStudyMode('due')}>Due</button>
          <button className={`mode-btn ${studyMode === 'all' ? 'active' : ''}`} onClick={() => setStudyMode('all')}>All</button>
          <button className={`mode-btn ${shuffled ? 'active' : ''}`} onClick={() => setShuffled(!shuffled)} title="Shuffle"><Shuffle size={16} /></button>
        </div>
        <div className="study-progress">Card {currentIndex + 1} of {cards.length}</div>
      </header>

      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className={`study-card ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
        <div className="study-card-inner">
          <div className="study-card-front" style={{ backgroundColor: currentCard.front_bg || '#ffffff' }}>
            <div className="study-content" dangerouslySetInnerHTML={{ __html: currentCard.front_content }} />
            <button className="speak-btn" onClick={(e) => speak(e, currentCard.front_content)}><Volume2 size={20} /></button>
            <div className="flip-hint">Click or press Space to flip</div>
          </div>
          <div className="study-card-back" style={{ backgroundColor: currentCard.back_bg || '#ffffff' }}>
            <div className="study-content" dangerouslySetInnerHTML={{ __html: currentCard.back_content }} />
            <button className="speak-btn" onClick={(e) => speak(e, currentCard.back_content)}><Volume2 size={20} /></button>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="study-controls">
          <div className="rate-hint">Press 1-4 or click:</div>
          <button className="rate-btn again" onClick={() => handleRate(0)}>
            <span className="rate-key">1</span><XCircle size={20} /> Again
            <span className="next-review">{getNextReviewText(0, 0)}</span>
          </button>
          <button className="rate-btn hard" onClick={() => handleRate(2)}>
            <span className="rate-key">2</span><HelpCircle size={20} /> Hard
            <span className="next-review">{getNextReviewText(2, 0)}</span>
          </button>
          <button className="rate-btn good" onClick={() => handleRate(3)}>
            <span className="rate-key">3</span><RotateCcw size={20} /> Good
            <span className="next-review">{getNextReviewText(3, currentCard.srs_interval || 0)}</span>
          </button>
          <button className="rate-btn easy" onClick={() => handleRate(5)}>
            <span className="rate-key">4</span><CheckCircle size={20} /> Easy
            <span className="next-review">{getNextReviewText(5, currentCard.srs_interval || 0)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
