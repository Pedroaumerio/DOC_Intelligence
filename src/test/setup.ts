import '@testing-library/jest-dom/vitest'
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

// jsdom e o fetch do Node (undici) trazem classes File/Blob diferentes, e o
// parser multipart do undici rejeita o File do jsdom. Unificar nas do Node deixa
// o upload real (FormData com o arquivo) funcionar nos testes.
globalThis.File = NodeFile as unknown as typeof File
globalThis.Blob = NodeBlob as unknown as typeof Blob

// jsdom não implementa object URLs; o visualizador de arquivo usa. Um stub
// simples basta para os testes de comportamento.
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => `blob:jsdom/${Math.random().toString(16).slice(2)}`
  URL.revokeObjectURL = () => {}
}
import { definirIntervaloPoll } from '../api/documentos'
import { resetarMock } from '../mocks/handlers'
import { server } from '../mocks/server'

// O mesmo mock (MSW) serve o app e os testes — ver ADR-0001.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  definirIntervaloPoll(20)
})
afterEach(() => {
  server.resetHandlers()
  resetarMock()
  cleanup()
})
afterAll(() => server.close())
