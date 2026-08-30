import type { RequestHandler } from 'msw'

/**
 * Handlers do contrato da API (definido pela Trilha B — ver docs/contrato-api.md).
 *
 * Ainda vazio: o contrato e os handlers de request são parte do desenvolvimento,
 * não do setup da stack. MSW já está plugado (browser + node + testes) e passa a
 * interceptar assim que os handlers forem adicionados aqui.
 */
export const handlers: RequestHandler[] = []
