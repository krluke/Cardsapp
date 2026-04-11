import { 
  ArrowLeft, Save, Plus, Type, Bold, Italic, Underline, Image, Layout, 
  AlignLeft, AlignCenter, AlignRight, Copy, Undo, Redo, Layers, Upload 
} from 'lucide-react';

export function EditorToolbar({ 
  onGoHome, onUndo, onRedo, onAddText, applyFormat, fontSize, setFontSize, 
  fontFamily, setFontFamily, textColor, setTextColor, currentBg, updateBgColor, 
  imageUrl, setImageUrl, onAddImage, showTemplateMenu, setShowTemplateMenu, 
  applyTemplate, onPreview, onSave, saving, isTextSelected, selectedEl, t,
  onMoveElement, onUploadImage
}) {
  return (
    <header className="editor-header">
      <button className="toolbar-btn" onClick={onGoHome}><ArrowLeft size={18} /></button>
      <div className="toolbar-group" style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--border-color)', paddingRight: '8px', marginRight: '8px' }}>
        <button className="toolbar-btn" onClick={onUndo}><Undo size={18} /></button>
        <button className="toolbar-btn" onClick={onRedo}><Redo size={18} /></button>
      </div>
      <button className="toolbar-btn" onClick={() => onAddText(10, 20)}><Type size={18} /><span>{t('btn_add_text')}</span></button>
      <button className={`toolbar-btn ${isTextSelected && selectedEl?.fontWeight === 'bold' ? 'active' : ''}`} onClick={() => applyFormat('bold')} disabled={!isTextSelected}><Bold size={18} /></button>
      <button className={`toolbar-btn ${isTextSelected && selectedEl?.fontStyle === 'italic' ? 'active' : ''}`} onClick={() => applyFormat('italic')} disabled={!isTextSelected}><Italic size={18} /></button>
      <button className={`toolbar-btn ${isTextSelected && selectedEl?.textDecoration === 'underline' ? 'active' : ''}`} onClick={() => applyFormat('underline')} disabled={!isTextSelected}><Underline size={18} /></button>
      <button className={`toolbar-btn ${isTextSelected && selectedEl?.textAlign === 'left' ? 'active' : ''}`} onClick={() => applyFormat('left')} disabled={!isTextSelected}><AlignLeft size={18} /></button>
      <button className={`toolbar-btn ${isTextSelected && selectedEl?.textAlign === 'center' ? 'active' : ''}`} onClick={() => applyFormat('center')} disabled={!isTextSelected}><AlignCenter size={18} /></button>
      <button className={`toolbar-btn ${isTextSelected && selectedEl?.textAlign === 'right' ? 'active' : ''}`} onClick={() => applyFormat('right')} disabled={!isTextSelected}><AlignRight size={18} /></button>
      <div className="toolbar-group" style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--border-color)', paddingRight: '8px', marginRight: '8px' }}>
        <button className="toolbar-btn" onClick={() => onMoveElement('front')} disabled={!isTextSelected} title="Bring to Front"><Layers size={18} /></button>
        <button className="toolbar-btn" onClick={() => onMoveElement('back')} disabled={!isTextSelected} title="Send to Back"><Layers size={18} style={{ transform: 'rotate(180deg)' }} /></button>
      </div>
      <select className="toolbar-select" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))}>
        <option value="12">12px</option><option value="16">16px</option><option value="20">20px</option><option value="28">28px</option><option value="36">36px</option>
      </select>
      <select className="toolbar-select" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
        <option value="sans-serif">Sans Serif</option>
        <option value="serif">Serif</option>
        <option value="monospace">Monospace</option>
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Georgia">Georgia</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier New</option>
        <option value="Verdana">Verdana</option>
        <option value="Impact">Impact</option>
      </select>
      <input type="color" className="color-picker" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
      <div className="color-picker-group"><label>{t('label_bg_color')}</label><input type="color" value={currentBg} onChange={(e) => updateBgColor(e.target.value)} /></div>
      <div className="image-input-group" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <label className="toolbar-btn" style={{ cursor: 'pointer', padding: '8px' }}>
          <Upload size={18} />
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onUploadImage(e.target.files[0])} />
        </label>
        <input type="text" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAddImage()} />
      </div>
      <div className="template-dropdown">
        <button className="toolbar-btn" onClick={() => setShowTemplateMenu(!showTemplateMenu)}><Layout size={18} /><span>{t('btn_template')}</span></button>
        {showTemplateMenu && (
          <div className="dropdown-menu">
            <button onClick={() => applyTemplate('blank')}>Blank</button>
            <button onClick={() => applyTemplate('title_subtitle')}>Title + Subtitle</button>
            <button onClick={() => applyTemplate('qa')}>Q&A</button>
            <button onClick={() => applyTemplate('cloze')}>Cloze Deletion</button>
            <button onClick={() => applyTemplate('image_focus')}>Image Focus</button>
          </div>
        )}
      </div>
      <div className="spacer"></div>
      <button className="save-btn" onClick={onSave} disabled={saving}><Save size={18} />{saving ? '...' : t('btn_save')}</button>
    </header>
  );
}
