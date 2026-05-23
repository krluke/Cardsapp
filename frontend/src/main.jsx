import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import './App.css'
import App from './App.jsx'

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

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>Try Again</button>
        </div>
      )
    }
    return this.props.children
  }
}

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const clerkAvailable = typeof clerkKey === 'string' && clerkKey.startsWith('pk_')

const appElement = (
  <ErrorBoundary>
    <App clerkAvailable={clerkAvailable} />
  </ErrorBoundary>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {clerkAvailable ? (
      <ClerkProvider publishableKey={clerkKey} afterSignOutUrl="/" appearance={clerkAppearance}>
        {appElement}
      </ClerkProvider>
    ) : (
      appElement
    )}
  </StrictMode>,
)
