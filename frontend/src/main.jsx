import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import './App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
<StrictMode>
<ClerkProvider
  publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
  afterSignOutUrl="/"
  appearance={{
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
  }}
>
<App />
</ClerkProvider>
</StrictMode>,
)
