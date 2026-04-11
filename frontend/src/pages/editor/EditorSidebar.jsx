import { Plus } from 'lucide-react';

export function EditorSidebar({ cards, currentIndex, onSelectCard, onAddCard }) {
  return (
    <aside className="thumbnail-sidebar">
      <div className="thumbnail-list">
        {cards.map((card, idx) => (
          <div key={idx} className={`thumbnail ${currentIndex === idx ? 'active' : ''}`} onClick={() => onSelectCard(idx)}>
            <span>{idx + 1}</span>
          </div>
        ))}
      </div>
      <button className="add-card-btn" onClick={onAddCard}><Plus size={20} /></button>
    </aside>
  );
}
