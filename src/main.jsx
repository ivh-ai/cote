import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import WorldCountriesGame from './WorldCountriesGame.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WorldCountriesGame />
  </StrictMode>,
)
