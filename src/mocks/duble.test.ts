import { afterEach, expect, test } from 'vitest'
import { classificarDocumento, configurarDuble, resetarDuble } from './duble'

afterEach(resetarDuble)

test('o #0 é o exemplo do enunciado: identidade com os cinco campos', () => {
  configurarDuble({ indiceDocumento: 0, probQuedaCampo: 0 })
  const r = classificarDocumento('foto.jpeg', 'qualquer')

  expect(r.tipo_documento).toBe('identidade')
  expect(Object.keys(r.campos).sort()).toEqual(
    ['data_nascimento', 'filiacao', 'nome', 'numero', 'orgao_emissor'].sort(),
  )
  expect(r.campos.nome!.valor).toBe('João da Silva')
  expect(r.nome_sugerido).toMatch(/^identidade_joao-da-silva_\d{4}-\d{2}-\d{2}\.jpeg$/)
})

test('cada tipo traz o seu conjunto de campos — laudo não tem CPF', () => {
  const laudo = classificarComIndice(encontrar('laudo'))
  expect(laudo.tipo_documento).toBe('laudo')
  expect(laudo.campos.cpf).toBeUndefined()
  expect(laudo.campos.crm).toBeDefined()
  expect(laudo.campos.medico_responsavel).toBeDefined()
  // o nome do arquivo usa o paciente, não "nome"
  expect(laudo.nome_sugerido.startsWith('laudo_')).toBe(true)
})

test('contracheque tem competência e salários; identidade não', () => {
  const cc = classificarComIndice(encontrar('contracheque'))
  expect(cc.tipo_documento).toBe('contracheque')
  expect(cc.campos.competencia).toBeDefined()
  expect(cc.campos.salario_liquido).toBeDefined()
  expect(cc.campos.orgao_emissor).toBeUndefined()
})

test('todos os campos têm confiança entre 0 e 1', () => {
  for (let i = 0; i < 12; i++) {
    const r = classificarComIndice(i)
    for (const c of Object.values(r.campos)) {
      expect(c.confianca).toBeGreaterThan(0)
      expect(c.confianca).toBeLessThanOrEqual(1)
    }
  }
})

test('o mesmo documento cai sempre no mesmo modelo', () => {
  const a = classificarDocumento('x.pdf', 'doc_abc').tipo_documento
  const b = classificarDocumento('x.pdf', 'doc_abc').tipo_documento
  expect(a).toBe(b)
})

// helpers -------------------------------------------------------------

function classificarComIndice(i: number) {
  configurarDuble({ indiceDocumento: i, probQuedaCampo: 0 })
  return classificarDocumento('arquivo.pdf', 'seed')
}

/** Primeiro índice do pool com o tipo pedido (varre até achar). */
function encontrar(tipo: string): number {
  for (let i = 0; i < 20; i++) {
    if (classificarComIndice(i).tipo_documento === tipo) return i
  }
  throw new Error(`tipo ${tipo} não está no pool`)
}
