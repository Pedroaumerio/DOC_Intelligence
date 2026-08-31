import { afterEach, expect, test } from 'vitest'
import {
  carregarSessao,
  CHAVE_SESSAO,
  escreverSessao,
  limparSessao,
  serializarSessao,
} from './persistencia'
import type { DocumentoSessao } from './SessionDocumentos'

afterEach(() => sessionStorage.clear())

function docFalso(bytes: number[], nome: string, tipo: string): DocumentoSessao {
  return {
    id: `doc_${nome}`,
    nomeOriginal: nome,
    hash: 'abc',
    enviadoEm: '2026-08-31T12:00:00.000Z',
    jaExistia: false,
    arquivo: new File([new Uint8Array(bytes)], nome, { type: tipo }),
  }
}

test('o arquivo sobrevive a um round-trip por sessionStorage, byte a byte', async () => {
  const original = [0, 1, 2, 250, 251, 255, 128, 42]
  escreverSessao(await serializarSessao([docFalso(original, 'rg.jpeg', 'image/jpeg')]))

  const [recuperado] = carregarSessao()
  expect(recuperado?.nomeOriginal).toBe('rg.jpeg')
  expect(recuperado?.arquivo.type).toBe('image/jpeg')

  const bytes = [...new Uint8Array(await recuperado!.arquivo.arrayBuffer())]
  expect(bytes).toEqual(original)
})

test('storage vazio, ausente ou corrompido devolve lista vazia', () => {
  expect(carregarSessao()).toEqual([])
  sessionStorage.setItem(CHAVE_SESSAO, '{isso não é json}')
  expect(carregarSessao()).toEqual([])
})

test('limparSessao apaga a chave', async () => {
  escreverSessao(await serializarSessao([docFalso([1, 2, 3], 'a.pdf', 'application/pdf')]))
  expect(carregarSessao()).toHaveLength(1)

  limparSessao()
  expect(carregarSessao()).toEqual([])
})
