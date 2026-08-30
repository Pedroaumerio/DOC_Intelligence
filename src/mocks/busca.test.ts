import { beforeEach, expect, test } from 'vitest'
import { getJson } from '../api/client'
import type { RespostaListaDocumentos } from '../types/contrato'
import { semearAcervo } from './acervo'

beforeEach(() => semearAcervo())

const lista = (qs: string) =>
  getJson(`/documentos${qs}`) as Promise<RespostaListaDocumentos>

test('GET /documentos pagina e ordena por recebido_em (mais recente primeiro)', async () => {
  const p1 = await lista('?pagina=1&tamanho=10')
  expect(p1.total).toBe(24)
  expect(p1.itens).toHaveLength(10)
  expect(p1.tem_proxima).toBe(true)
  for (let i = 1; i < p1.itens.length; i++) {
    expect(p1.itens[i - 1]!.recebido_em >= p1.itens[i]!.recebido_em).toBe(true)
  }

  const p3 = await lista('?pagina=3&tamanho=10')
  expect(p3.itens).toHaveLength(4)
  expect(p3.tem_proxima).toBe(false)
})

test('filtra por status', async () => {
  const r = await lista('?status=concluido&tamanho=50')
  expect(r.itens.length).toBeGreaterThan(0)
  expect(r.itens.every((d) => d.status === 'concluido')).toBe(true)
})

test('busca por texto casa o nome do arquivo', async () => {
  const r = await lista('?q=digitalizar')
  expect(r.total).toBe(1)
  expect(r.itens[0]!.nome_original).toContain('digitalizar')
})

test('resumo traz tipo e titular quando o documento foi lido', async () => {
  const r = await lista('?status=concluido&tamanho=1')
  const doc = r.itens[0]!
  expect(doc.tipo_documento).toBeTruthy()
  expect(doc.titular).toBeTruthy()
  expect(doc.nome_sugerido).toMatch(/_\d{4}-\d{2}-\d{2}\./)
})
