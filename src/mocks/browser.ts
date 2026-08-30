import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/** Worker MSW para o app rodando no navegador (dev server). */
export const worker = setupWorker(...handlers)
