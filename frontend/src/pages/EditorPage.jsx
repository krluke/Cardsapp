import { useReducer, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import './Editor.css';

import { EditorToolbar } from './editor/EditorToolbar';
import { EditorSidebar } from './editor/EditorSidebar';
import { CardCanvas } from './editor/CardCanvas';
import { FloatingTextToolbar } from './editor/FloatingTextToolbar';

const API_BASE = '/api';

const TEMPLATES = {
  blank: { front: [], back: [] },
  title_subtitle: {
    front: [
      { id: '1', type: 'text', content: 'タイトル', left: 10, top: 15, width: 80, fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
      { id: '2', type: 'text', content: 'サブタイトル', left: 10, top: 50, width: 80, fontSize: 16, textAlign: 'center' }
    ],
    back: []
  },
  qa: {
    front: [
      { id: '1', type: 'text', content: 'Q: 質問', left: 5, top: 10, width: 90, fontSize: 20, fontWeight: 'bold' }
    ],
    back: [
      { id: '2', type: 'text', content: 'A: 回答', left: 5, top: 10, width: 90, fontSize: 18 }
    ]
  },
  cloze: {
    front: [
      { id: '1', type: 'text', content: '[...] の部分は何か？', left: 10, top: 40, width: 80, fontSize: 20, textAlign: 'center' }
    ],
    back: [
      { id: '2', type: 'text', content: '正解: [答え]', left: 10, top: 40, width: 80, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#D97757' }
    ]
  },
  image_focus: {
    front: [
      { id: '1', type: 'text', content: 'この画像は何？', left: 30, top: 10, width: 40, fontSize: 18, textAlign: 'center' },
      { id: '2', type: 'image', src: 'https://via.placeholder.com/150', left: 25, top: 30, width: 50, height: 40 }
    ],
    back: [
      { id: '3', type: 'text', content: '正解: [画像の説明]', left: 10, top: 40, width: 80, fontSize: 20, textAlign: 'center' }
    ]
  }
};

function t(key) {
  const lang = localStorage.getItem('app-lang') || 'ja';
  const translations = {
    ja: {
      editor_title: 'カードエディタ',
      btn_home: 'ホームに戻る',
      btn_add_text: 'テキスト追加',
      btn_bold: '太字',
      btn_underline: '下線',
      btn_italic: '斜体',
      label_bg_color: '背景色:',
      label_text_color: 'テキスト色:',
      btn_template: 'テンプレート',
      confirm_discard_exit: '変更が保存されていない可能性があります。退出しますか？',
      confirm_discard_card: 'このカードを削除しますか？',
      btn_save: '保存',
      placeholder_text_input: 'テキストを入力...',
    },
    en: {
      editor_title: 'Card Editor',
      btn_home: 'Go Home',
      btn_add_text: 'Add Text',
      btn_bold: 'Bold',
      btn_underline: 'Underline',
      btn_italic: 'Italic',
      label_bg_color: 'Bg Color:',
      label_text_color: 'Text Color:',
      btn_template: 'Template',
      confirm_discard_exit: 'Changes may not be saved. Really exit?',
      confirm_discard_card: 'Delete this card?',
      btn_save: 'Save',
      placeholder_text_input: 'Click and type...',
    }
  };
  return translations[lang]?.[key] || key;
}

function editorReducer(state, action) {
  const pushHistory = (state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    return {
      ...state,
      history: [...newHistory, state.cards],
      historyIndex: newHistory.length,
    };
  };

  switch (action.type) {
    case 'UNDO': {
      if (state.historyIndex < 0) return state;
      const prevCards = state.history[state.historyIndex];
      return {
        ...state,
        history: [...state.history, state.cards], // push current to redo
        cards: prevCards,
        historyIndex: state.historyIndex - 1,
      };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextCards = state.history[state.historyIndex + 1];
      return {
        ...state,
        history: state.history.slice(0, state.historyIndex + 1), // remove redo stack
        cards: nextCards,
        historyIndex: state.historyIndex + 1,
      };
    }
    case 'SET_CARDS':
      return { ...state, cards: action.payload, loading: false, history: [], historyIndex: -1 };

    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: action.payload, selectedElement: null };
    case 'SET_FLIPPED':
      return { ...state, isFlipped: action.payload, selectedElement: null };
    case 'SET_SELECTED_ELEMENT':
      return { ...state, selectedElement: action.payload };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SHOW_TEMPLATE_MENU':
      return { ...state, showTemplateMenu: action.payload };
    case 'SET_IMAGE_URL':
      return { ...state, imageUrl: action.payload };
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.payload };
    case 'SET_FONT_FAMILY':
      return { ...state, fontFamily: action.payload };
    case 'SET_TEXT_COLOR':
      return { ...state, textColor: action.payload };
    case 'SET_TEXT_BG_COLOR':
      return { ...state, textBoxBgColor: action.payload };
    case 'SET_TEXT_HIGHLIGHT_COLOR':
      return { ...state, textHighlightColor: action.payload };
    case 'UPDATE_ELEMENT': {
      const stateWithHistory = pushHistory(state);
      const { elementId, updates } = action.payload;
      const newCards = [...stateWithHistory.cards];
      const card = { ...newCards[stateWithHistory.currentIndex] };
      const elements = stateWithHistory.isFlipped ? [...card.back] : [...card.front];
      const updatedElements = elements.map(el => el.id === elementId ? { ...el, ...updates } : el);
      
      if (stateWithHistory.isFlipped) card.back = updatedElements;
      else card.front = updatedElements;
      
      newCards[stateWithHistory.currentIndex] = card;
      return { ...stateWithHistory, cards: newCards };
    }
    case 'MOVE_ELEMENT': {
      const stateWithHistory = pushHistory(state);
      const { elementId, direction } = action.payload;
      const newCards = [...stateWithHistory.cards];
      const card = { ...newCards[stateWithHistory.currentIndex] };
      const elements = stateWithHistory.isFlipped ? [...card.back] : [...card.front];
      const index = elements.findIndex(el => el.id === elementId);
      if (index === -1) return state;
      
      const [element] = elements.splice(index, 1);
      if (direction === 'front') elements.push(element);
      else elements.unshift(element);
      
      if (stateWithHistory.isFlipped) card.back = elements;
      else card.front = elements;
      
      newCards[stateWithHistory.currentIndex] = card;
      return { ...stateWithHistory, cards: newCards };
    }
    case 'ADD_TEXT': {
      const stateWithHistory = pushHistory(state);
      const { x, y, fontSize, textColor, bgColor, highlightColor } = action.payload;
      const newElement = {
        id: `text-${Date.now()}`,
        type: 'text',
        content: '',
        left: x,
        top: y,
        width: 40,
        height: 'auto',
        fontSize,
        fontWeight: 'normal',
        fontFamily: 'sans-serif',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        color: textColor,
        backgroundColor: bgColor || 'transparent',
        highlightColor: highlightColor || 'transparent',
        rotation: 0
      };
      const newCards = [...stateWithHistory.cards];
      const card = { ...newCards[stateWithHistory.currentIndex] };
      const elements = stateWithHistory.isFlipped ? [...card.back] : [...card.front];

      if (stateWithHistory.isFlipped) card.back = [...elements, newElement];
      else card.front = [...elements, newElement];

      newCards[stateWithHistory.currentIndex] = card;
      return { ...stateWithHistory, cards: newCards, selectedElement: newElement.id, textToolActive: false };
    }
    case 'DUPLICATE_ELEMENT': {
      const stateWithHistory = pushHistory(state);
      const { elementId } = action.payload;
      const newCards = [...stateWithHistory.cards];
      const card = { ...newCards[stateWithHistory.currentIndex] };
      const elements = stateWithHistory.isFlipped ? [...card.back] : [...card.front];
      const element = elements.find(el => el.id === elementId);
      if (!element) return state;
      
      const newElement = { ...element, id: `text-${Date.now()}`, left: element.left + 5, top: element.top + 5 };
      if (stateWithHistory.isFlipped) card.back = [...elements, newElement];
      else card.front = [...elements, newElement];
      
      newCards[stateWithHistory.currentIndex] = card;
      return { ...stateWithHistory, cards: newCards, selectedElement: newElement.id };
    }
    case 'ADD_IMAGE': {
      const stateWithHistory = pushHistory(state);
      const { imageUrl } = action.payload;
      const newElement = { id: `img-${Date.now()}`, type: 'image', src: imageUrl, left: 20, top: 20, width: 50, height: 30 };
      const newCards = [...stateWithHistory.cards];
      const card = { ...newCards[stateWithHistory.currentIndex] };
      const elements = stateWithHistory.isFlipped ? [...card.back] : [...card.front];
      
      if (stateWithHistory.isFlipped) card.back = [...elements, newElement];
      else card.front = [...elements, newElement];
      
      newCards[stateWithHistory.currentIndex] = card;
      return { ...stateWithHistory, cards: newCards, selectedElement: newElement.id, imageUrl: '' };
    }
    case 'DELETE_ELEMENT': {
      const stateWithHistory = pushHistory(state);
      const { elementId } = action.payload;
      const newCards = [...stateWithHistory.cards];
      const card = { ...newCards[stateWithHistory.currentIndex] };
      const elements = stateWithHistory.isFlipped ? [...card.back] : [...card.front];
      const filteredElements = elements.filter(el => el.id !== elementId);
      
      if (stateWithHistory.isFlipped) card.back = filteredElements;
      else card.front = filteredElements;
      
      newCards[stateWithHistory.currentIndex] = card;
      return { 
        ...stateWithHistory, 
        cards: newCards, 
        selectedElement: stateWithHistory.selectedElement === elementId ? null : stateWithHistory.selectedElement 
      };
    }
    case 'UPDATE_BG_COLOR': {
      const stateWithHistory = pushHistory(state);
      const { color } = action.payload;
      const newCards = [...stateWithHistory.cards];
      const card = { ...newCards[stateWithHistory.currentIndex] };
      if (stateWithHistory.isFlipped) card.backBg = color;
      else card.frontBg = color;
      newCards[stateWithHistory.currentIndex] = card;
      return { ...stateWithHistory, cards: newCards };
    }
    case 'ADD_CARD': {
      const stateWithHistory = pushHistory(state);
      const newCard = { front: [], back: [], frontBg: '#ffffff', backBg: '#ffffff' };
      return { 
        ...stateWithHistory, 
        cards: [...stateWithHistory.cards, newCard], 
        currentIndex: stateWithHistory.cards.length, 
        isFlipped: false, 
        selectedElement: null 
      };
    }
    case 'DELETE_CARD': {
      const stateWithHistory = pushHistory(state);
      const newCards = stateWithHistory.cards.filter((_, i) => i !== stateWithHistory.currentIndex);
      return { 
        ...stateWithHistory, 
        cards: newCards, 
        currentIndex: Math.max(0, stateWithHistory.currentIndex - 1), 
        selectedElement: null 
      };
    }
    case 'APPLY_TEMPLATE': {
      const stateWithHistory = pushHistory(state);
      const { templateKey } = action.payload;
      const template = TEMPLATES[templateKey];
      const newCards = [...stateWithHistory.cards];
      newCards[stateWithHistory.currentIndex] = { ...template, frontBg: '#ffffff', backBg: '#ffffff' };
      return { ...stateWithHistory, cards: newCards, showTemplateMenu: false, selectedElement: null };
    }
    case 'DUPLICATE_CARD': {
      const stateWithHistory = pushHistory(state);
      const currentCard = stateWithHistory.cards[stateWithHistory.currentIndex];
      const newCard = JSON.parse(JSON.stringify(currentCard));
      const newCards = [...stateWithHistory.cards];
      newCards.splice(stateWithHistory.currentIndex + 1, 0, newCard);
      return { ...stateWithHistory, cards: newCards, currentIndex: stateWithHistory.currentIndex + 1, selectedElement: null };
    }
    case 'UPDATE_TAGS': {
      const stateWithHistory = pushHistory(state);
      const newCards = [...stateWithHistory.cards];
      newCards[stateWithHistory.currentIndex] = { ...newCards[stateWithHistory.currentIndex], tags: action.payload.tags };
      return { ...stateWithHistory, cards: newCards };
    }
    default:
      return state;
  }
}

const initialState = {
  cards: [{ front: [], back: [], frontBg: '#ffffff', backBg: '#ffffff' }],
  history: [],
  historyIndex: -1,
  currentIndex: 0,
  isFlipped: false,
  selectedElement: null,
  saving: false,
  loading: true,
  showTemplateMenu: false,
  imageUrl: '',
  fontSize: 16,
  fontFamily: 'sans-serif',
  textColor: '#000000',
  textBoxBgColor: 'transparent',
  textHighlightColor: 'transparent',
};

export default function EditorPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(editorReducer, initialState);

  const session = JSON.parse(localStorage.getItem('session') || '{}');
  const user = session.user;

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (!user) { navigate('/home'); return; }
    loadData();
  }, [folderId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveCards();
    }, 3000);
    return () => clearTimeout(timer);
  }, [state.cards]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && state.selectedElement) {
        dispatch({ type: 'DELETE_ELEMENT', payload: { elementId: state.selectedElement } });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCards();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && state.selectedElement) {
        e.preventDefault();
        dispatch({ type: 'DUPLICATE_ELEMENT', payload: { elementId: state.selectedElement } });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedElement]);

  const getCsrfToken = () => session.csrfToken || '';

  const loadData = async () => {
    try {
      const res = await fetch(`${API_BASE}/cards/load/${folderId}?userEmail=${user.email || user.id}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const parsedCards = data.map(card => ({
          front: parseElements(card.front),
          back: parseElements(card.back),
          frontBg: card.frontBg || '#ffffff',
          backBg: card.backBg || '#ffffff',
          tags: card.tags || ''
        }));
        dispatch({ type: 'SET_CARDS', payload: parsedCards });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (e) { console.error(e); dispatch({ type: 'SET_LOADING', payload: false }); }
  };

  const parseElements = (html) => {
    if (!html) return [];
    const elements = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Check if it's old Polotno format (uses pixels instead of %)
    const hasPxFormat = html.includes('left:') && html.includes('px') && !html.includes('position:absolute');
    
    if (hasPxFormat) {
      // Old Polotno format - parse text elements
      doc.querySelectorAll('.draggable-text, [data-name]').forEach((el, idx) => {
        const style = el.getAttribute('style') || '';
        const textEl = el.querySelector('.text-content');
        const content = textEl ? textEl.textContent : el.textContent;
        
        if (!content || content.trim() === '') return;
        
        const leftMatch = style.match(/left:\s*(\d+)px/);
        const topMatch = style.match(/top:\s*(\d+)px/);
        const widthMatch = style.match(/width:\s*(\d+)px/);
        const fontSizeMatch = style.match(/font-size:\s*(\d+)px/);
        
        elements.push({
          id: `text-${Date.now()}-${idx}`,
          type: 'text',
          content: content.trim(),
          left: leftMatch ? Math.round((parseInt(leftMatch[1]) / 800) * 100) : 10,
          top: topMatch ? Math.round((parseInt(topMatch[1]) / 600) * 100) : 20,
          width: widthMatch ? Math.round((parseInt(widthMatch[1]) / 800) * 100) : 40,
          fontSize: parseInt(fontSizeMatch?.[1] || '16'),
          fontFamily: 'sans-serif',
          fontWeight: 'normal',
          color: '#000000'
        });
      });
      
      // Parse images
      doc.querySelectorAll('.draggable-image').forEach((el, idx) => {
        const img = el.querySelector('img');
        if (!img) return;
        
        const style = el.getAttribute('style') || '';
        const leftMatch = style.match(/left:\s*(\d+)px/);
        const topMatch = style.match(/top:\s*(\d+)px/);
        const widthMatch = style.match(/width:\s*(\d+)px/);
        const heightMatch = style.match(/height:\s*(\d+)px/);
        
        elements.push({
          id: `img-${Date.now()}-${idx}`,
          type: 'image',
          src: img.src,
          left: leftMatch ? Math.round((parseInt(leftMatch[1]) / 800) * 100) : 20,
          top: topMatch ? Math.round((parseInt(topMatch[1]) / 600) * 100) : 20,
          width: widthMatch ? Math.round((parseInt(widthMatch[1]) / 800) * 100) : 50,
          height: heightMatch ? Math.round((parseInt(heightMatch[1]) / 600) * 100) : 30
        });
      });
    } else {
      // New format with percentages
      doc.querySelectorAll('.draggable-text, [style*="position: absolute"]').forEach((el, idx) => {
        const style = el.getAttribute('style') || '';
        const isText = !el.querySelector('img');
        if (isText) {
          const textEl = el.querySelector('.text-content') || el;
          elements.push({
            id: `text-${Date.now()}-${idx}`,
            type: 'text',
            content: textEl.innerText || '',
            left: parseInt(style.match(/left:\s*(\d+)%/)?.[1] || '10'),
            top: parseInt(style.match(/top:\s*(\d+)%/)?.[1] || '20'),
            width: parseInt(style.match(/width:\s*(\d+)%/)?.[1] || '80'),
            fontSize: parseInt(style.match(/font-size:\s*(\d+)px/)?.[1] || '16'),
            fontFamily: style.match(/font-family:\s*([^;]+)/)?.[1] || 'sans-serif',
            fontWeight: style.match(/font-weight:\s*(\w+)/)?.[1] || 'normal',
            color: '#000000'
          });
        }
      });
      
      doc.querySelectorAll('img').forEach((img, idx) => {
        const parent = img.closest('[style*="position"]') || img.parentElement;
        const style = parent?.getAttribute('style') || '';
        elements.push({
          id: `img-${Date.now()}-${idx}`,
          type: 'image',
          src: img.src,
          left: parseInt(style.match(/left:\s*(\d+)%/)?.[1] || '20'),
          top: parseInt(style.match(/top:\s*(\d+)%/)?.[1] || '20'),
          width: parseInt(style.match(/width:\s*(\d+)%/)?.[1] || '50'),
          height: parseInt(style.match(/height:\s*(\d+)%/)?.[1] || '30')
        });
      });
    }
    return elements;
  };

  const serializeElements = (elements) => {
    return elements.map(el => {
      if (el.type === 'text') {
        return `<div class="draggable-text" style="position:absolute;left:${el.left}%;top:${el.top}%;width:${el.width}%;font-size:${el.fontSize}px;font-family:${el.fontFamily};font-weight:${el.fontWeight};color:${el.color};"><div class="text-content">${el.content}</div></div>`;
      }
      if (el.type === 'image') {
        return `<div class="draggable-image" style="position:absolute;left:${el.left}%;top:${el.top}%;width:${el.width}%;height:${el.height}%;"><img src="${el.src}" style="width:100%;height:100%;object-fit:contain;" /></div>`;
      }
      return '';
    }).join('');
  };

  const currentCard = state.cards[state.currentIndex];
  const currentElements = state.isFlipped ? currentCard?.back || [] : currentCard?.front || [];
  const currentBg = state.isFlipped ? currentCard?.backBg : currentCard?.frontBg;
  const currentTags = currentCard?.tags || '';

const addText = (x = 30, y = 40) => {
  dispatch({
    type: 'ADD_TEXT',
    payload: {
      x,
      y,
      fontSize: state.fontSize,
      textColor: state.textColor,
      bgColor: state.textBoxBgColor,
      highlightColor: state.textHighlightColor
    }
  });
};

  const addImage = () => {
    if (!state.imageUrl.trim()) return;
    dispatch({ type: 'ADD_IMAGE', payload: { imageUrl: state.imageUrl } });
  };

  const uploadImage = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API_BASE}/cards/upload`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': getCsrfToken() },
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        dispatch({ type: 'ADD_IMAGE', payload: { imageUrl: data.url } });
      } else {
        alert('Upload failed');
      }
    } catch (e) {
      console.error(e);
      alert('Upload error');
    }
  };


  const updateElement = (elementId, updates) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId, updates } });
  };

  const updateTags = (tags) => {
    // Tags are handled per card. We'll assume the current card should be updated.
    const newCards = [...state.cards];
    newCards[state.currentIndex] = { ...newCards[state.currentIndex], tags: tags };
    // We need a new reducer action for this.
    dispatch({ type: 'UPDATE_TAGS', payload: { tags } });
  };

  const deleteElement = (elementId) => {
    dispatch({ type: 'DELETE_ELEMENT', payload: { elementId } });
  };

  const applyFormat = (format) => {
    if (!state.selectedElement) return;
    const element = currentElements.find(el => el.id === state.selectedElement);
    if (!element || element.type !== 'text') return;
    const updates = {};
    if (format === 'bold') updates.fontWeight = element.fontWeight === 'bold' ? 'normal' : 'bold';
    if (format === 'italic') updates.fontStyle = element.fontStyle === 'italic' ? 'normal' : 'italic';
    if (format === 'underline') updates.textDecoration = element.textDecoration === 'underline' ? 'none' : 'underline';
    if (format === 'left') updates.textAlign = 'left';
    if (format === 'center') updates.textAlign = 'center';
    if (format === 'right') updates.textAlign = 'right';
    dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: state.selectedElement, updates } });
  };

  const setFontFamily = (family) => {
    dispatch({ type: 'SET_FONT_FAMILY', payload: family });
    if (state.selectedElement) {
      const element = currentElements.find(el => el.id === state.selectedElement);
      if (element && element.type === 'text') {
        dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: state.selectedElement, updates: { fontFamily: family } } });
      }
    }
  };

  const updateBgColor = (color) => {
    dispatch({ type: 'UPDATE_BG_COLOR', payload: { color } });
  };

  const saveCards = async () => {
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const serializedCards = state.cards.map(card => ({
        front: serializeElements(card.front),
        back: serializeElements(card.back),
        frontBg: card.frontBg,
        backBg: card.backBg,
        tags: card.tags || ''
      }));
      const res = await fetch(`${API_BASE}/cards/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        body: JSON.stringify({ folderId: parseInt(folderId), userEmail: user.email || user.id, cards: serializedCards })
      });
    } catch (e) { console.error('Save error:', e); }
    finally { dispatch({ type: 'SET_SAVING', payload: false }); }
  };

  const goToHome = () => { navigate('/home'); };

  if (state.loading) return <div className="page-container">Loading...</div>;

  const selectedEl = currentElements.find(el => el.id === state.selectedElement);
  const isTextSelected = selectedEl?.type === 'text';

  return (
    <div className="editor-container">
      <EditorToolbar
        onGoHome={goToHome}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onAddText={addText}
        currentBg={currentBg}
        updateBgColor={updateBgColor}
        imageUrl={state.imageUrl}
        setImageUrl={(val) => dispatch({ type: 'SET_IMAGE_URL', payload: val })}
        onAddImage={addImage}
        onUploadImage={uploadImage}
        showTemplateMenu={state.showTemplateMenu}
        setShowTemplateMenu={(val) => dispatch({ type: 'SET_SHOW_TEMPLATE_MENU', payload: val })}
        applyTemplate={(key) => dispatch({ type: 'APPLY_TEMPLATE', payload: { templateKey: key } })}
        onSave={saveCards}
        saving={state.saving}
        t={t}
      />
      <FloatingTextToolbar
        element={selectedEl}
        isVisible={isTextSelected}
        onMoveElement={(direction) => dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: state.selectedElement, direction } })}
        onFormatChange={applyFormat}
        onFontSizeChange={(val) => {
          dispatch({ type: 'SET_FONT_SIZE', payload: val });
          if (state.selectedElement) updateElement(state.selectedElement, { fontSize: val });
        }}
        onFontFamilyChange={setFontFamily}
        onTextColorChange={(val) => {
          dispatch({ type: 'SET_TEXT_COLOR', payload: val });
          if (state.selectedElement && isTextSelected) updateElement(state.selectedElement, { color: val });
        }}
        onBackgroundColorChange={(val) => {
          dispatch({ type: 'SET_TEXT_BG_COLOR', payload: val });
          if (state.selectedElement && isTextSelected) updateElement(state.selectedElement, { backgroundColor: val });
        }}
        fontSize={state.fontSize}
        fontFamily={state.fontFamily}
        textColor={state.textColor}
        backgroundColor={selectedEl?.backgroundColor || 'transparent'}
        t={t}
      />
      <div className="editor-main">
        <EditorSidebar 
          cards={state.cards} 
          currentIndex={state.currentIndex} 
          onSelectCard={(idx) => {
            dispatch({ type: 'SET_CURRENT_INDEX', payload: idx });
            dispatch({ type: 'SET_FLIPPED', payload: false });
          }} 
          onAddCard={() => dispatch({ type: 'ADD_CARD' })} 
        />
        <div className="card-area">
        <CardCanvas
          elements={currentElements}
          bgColor={currentBg}
          isSelected={state.selectedElement}
          onSelect={(id) => dispatch({ type: 'SET_SELECTED_ELEMENT', payload: id })}
          onUpdate={updateElement}
          onDelete={deleteElement}
          t={t}
        />
          <div className="card-nav">
            <button onClick={() => dispatch({ type: 'SET_CURRENT_INDEX', payload: Math.max(0, state.currentIndex - 1) })} disabled={state.currentIndex === 0}><ChevronLeft size={24} /></button>
            <span>{state.currentIndex + 1} / {state.cards.length}</span>
            <button onClick={() => dispatch({ type: 'SET_CURRENT_INDEX', payload: Math.min(state.cards.length - 1, state.currentIndex + 1) })} disabled={state.currentIndex === state.cards.length - 1}><ChevronRight size={24} /></button>
            <button className="flip-btn" onClick={() => dispatch({ type: 'SET_FLIPPED', payload: !state.isFlipped })} >Flip</button>
            <button className="toolbar-btn" onClick={() => dispatch({ type: 'DUPLICATE_CARD' })} title="Duplicate Card"><Copy size={18} /></button>
            <button className="delete-btn-nav" onClick={() => { if (state.cards.length > 1 && confirm(t('confirm_discard_card'))) dispatch({ type: 'DELETE_CARD' }) }} disabled={state.cards.length === 1}><Trash2 size={18} /></button>
          </div>
          <div className="tags-input-container" style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Tags:</label>
            <input 
              type="text" 
              className="toolbar-select" 
              placeholder="Comma separated tags..." 
              value={currentTags} 
              onChange={(e) => updateTags(e.target.value)}
              style={{ width: '200px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
