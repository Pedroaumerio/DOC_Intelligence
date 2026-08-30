import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'

async function iniciar() {
  // MSW no nível de rede: o app não sabe que o servidor é falso (ver ADR-0001).
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
  const { semearAcervo } = await import('./mocks/acervo')
  semearAcervo()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void iniciar()
