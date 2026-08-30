import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Servidor MSW usado pelos testes (Vitest roda em Node, não no navegador). */
export const server = setupServer(...handlers)
