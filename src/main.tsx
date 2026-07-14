import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/tokens/tokens.css'
import './ui/styles.css'
import App from './App'
import { ErrorBoundary } from './ui/components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
