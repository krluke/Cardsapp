import { useState } from 'react';
import { Search, X } from 'lucide-react';
import sanitizeHtml from 'sanitize-html';

export function GlobalSearchModal({ isOpen, onClose, onSelectCard, userEmail }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&userEmail=${userEmail}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="auth-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
        <h2 className="auth-title">Global Search</h2>
        <div className="input-with-btn mb-1">
          <input 
            className="input-field" 
            placeholder="Search cards or folders..." 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="secondary-btn shadow-btn" onClick={handleSearch} disabled={loading}>
            {loading ? '...' : <Search size={18} />}
          </button>
        </div>
        <div className="search-results" style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '20px' }}>
          {results.length === 0 && !loading && query && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No results found</p>}
          {results.map((res, idx) => (
            <div 
              key={idx} 
              className="search-item" 
              onClick={() => onSelectCard(res)}
              style={{ 
                padding: '12px', 
                borderBottom: '1px solid var(--border-color)', 
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 'bold' }}>{res.folder_title}</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>{sanitizeHtml(res.front_content || '', { allowedTags: [], allowedAttributes: {} }).substring(0, 100)}...</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
