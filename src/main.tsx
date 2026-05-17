import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/material-symbols-rounded/latin-400.css'
import '@material/web/button/filled-button.js'
import '@material/web/button/filled-tonal-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/chips/assist-chip.js'
import '@material/web/chips/filter-chip.js'
import '@material/web/icon/icon.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/progress/linear-progress.js'
import '@material/web/textfield/outlined-text-field.js'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
