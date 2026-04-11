import { useState, useEffect, useRef } from 'react';
import { X, Volume2 } from 'lucide-react';

export function DraggableText({ element, isSelected, onSelect, onUpdate, onDelete, t }) {
  const elementRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0 });

  const speak = (e) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(element.content || t('placeholder_text_input'));
    window.speechSynthesis.speak(utterance);
  };

  const handleMouseDown = (e) => {
    if (e.target.contentEditable === 'true') return;
    e.stopPropagation();
    onSelect(element.id);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, left: element.left, top: element.top };
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    onSelect(element.id);
    setIsResizing(true);
    dragStartRef.current = { x: e.clientX, width: element.width || 40 };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;
    const handleMouseMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const newLeft = Math.max(0, Math.min(90, dragStartRef.current.left + (dx / 4)));
        const newTop = Math.max(0, Math.min(90, dragStartRef.current.top + (dy / 3)));
        onUpdate(element.id, { left: newLeft, top: newTop });
      } else if (isResizing) {
        const dx = e.clientX - dragStartRef.current.x;
        const newWidth = Math.max(10, Math.min(90, dragStartRef.current.width + (dx / 3)));
        onUpdate(element.id, { width: newWidth });
      }
    };
    const handleMouseUp = () => { setIsDragging(false); setIsResizing(false); };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, element.id, onUpdate]);

  return (
    <div
      ref={elementRef}
      className={`draggable-text-element ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: `${element.left}%`,
        top: `${element.top}%`,
        width: element.width ? `${element.width}%` : 'auto',
        minWidth: '50px',
        fontSize: `${element.fontSize || 16}px`,
        fontFamily: element.fontFamily || 'sans-serif',
        fontWeight: element.fontWeight || 'normal',
        fontStyle: element.fontStyle || 'normal',
        textDecoration: element.textDecoration || 'none',
        textAlign: element.textAlign || 'left',
        color: element.color || '#000000',
        cursor: isDragging ? 'grabbing' : 'move',
        padding: '4px 8px',
        border: isSelected ? '2px solid #D97757' : '2px solid transparent',
        borderRadius: '4px',
        backgroundColor: isSelected ? 'rgba(217, 119, 87, 0.1)' : 'transparent',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        contentEditable
        suppressContentEditableWarning
        className="text-content"
        style={{ outline: 'none', minHeight: '20px' }}
        onFocus={(e) => {
          if (e.target.innerText === t('placeholder_text_input')) {
            e.target.innerText = '';
          }
          e.target.select();
        }}
        onBlur={(e) => {
          if (!e.target.innerText.trim()) {
            e.target.innerText = t('placeholder_text_input');
          }
          onUpdate(element.id, { content: e.target.innerText });
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {element.content || t('placeholder_text_input')}
      </div>
      {isSelected && (
        <>
          <div className="element-controls" style={{ position: 'absolute', top: '-25px', right: '0', display: 'flex', gap: '4px' }}>
            <button className="delete-element-btn" onClick={(e) => { e.stopPropagation(); onDelete(element.id) }}>
              <X size={14} />
            </button>
            <button className="delete-element-btn" style={{ background: 'var(--accent-color)' }} onClick={speak}>
              <Volume2 size={14} />
            </button>
          </div>
          <div className="resize-handle" style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '12px', height: '12px', background: '#D97757', borderRadius: '2px', cursor: 'se-resize' }} onMouseDown={handleResizeStart} />
        </>
      )}
    </div>
  );
}

export function DraggableImage({ element, isSelected, onSelect, onUpdate, onDelete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0 });

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'IMG') return;
    e.stopPropagation();
    onSelect(element.id);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, left: element.left, top: element.top, width: element.width || 50, height: element.height || 30 };
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    onSelect(element.id);
    setIsResizing(true);
    dragStartRef.current = { x: e.clientX, width: element.width || 50, aspect: (element.width || 50) / (element.height || 30) };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;
    const handleMouseMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        onUpdate(element.id, { 
          left: Math.max(0, Math.min(90, dragStartRef.current.left + (dx / 4))),
          top: Math.max(0, Math.min(90, dragStartRef.current.top + (dy / 3)))
        });
      } else if (isResizing) {
        const dx = e.clientX - dragStartRef.current.x;
        const newWidth = Math.max(10, Math.min(90, dragStartRef.current.width + (dx / 3)));
        onUpdate(element.id, { width: newWidth, height: newWidth / dragStartRef.current.aspect });
      }
    };
    const handleMouseUp = () => { setIsDragging(false); setIsResizing(false); };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, element.id, onUpdate]);

  return (
    <div
      className={`draggable-image-element ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: `${element.left}%`,
        top: `${element.top}%`,
        width: `${element.width || 50}%`,
        height: element.height ? `${element.height}%` : 'auto',
        cursor: isDragging ? 'grabbing' : 'move',
        border: isSelected ? '2px solid #D97757' : '2px solid transparent',
        borderRadius: '4px'
      }}
      onMouseDown={handleMouseDown}
    >
      <img src={element.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
      {isSelected && (
        <>
          <button className="delete-element-btn" onClick={(e) => { e.stopPropagation(); onDelete(element.id) }}><X size={14} /></button>
          <div className="resize-handle" onMouseDown={handleResizeStart} />
        </>
      )}
    </div>
  );
}
