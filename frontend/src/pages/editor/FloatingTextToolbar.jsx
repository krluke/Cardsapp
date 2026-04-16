import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';

export function FloatingTextToolbar({
  element,
  isVisible,
  onFormatChange,
  onFontSizeChange,
  onFontFamilyChange,
  onTextColorChange,
  onBackgroundColorChange,
  fontSize,
  fontFamily,
  textColor,
  backgroundColor,
  t
}) {
  if (!isVisible || !element) return null;

  const handleBold = () => onFormatChange('bold');
  const handleItalic = () => onFormatChange('italic');
  const handleUnderline = () => onFormatChange('underline');
  const handleAlignLeft = () => onFormatChange('left');
  const handleAlignCenter = () => onFormatChange('center');
  const handleAlignRight = () => onFormatChange('right');

  return (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        flexWrap: 'wrap'
      }}
    >
      {/* Style Controls */}
      <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--border-color)', paddingRight: '8px' }}>
        <button
          className={`toolbar-btn ${element.fontWeight === 'bold' ? 'active' : ''}`}
          onClick={handleBold}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          className={`toolbar-btn ${element.fontStyle === 'italic' ? 'active' : ''}`}
          onClick={handleItalic}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          className={`toolbar-btn ${element.textDecoration === 'underline' ? 'active' : ''}`}
          onClick={handleUnderline}
          title="Underline"
        >
          <Underline size={16} />
        </button>
      </div>

      {/* Alignment Controls */}
      <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--border-color)', paddingRight: '8px' }}>
        <button
          className={`toolbar-btn ${element.textAlign === 'left' ? 'active' : ''}`}
          onClick={handleAlignLeft}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          className={`toolbar-btn ${element.textAlign === 'center' ? 'active' : ''}`}
          onClick={handleAlignCenter}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          className={`toolbar-btn ${element.textAlign === 'right' ? 'active' : ''}`}
          onClick={handleAlignRight}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
      </div>

      {/* Font Family */}
      <select
        className="toolbar-select"
        value={fontFamily}
        onChange={(e) => onFontFamilyChange(e.target.value)}
        style={{ fontSize: '13px' }}
      >
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

      {/* Font Size */}
      <select
        className="toolbar-select"
        value={fontSize}
        onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
        style={{ fontSize: '13px', width: '60px' }}
      >
        <option value="12">12px</option>
        <option value="16">16px</option>
        <option value="20">20px</option>
        <option value="28">28px</option>
        <option value="36">36px</option>
        <option value="48">48px</option>
        <option value="72">72px</option>
      </select>

{/* Color Controls */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Text</span>
      <input
        type="color"
        value={textColor}
        onChange={(e) => onTextColorChange(e.target.value)}
        title="Text Color"
        style={{ width: '28px', height: '28px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
      />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fill</span>
      <input
        type="color"
        value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
        onChange={(e) => onBackgroundColorChange(e.target.value)}
        title="Background Color"
        style={{ width: '28px', height: '28px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
      />
    </div>
  </div>
    </div>
  );
}
