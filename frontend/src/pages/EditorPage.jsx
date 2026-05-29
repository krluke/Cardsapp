import { useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import './Editor.css';

import { EditorToolbar } from './editor/EditorToolbar';
import { EditorSidebar } from './editor/EditorSidebar';
import { CardCanvas } from './editor/CardCanvas';
import { FloatingTextToolbar } from './editor/FloatingTextToolbar';
import { apiFetch, ApiError } from '@/lib/api';

const TEXT_DEFAULTS = {
  type: 'text',
  height: 'auto',
  fontSize: 16,
  fontFamily: 'sans-serif',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'left',
  color: '',
  backgroundColor: '',
  rotation: 0
};

const TEMPLATES = {
  blank: { front: [], back: [] },
  title_subtitle: {
    front: [
      { ...TEXT_DEFAULTS, id: '1', content: 'タイトル', left: 10, top: 15, width: 80, fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
      { ...TEXT_DEFAULTS, id: '2', content: 'サブタイトル', left: 10, top: 50, width: 80, fontSize: 16, textAlign: 'center' }
    ],
    back: []
  },
  qa: {
    front: [
      { ...TEXT_DEFAULTS, id: '1', content: 'Q: 質問', left: 5, top: 10, width: 90, fontSize: 20, fontWeight: 'bold' }
    ],
    back: [
      { ...TEXT_DEFAULTS, id: '2', content: 'A: 回答', left: 5, top: 10, width: 90, fontSize: 18 }
    ]
  },
  cloze: {
    front: [
      { ...TEXT_DEFAULTS, id: '1', content: '[...] の部分は何か？', left: 10, top: 40, width: 80, fontSize: 20, textAlign: 'center' }
    ],
    back: [
      { ...TEXT_DEFAULTS, id: '2', content: '正解: [答え]', left: 10, top: 40, width: 80, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#D97757' }
    ]
  },
  image_focus: {
    front: [
      { ...TEXT_DEFAULTS, id: '1', content: 'この画像は何？', left: 30, top: 10, width: 40, fontSize: 18, textAlign: 'center' },
      { id: '2', type: 'image', src: 'https://via.placeholder.com/150', left: 25, top: 30, width: 50, height: 40 }
    ],
    back: [
      { ...TEXT_DEFAULTS, id: '3', content: '正解: [画像の説明]', left: 10, top: 40, width: 80, fontSize: 20, textAlign: 'center' }
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
        history: [...state.history, state.cards],
        cards: prevCards,
        historyIndex: state.historyIndex - 1,
      };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextCards = state.history[state.historyIndex + 1];
      return {
        ...state,
        history: state.history.slice(0, state.historyIndex + 1),
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
      const { x, y, fontSize, textColor, bgColor } = action.payload;
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
        color: textColor || '',
        backgroundColor: bgColor || '',
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
      const newCard = { front: [], back: [], frontBg: '', backBg: '' };
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
      newCards[stateWithHistory.currentIndex] = { ...template, frontBg: '', backBg: '' };
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
  cards: [{ front: [], back: [], frontBg: '', backBg: '' }],
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
  textColor: '',
  textBoxBgColor: '',
};

export default function EditorPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(editorReducer, initialState);

  const loadingRef = useRef(false);
  const retryAfterRef = useRef(0);
  const saveRetryAfterRef = useRef(0);
  const savingRef = useRef(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('session') || '{}').user || null;
    } catch { return null; }
  }, []);

  const parseElements = (html) => {
    if (!html) return [];
    const elements = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const hasPxFormat = html.includes('left:') && html.includes('px') && !html.includes('position:absolute');

    if (hasPxFormat) {
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
          color: '',
        });
      });

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
      try {
        const textElements = doc.querySelectorAll('[style*="position"]');
        textElements.forEach((el) => {
          const style = el.getAttribute('style') || '';
          const isTextElement = !el.querySelector('img') && el.innerHTML && !el.querySelector('img');

          if (isTextElement && el.textContent && el.textContent.trim()) {
            const img = el.querySelector('img');
            if (img) return;

            const textContent = el.textContent;
            const rotationMatch = style.match(/transform:\s*rotate\((\d+)deg\)/);

            const leftMatch = style.match(/left:\s*(\d+(?:\.\d+)?)%/);
            const topMatch = style.match(/top:\s*(\d+(?:\.\d+)?)%/);
            const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)%/);
            const heightMatch = style.match(/height:\s*(\d+(?:\.\d+)?)%/);
            const fontSizeMatch = style.match(/font-size:\s*(\d+)px/);
            const fontFamilyMatch = style.match(/font-family:\s*"?([^";]+)"?/);
            const fontWeightMatch = style.match(/font-weight:\s*(\w+)/);
            const fontStyleMatch = style.match(/font-style:\s*(\w+)/);
            const textDecorationMatch = style.match(/text-decoration:\s*(\w+)/);
            const textAlignMatch = style.match(/text-align:\s*(\w+)/);
            const colorMatch = style.match(/(?:^|;\s*)color:\s*(#[0-9a-fA-F]+|rgb\([^)]+\))/);
            const bgColorMatch = style.match(/background-color:\s*(#[0-9a-fA-F]+|rgb\([^)]+\))/);

            elements.push({
              id: `text-${Date.now()}-${elements.length}`,
              type: 'text',
              content: textContent.trim(),
              left: leftMatch ? parseFloat(leftMatch[1]) : 10,
              top: topMatch ? parseFloat(topMatch[1]) : 20,
              width: widthMatch ? parseFloat(widthMatch[1]) : 40,
              height: heightMatch ? parseFloat(heightMatch[1]) : 'auto',
              fontSize: fontSizeMatch ? parseInt(fontSizeMatch[1]) : 16,
              fontFamily: fontFamilyMatch ? fontFamilyMatch[1].trim() : 'sans-serif',
              fontWeight: fontWeightMatch ? fontWeightMatch[1] : 'normal',
              fontStyle: fontStyleMatch ? fontStyleMatch[1] : 'normal',
              textDecoration: textDecorationMatch ? textDecorationMatch[1] : 'none',
              textAlign: textAlignMatch ? textAlignMatch[1] : 'left',
              color: colorMatch ? colorMatch[1] : '',
              backgroundColor: bgColorMatch ? bgColorMatch[1].trim() : '',
              rotation: rotationMatch ? parseInt(rotationMatch[1]) : 0
            });
          }
        });

        doc.querySelectorAll('img').forEach((img) => {
          const parent = img.closest('[style*="position"]') || img.parentElement;
          if (!parent) return;

          const style = parent.getAttribute('style') || '';
          const leftMatch = style.match(/left:\s*(\d+(?:\.\d+)?)%/);
          const topMatch = style.match(/top:\s*(\d+(?:\.\d+)?)%/);
          const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)%/);
          const heightMatch = style.match(/height:\s*(\d+(?:\.\d+)?)%/);

          elements.push({
            id: `img-${Date.now()}-${elements.length}`,
            type: 'image',
            src: img.src,
            left: leftMatch ? parseFloat(leftMatch[1]) : 20,
            top: topMatch ? parseFloat(topMatch[1]) : 20,
            width: widthMatch ? parseFloat(widthMatch[1]) : 50,
            height: heightMatch ? parseFloat(heightMatch[1]) : 30
          });
        });
      } catch (e) {
        console.error('Error parsing elements:', e);
        const textEl = doc.body.querySelector('*');
        if (textEl && textEl.textContent && textEl.textContent.trim()) {
          elements.push({
            id: `text-${Date.now()}-0`,
            type: 'text',
            content: textEl.textContent.trim(),
            left: 10,
            top: 20,
            width: 80,
            fontSize: 16
          });
        }
      }
    }
    return elements;
  };

  const serializeElements = (elements) => {
    return elements.map(el => {
      if (el.type === 'text') {
        const sanitizedContent = el.content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const h = typeof el.height === 'number' ? el.height + '%' : (el.height || 'auto');
        const ff = el.fontFamily || 'sans-serif';
        const fw = el.fontWeight || 'normal';
        const fs = el.fontStyle || 'normal';
        const td = el.textDecoration || 'none';
        const ta = el.textAlign || 'left';
        const c = el.color && el.color !== '#000000' ? el.color : '';
        const bg = el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : '';
        const r = el.rotation || 0;
        const colorStyle = c ? `color:${c};` : '';
        const bgStyle = bg ? `background-color:${bg};` : '';
        return `<div class="draggable-text" style="position:absolute;left:${el.left}%;top:${el.top}%;width:${el.width}%;height:${h};font-size:${el.fontSize}px;font-family:"${ff}";font-weight:${fw};font-style:${fs};text-decoration:${td};text-align:${ta};${colorStyle}${bgStyle}transform:rotate(${r}deg)">${sanitizedContent}</div>`;
      }
      if (el.type === 'image') {
        const safeSrc = el.src.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<div class="draggable-image" style="position:absolute;left:${el.left}%;top:${el.top}%;width:${el.width}%;height:${el.height}%;"><img src="${safeSrc}" style="width:100%;height:100%;object-fit:contain;" /></div>`;
      }
      return '';
    }).join('');
  };

  const loadData = useCallback(async () => {
    if (loadingRef.current) return
    if (Date.now() < retryAfterRef.current) return
    loadingRef.current = true
    try {
      const res = await apiFetch(`/cards/load-auth/${folderId}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const parsedCards = data.map(card => ({
          front: parseElements(card.front),
          back: parseElements(card.back),
          frontBg: card.frontBg || '',
          backBg: card.backBg || '',
          tags: card.tags || ''
        }));
        dispatch({ type: 'SET_CARDS', payload: parsedCards });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError && e.status === 429) {
        retryAfterRef.current = Date.now() + 30000
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    } finally {
      loadingRef.current = false
    }
  }, [folderId]);

  const saveCards = useCallback(async () => {
    if (savingRef.current) return
    if (Date.now() < saveRetryAfterRef.current) return
    savingRef.current = true
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const serializedCards = state.cards.map(card => ({
        front: serializeElements(card.front),
        back: serializeElements(card.back),
        frontBg: card.frontBg,
        backBg: card.backBg,
        tags: card.tags || ''
      }));
      await apiFetch('/cards/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId: parseInt(folderId), cards: serializedCards }),
      });
    } catch (e) {
      console.error('Save error:', e);
      if (e instanceof ApiError && e.status === 429) {
        saveRetryAfterRef.current = Date.now() + 30000
      }
    }
    finally { dispatch({ type: 'SET_SAVING', payload: false }); savingRef.current = false }
  }, [state.cards, folderId]);

  const userRef = useRef(user);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (!userRef.current) { navigate('/home'); return; }
    requestAnimationFrame(() => loadData());
  }, [folderId, navigate, loadData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveCards();
    }, 3000);
    return () => clearTimeout(timer);
  }, [state.cards, saveCards]);

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
  }, [state.selectedElement, saveCards]);

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
        highlightColor: 'transparent'
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
      const res = await apiFetch('/cards/upload', {
        method: 'POST',
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

  const updateElementInCard = (elementId, updates, side) => {
    const newCards = [...state.cards];
    const card = { ...newCards[state.currentIndex] };
    const elements = [...(side === 'back' ? card.back : card.front)];
    const updatedElements = elements.map(el => el.id === elementId ? { ...el, ...updates } : el);
    if (side === 'back') {
      card.back = updatedElements;
    } else {
      card.front = updatedElements;
    }
    newCards[state.currentIndex] = card;
    dispatch({ type: 'SET_CARDS', payload: newCards });
  };

  const deleteElementInCard = (elementId, side) => {
    const newCards = [...state.cards];
    const card = { ...newCards[state.currentIndex] };
    const filteredElements = (side === 'back' ? card.back : card.front).filter(el => el.id !== elementId);
    if (side === 'back') {
      card.back = filteredElements;
    } else {
      card.front = filteredElements;
    }
    newCards[state.currentIndex] = card;
    dispatch({ type: 'SET_CARDS', payload: newCards });
  };

  const updateTags = (tags) => {
    const newCards = [...state.cards];
    newCards[state.currentIndex] = { ...newCards[state.currentIndex], tags: tags };
    dispatch({ type: 'UPDATE_TAGS', payload: { tags } });
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
        textColor={selectedEl?.color ?? ''}
        backgroundColor={selectedEl?.backgroundColor ?? ''}
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
          <div className="card-flip-container">
            <div className={`card-flip-wrapper ${state.isFlipped ? 'flipped' : ''}`}>
              <div className="card-flip-front">
                <CardCanvas
                  elements={currentCard?.front || []}
                  bgColor={currentCard?.frontBg || 'var(--bg-surface)'}
                  isSelected={!state.isFlipped ? state.selectedElement : null}
                  onSelect={(id) => { if (!state.isFlipped) dispatch({ type: 'SET_SELECTED_ELEMENT', payload: id }); }}
                  onUpdate={(id, updates) => updateElementInCard(id, updates, 'front')}
                  onDelete={(id) => deleteElementInCard(id, 'front')}
                  t={t}
                />
              </div>
              <div className="card-flip-back">
                <CardCanvas
                  elements={currentCard?.back || []}
                  bgColor={currentCard?.backBg || 'var(--bg-surface)'}
                  isSelected={state.isFlipped ? state.selectedElement : null}
                  onSelect={(id) => { if (state.isFlipped) dispatch({ type: 'SET_SELECTED_ELEMENT', payload: id }); }}
                  onUpdate={(id, updates) => updateElementInCard(id, updates, 'back')}
                  onDelete={(id) => deleteElementInCard(id, 'back')}
                  t={t}
                />
              </div>
            </div>
          </div>
          <div className="editor-card-counter">{state.currentIndex + 1} / {state.cards.length}</div>
          <div className="card-nav">
            <button className="nav-btn" onClick={() => dispatch({ type: 'SET_CURRENT_INDEX', payload: Math.max(0, state.currentIndex - 1) })} disabled={state.currentIndex === 0}><ChevronLeft size={32} /></button>
            <button className="flip-btn" onClick={() => dispatch({ type: 'SET_FLIPPED', payload: !state.isFlipped })}>Flip</button>
            <button className="nav-btn" onClick={() => dispatch({ type: 'SET_CURRENT_INDEX', payload: Math.min(state.cards.length - 1, state.currentIndex + 1) })} disabled={state.currentIndex === state.cards.length - 1}><ChevronRight size={32} /></button>
          </div>
          <div className="editor-meta-row">
            <div className="tags-input-container">
              <label>Tags:</label>
              <input
                type="text"
                className="toolbar-select"
                placeholder="Comma separated tags..."
                value={currentTags}
                onChange={(e) => updateTags(e.target.value)}
              />
            </div>
            <div className="editor-card-actions">
              <button className="editor-action-btn" onClick={() => dispatch({ type: 'DUPLICATE_CARD' })} title="Duplicate Card"><Copy size={18} /></button>
              <button className="editor-action-btn delete-btn-nav" onClick={() => { if (state.cards.length > 1 && confirm(t('confirm_discard_card'))) dispatch({ type: 'DELETE_CARD' }) }} disabled={state.cards.length === 1}><Trash2 size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
