import { useState, useEffect, useRef } from 'react';
import { Trash2, Move, RotateCw, Volume2 } from 'lucide-react';

export function DraggableText({ element, isSelected, onSelect, onUpdate, onDelete, t }) {
  const elementRef = useRef(null);
  const contentRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0, width: 0, height: 0, rotation: 0, startAngle: 0 });

  const getCanvasDimensions = () => {
    const canvas = document.querySelector('.card-canvas');
    if (!canvas) return { width: 640, height: 427 };
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

  const getCenter = () => {
    if (!elementRef.current) return { x: 0, y: 0 };
    const rect = elementRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  const getAngle = (clientX, clientY) => {
    const center = getCenter();
    return Math.atan2(clientY - center.y, clientX - center.x) * (180 / Math.PI);
  };

  const speak = (e) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(element.content || t('placeholder_text_input'));
    window.speechSynthesis.speak(utterance);
  };

  const handleEdgeMouseDown = (e) => {
    if (e.target.contentEditable === 'true') return;
    if (isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect(element.id);
    setIsDragging(true);
    const dims = getCanvasDimensions();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: element.left,
      top: element.top,
      canvasWidth: dims.width,
      canvasHeight: dims.height
    };
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(element.id);
    setIsResizing(true);
    const dims = getCanvasDimensions();
    dragStartRef.current = {
      x: e.clientX,
      width: element.width || 40,
      canvasWidth: dims.width
    };
  };

  const handleResizeHeightStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(element.id);
    setIsResizingHeight(true);
    const dims = getCanvasDimensions();
    dragStartRef.current = {
      y: e.clientY,
      height: element.height || 20,
      canvasHeight: dims.height
    };
  };

  const handleRotateStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(element.id);
    setIsRotating(true);
    const startAngle = getAngle(e.clientX, e.clientY);
    dragStartRef.current = {
      startAngle,
      rotation: element.rotation || 0
    };
  };

  const handleContentFocus = (e) => {
    setIsEditing(true);
    if (e.target.innerText === t('placeholder_text_input')) {
      e.target.innerText = '';
    }
    const range = document.createRange();
    range.selectNodeContents(e.target);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const handleContentBlur = (e) => {
    setIsEditing(false);
    if (!e.target.innerText.trim()) {
      e.target.innerText = t('placeholder_text_input');
    }
    onUpdate(element.id, { content: e.target.innerText });
  };

  useEffect(() => {
    if (!isDragging && !isResizing && !isResizingHeight && !isRotating) return;

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
      } else if (isResizingHeight) {
        const dy = e.clientY - dragStartRef.current.y;
        const percentY = (dy / dragStartRef.current.canvasHeight) * 100;
        const currentHeight = typeof dragStartRef.current.height === 'number' ? dragStartRef.current.height : 20;
        const newHeight = Math.max(10, Math.min(80, currentHeight + percentY));
        onUpdate(element.id, { height: newHeight });
      } else if (isRotating) {
        const currentAngle = getAngle(e.clientX, e.clientY);
        const deltaAngle = currentAngle - dragStartRef.current.startAngle;
        const newRotation = dragStartRef.current.rotation + deltaAngle;
        onUpdate(element.id, { rotation: newRotation });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsResizingHeight(false);
      setIsRotating(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isResizingHeight, isRotating, element.id, onUpdate]);

  const handleContentClick = (e) => {
    e.stopPropagation();
    if (!isEditing) {
      onSelect(element.id);
    }
  };

  const containerStyle = {
    position: 'absolute',
    left: `${element.left}%`,
    top: `${element.top}%`,
    width: element.width ? `${element.width}%` : 'auto',
    height: element.height && element.height !== 'auto' ? `${element.height}%` : 'auto',
    minWidth: '80px',
    minHeight: '30px',
    transform: `rotate(${element.rotation || 0}deg)`,
    transformOrigin: 'center center',
    cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'default',
    zIndex: isSelected ? 100 : 1,
    userSelect: 'none'
  };

  const contentStyle = {
    fontSize: `${element.fontSize || 16}px`,
    fontFamily: element.fontFamily || 'sans-serif',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.textDecoration || 'none',
    textAlign: element.textAlign || 'left',
    color: element.color || '#000000',
    backgroundColor: element.highlightColor || 'transparent',
    outline: 'none',
    minHeight: '20px',
    padding: '8px',
    borderRadius: '4px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  };

  const edgeStyle = {
    position: 'absolute',
    top: '-4px',
    left: '-4px',
    right: '-4px',
    bottom: '-4px',
    border: isSelected && !isEditing ? '2px solid #D97757' : '2px solid transparent',
    borderRadius: '6px',
    cursor: isEditing ? 'text' : 'move',
    pointerEvents: isEditing ? 'none' : 'auto'
  };

  return (
    <div ref={elementRef} style={containerStyle}>
      {/* Edge for dragging */}
      {!isEditing && (
        <div
          style={edgeStyle}
          onMouseDown={handleEdgeMouseDown}
        />
      )}

      {/* Corner Handles */}
      {isSelected && !isEditing && (
        <>
          {/* Move handle - Top Left */}
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              left: '-12px',
              width: '24px',
              height: '24px',
              background: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'move',
              zIndex: 102,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseDown={handleEdgeMouseDown}
            title="Move"
          >
            <Move size={14} color="white" />
          </div>

          {/* Rotate handle - Bottom Left */}
          <div
            style={{
              position: 'absolute',
              bottom: '-12px',
              left: '-12px',
              width: '24px',
              height: '24px',
              background: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              zIndex: 102,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseDown={handleRotateStart}
            title="Rotate"
          >
            <RotateCw size={14} color="white" />
          </div>

          {/* Delete handle - Top Right */}
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              right: '-12px',
              width: '24px',
              height: '24px',
              background: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 102,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
            title="Delete"
          >
            <Trash2 size={14} color="white" />
          </div>

          {/* Width resize handle - Right edge */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '-6px',
              width: '12px',
              height: '24px',
              background: '#D97757',
              borderRadius: '3px',
              cursor: 'e-resize',
              zIndex: 101,
              transform: 'translateY(-50%)'
            }}
            onMouseDown={handleResizeStart}
            title="Resize Width"
          />

          {/* Height resize handle - Bottom edge */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              width: '24px',
              height: '12px',
              background: '#D97757',
              borderRadius: '3px',
              cursor: 's-resize',
              zIndex: 101,
              transform: 'translateX(-50%)'
            }}
            onMouseDown={handleResizeHeightStart}
            title="Resize Height"
          />

          {/* TTS button */}
          <button
            style={{
              position: 'absolute',
              top: '-28px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#3b82f6',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 101
            }}
            onClick={speak}
          >
            <Volume2 size={14} />
          </button>
        </>
      )}

      {/* Text Content */}
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        style={{
          ...contentStyle,
          backgroundColor: element.backgroundColor || 'transparent',
          cursor: isEditing ? 'text' : 'pointer'
        }}
        onFocus={handleContentFocus}
        onBlur={handleContentBlur}
        onMouseDown={handleContentClick}
      >
        {element.content || t('placeholder_text_input')}
      </div>
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
          <button className="delete-element-btn" onClick={(e) => { e.stopPropagation(); onDelete(element.id) }}><Trash2 size={14} /></button>
          <div className="resize-handle" onMouseDown={handleResizeStart} />
        </>
      )}
    </div>
  );
}
