import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

export function useModal() {
  const [modalState, setModalState] = useState(null)

  const showAlert = useCallback((message, title = 'Notice') => {
    setModalState({ type: 'alert', title, message })
  }, [])

  const showConfirm = useCallback((message, title = 'Confirm') => {
    return new Promise((resolve) => {
      setModalState({ type: 'confirm', title, message, onResolve: resolve })
    })
  }, [])

  const showPrompt = useCallback((defaultValue = '', title = 'Input') => {
    return new Promise((resolve) => {
      setModalState({ type: 'prompt', title, defaultValue, onResolve: resolve })
    })
  }, [])

  const closeModal = useCallback(() => {
    if (modalState?.type === 'confirm' || modalState?.type === 'prompt') {
      modalState.onResolve(modalState.type === 'confirm' ? false : null)
    }
    setModalState(null)
  }, [modalState])

  const handleConfirm = useCallback(() => {
    modalState?.onResolve(true)
    setModalState(null)
  }, [modalState])

  const handlePromptSubmit = useCallback((value) => {
    modalState?.onResolve(value)
    setModalState(null)
  }, [modalState])

  return { modalState, showAlert, showConfirm, showPrompt, closeModal, handleConfirm, handlePromptSubmit }
}

export function Modal({ state, onClose, onConfirm, onSubmit }) {
  const [inputValue, setInputValue] = useState(state?.defaultValue || '')

  useEffect(() => {
    if (state?.defaultValue) {
      setInputValue(state.defaultValue)
    }
  }, [state?.defaultValue])

  if (!state) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{state.title}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-content">
          {state.type === 'prompt' ? (
            <input
              type="text"
              className="modal-input"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSubmit(inputValue)}
              autoFocus
            />
          ) : (
            <p>{state.message}</p>
          )}
        </div>

        <div className="modal-actions">
          {state.type === 'alert' ? (
            <button className="primary-btn" onClick={onClose}>OK</button>
          ) : (
            <>
              <button className="secondary-btn" onClick={onClose}>Cancel</button>
              <button 
                className="primary-btn" 
                onClick={() => state.type === 'prompt' ? onSubmit(inputValue) : onConfirm()}
              >
                OK
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}