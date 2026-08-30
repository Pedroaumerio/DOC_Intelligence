import { expect, test } from 'vitest'
import { formatarValorCampo, rotuloCampo, rotuloTipo } from './documento'

test('rótulo do tipo: conhecidos mapeados, resto vira Title Case', () => {
  expect(rotuloTipo('identidade')).toBe('Identidade (RG)')
  expect(rotuloTipo('laudo')).toBe('Laudo')
  expect(rotuloTipo('carteira_trabalho')).toBe('Carteira de Trabalho')
  expect(rotuloTipo('algo_novo')).toBe('Algo Novo')
})

test('rótulo do campo cobre os campos dos vários tipos', () => {
  expect(rotuloCampo('cpf')).toBe('CPF')
  expect(rotuloCampo('salario_liquido')).toBe('Salário líquido')
  expect(rotuloCampo('medico_responsavel')).toBe('Médico responsável')
  expect(rotuloCampo('vigencia_inicio')).toBe('Início da vigência')
  expect(rotuloCampo('campo_desconhecido')).toBe('Campo Desconhecido')
})

test('valor: data ISO vira dd/mm/aaaa, o resto passa direto', () => {
  expect(formatarValorCampo('data_exame', '2026-08-15')).toBe('15/08/2026')
  expect(formatarValorCampo('validade', '2027-06-30')).toBe('30/06/2027')
  expect(formatarValorCampo('competencia', '07/2026')).toBe('07/2026')
  expect(formatarValorCampo('valor', 'R$ 96.000,00')).toBe('R$ 96.000,00')
})
