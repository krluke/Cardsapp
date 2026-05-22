import { useEffect, useState, useRef } from 'react'
import { ClerkProvider } from '@clerk/clerk-react'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const clerkAppearance = {
  variables: {
    colorPrimary: 'var(--accent-color)',
    colorText: 'var(--text-main)',
    colorTextSecondary: 'var(--text-muted)',
    colorBackground: 'var(--bg-surface)',
    colorInputBackground: 'var(--bg-surface)',
    colorInputText: 'var(--text-main)',
    colorBorder: 'var(--border-color)',
    colorDanger: 'var(--danger-color)',
    borderRadius: '12px',
    fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
  },
  elements: {
    card: { boxShadow: 'var(--shadow-md)' },
    modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.6)' },
  },
}

export default function ClerkGate({ children }) {
  const [ready, setReady] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    const id = requestIdleCallback(() => {
      setReady(true)
    }, { timeout: 1500 })

    return () => cancelIdleCallback(id)
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-canvas, #F4F0EB)' }}>
        <div style={{ color: 'var(--text-muted, #8A847C)', fontSize: '1.2rem' }}>CardsApp</div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/" appearance={clerkAppearance}>
      {children}
    </ClerkProvider>
  )
}
