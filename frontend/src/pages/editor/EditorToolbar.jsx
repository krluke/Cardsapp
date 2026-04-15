import { 
  ArrowLeft, Save, Type, Image, Layout,
  Copy, Undo, Redo, Layers, Upload
} from 'lucide-react';

export function EditorToolbar({ 
  onGoHome, onUndo, onRedo, onAddText,
  currentBg, updateBgColor, imageUrl, setImageUrl, onAddImage, 
  showTemplateMenu, setShowTemplateMenu, applyTemplate, onSave, saving, 
  selectedEl, t, onMoveElement, onUploadImage
}) {
  return (
    <header className="editor-header">
      <button className="toolbar-btn" onClick={onGoHome}><ArrowLeft size={18} /></button>
      
      <div className="toolbar-group" style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--border-color)', paddingRight: '8px', marginRight: '8px' }}>
        <button className="toolbar-btn" onClick={onUndo}><Undo size={18} /></button>
        <button className="toolbar-btn" onClick={onRedo}><Redo size={18} /></button>
      </div>
      
      <button 
        className="toolbar-btn" 
        onClick={() => onAddText(30, 40)}
        title={t('btn_add_text')}
      >
        <Type size={18} />
        <span>{t('btn_add_text')}</span>
      </button>
      
      <div className="toolbar-group" style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--border-color)', paddingRight: '8px', marginRight: '8px' }}>
        <button className="toolbar-btn" onClick={() => onMoveElement('front')} disabled={!selectedEl} title="Bring to Front"><Layers size={18} /></button>
        <button className="toolbar-btn" onClick={() => onMoveElement('back')} disabled={!selectedEl} title="Send to Back"><Layers size={18} style={{ transform: 'rotate(180deg)' }} /></button>
      </div>
      
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
