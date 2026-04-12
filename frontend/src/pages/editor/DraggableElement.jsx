import { useState, useEffect, useRef } from 'react';
import { X, Volume2 } from 'lucide-react';

export function DraggableText({ element, isSelected, onSelect, onUpdate, onDelete, t }) {
  const elementRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0 });

  const getCanvasDimensions = () => {
    const canvas = document.querySelector('.card-canvas');
    if (!canvas) return { width: 640, height: 427 };
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

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
    const dims = getCanvasDimensions();
    dragStartRef.current = { x: e.clientX, y: e.clientY, left: element.left, top: element.top, canvasWidth: dims.width, canvasHeight: dims.height };
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    onSelect(element.id);
    setIsResizing(true);
    const dims = getCanvasDimensions();
    dragStartRef.current = { x: e.clientX, width: element.width || 40, canvasWidth: dims.width };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;
    const handleMouseMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const percentX = (dx / dragStartRef.current.canvasWidth) * 100;
        const percentY = (dy / dragStartRef.current.canvasHeight) * 100;
        const newLeft = Math.max(0, Math.min(90, dragStartRef.current.left + percentX));
        const newTop = Math.max(0, Math.min(90, dragStartRef.current.top + percentY));
        onUpdate(element.id, { left: newLeft, top: newTop });
      } else if (isResizing) {
        const dx = e.clientX - dragStartRef.current.x;
        const percentX = (dx / dragStartRef.current.canvasWidth) * 100;
        const newWidth = Math.max(10, Math.min(90, dragStartRef.current.width + percentX));
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
        backgroundColor: isSelected ? 'rgba(217, 119, 87, 0.15)' : 'transparent',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        zIndex: isSelected ? 100 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        contentEditable
        suppressContentEditableWarning
        className="text-content"
        style={{ outline: 'none', minHeight: '20px', background: 'transparent' }}
        onFocus={(e) => {
          if (e.target.innerText === t('placeholder_text_input')) {
            e.target.innerText = '';
          }
          const range = document.createRange();
          range.selectNodeContents(e.target);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
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
          <div className="element-controls" style={{ position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', zIndex: 101 }}>
            <button className="delete-element-btn" onClick={(e) => { e.stopPropagation(); onDelete(element.id) }} title="Delete" style={{ background: '#dc2626', color: 'white', padding: '4px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
              <X size={14} />
            </button>
            <button className="delete-element-btn" style={{ background: '#3b82f6', color: 'white', padding: '4px', borderRadius: '4px', border: 'none', cursor: 'pointer' }} onClick={speak} title="Speak">
              <Volume2 size={14} />
            </button>
          </div>
          <div className="resize-handle" style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '14px', height: '14px', background: '#D97757', borderRadius: '50%', cursor: 'se-resize', border: '2px solid white', zIndex: 102 }} onMouseDown={handleResizeStart} />
        </>
      )}
    </div>
  );
}

export function DraggableImage({ element, isSelected, onSelect, onUpdate, onDelete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0, canvasWidth: 640, canvasHeight: 427, aspect: 1.67 });

  const getCanvasDimensions = () => {
    const canvas = document.querySelector('.card-canvas');
    if (!canvas) return { width: 640, height: 427 };
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'IMG') return;
    e.stopPropagation();
    onSelect(element.id);
    setIsDragging(true);
    const dims = getCanvasDimensions();
    dragStartRef.current = { x: e.clientX, y: e.clientY, left: element.left, top: element.top, width: element.width || 50, height: element.height || 30, canvasWidth: dims.width, canvasHeight: dims.height };
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    onSelect(element.id);
    setIsResizing(true);
    const dims = getCanvasDimensions();
    dragStartRef.current = { x: e.clientX, width: element.width || 50, aspect: (element.width || 50) / (element.height || 30), canvasWidth: dims.width };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;
    const handleMouseMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const percentX = (dx / dragStartRef.current.canvasWidth) * 100;
        const percentY = (dy / dragStartRef.current.canvasHeight) * 100;
        onUpdate(element.id, { 
          left: Math.max(0, Math.min(90, dragStartRef.current.left + percentX)),
          top: Math.max(0, Math.min(90, dragStartRef.current.top + percentY))
        });
      } else if (isResizing) {
        const dx = e.clientX - dragStartRef.current.x;
        const percentX = (dx / dragStartRef.current.canvasWidth) * 100;
        const newWidth = Math.max(10, Math.min(90, dragStartRef.current.width + percentX));
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
