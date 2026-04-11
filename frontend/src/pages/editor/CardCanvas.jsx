import { useRef } from 'react';
import { DraggableText, DraggableImage } from './DraggableElement';

export function CardCanvas({ elements, bgColor, isSelected, onSelect, onAddText, onUpdate, onDelete, t }) {
  const canvasRef = useRef(null);

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onAddText(x, y);
    }
  };

  return (
    <div ref={canvasRef} className="card-canvas" style={{ backgroundColor: bgColor }} onClick={handleCanvasClick}>
      {elements.map(el => {
        if (el.type === 'text') return <DraggableText key={el.id} element={el} isSelected={isSelected === el.id} onSelect={onSelect} onUpdate={onUpdate} onDelete={onDelete} t={t} />;
        if (el.type === 'image') return <DraggableImage key={el.id} element={el} isSelected={isSelected === el.id} onSelect={onSelect} onUpdate={onUpdate} onDelete={onDelete} />;
        return null;
      })}
      <div className="canvas-hint">{t('btn_add_text')}</div>
    </div>
  );
}
