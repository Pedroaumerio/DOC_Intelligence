import { afterEach, expect, test } from 'vitest'
import { classificarIdentidade, configurarDuble, resetarDuble } from './duble'

afterEach(resetarDuble)

test('sempre devolve os cinco campos com confiança entre 0 e 1', () => {
  configurarDuble({ probQuedaCampo: 0 })
  const { tipo_documento, campos } = classificarIdentidade('rg.jpg', 'doc_x')

  expect(tipo_documento).toBe('identidade')
  expect(Object.keys(campos).sort()).toEqual(
    ['data_nascimento', 'filiacao', 'nome', 'numero', 'orgao_emissor'].sort(),
  )
  for (const c of Object.values(campos)) {
    expect(c.confianca).toBeGreaterThan(0)
    expect(c.confianca).toBeLessThanOrEqual(1)
  }
})

test('o mesmo documento cai sempre na mesma identidade fictícia', () => {
  configurarDuble({ probQuedaCampo: 0 })
  const a = classificarIdentidade('rg.jpg', 'doc_abc').campos.nome!.valor
  const b = classificarIdentidade('rg.jpg', 'doc_abc').campos.nome!.valor
  expect(a).toBe(b)
})

test('indiceIdentidade fixa a pessoa (0 = exemplo do enunciado)', () => {
  configurarDuble({ indiceIdentidade: 0, probQuedaCampo: 0 })
  const r = classificarIdentidade('foto.jpeg', 'qualquer')
  expect(r.campos.nome!.valor).toBe('João da Silva')
  expect(r.nome_sugerido).toMatch(/^identidade_joao-da-silva_\d{4}-\d{2}-\d{2}\.jpeg$/)
})
