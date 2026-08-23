import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // TODO(strict-mode): re-enable once controller resurrection across StrictMode
  // remounts is resolved (useSingleRef factories capture stale parents).
  <App />,
)
