import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { configurarDuble } from '../mocks/duble'
import { enviarArquivoFalso, Provedores } from '../test/utils'
import { CartaoResultado } from './CartaoResultado'

beforeEach(() => {
  configurarDuble({
    latenciaMinMs: 10,
    latenciaMaxMs: 10,
    probFalha: 0,
    probQuedaCampo: 0,
    indiceIdentidade: 0, // fixa na identidade do exemplo do enunciado
  })
})

test('mostra o tipo, os cinco campos com confiança e o nome padronizado', async () => {
  const doc = await enviarArquivoFalso('foto do rg.jpeg')
  render(<CartaoResultado doc={doc} />, { wrapper: Provedores })

  // enquanto processa, a espera é explícita — não um spinner genérico
  expect(screen.getByText(/pode levar até 40 segundos/i)).toBeInTheDocument()

  expect(await screen.findByText('Identidade (RG)')).toBeInTheDocument()

  for (const rotulo of [
    'Nome',
    'Filiação',
    'Data de nascimento',
    'Número',
    'Órgão emissor',
  ]) {
    expect(screen.getByText(rotulo)).toBeInTheDocument()
  }
  expect(screen.getByText('João da Silva')).toBeInTheDocument()
  expect(screen.getByText('12/04/1990')).toBeInTheDocument()

  // uma confiança por campo (percentual)
  expect(screen.getAllByText(/^\d{1,3}%$/)).toHaveLength(5)

  // nome padronizado proposto, no lugar do nome que veio do celular
  expect(
    screen.getByText(/^identidade_joao-da-silva_\d{4}-\d{2}-\d{2}\.jpeg$/),
  ).toBeInTheDocument()
})

test('falha do fornecedor é humana e permite tentar de novo', async () => {
  configurarDuble({ probFalha: 1 })
  const doc = await enviarArquivoFalso('rg.pdf')
  render(<CartaoResultado doc={doc} />, { wrapper: Provedores })

  const alerta = await screen.findByRole('alert')
  expect(alerta).toHaveTextContent(/tente enviar de novo/i)

  configurarDuble({ probFalha: 0 })
  await userEvent.click(screen.getByRole('button', { name: /tentar de novo/i }))

  expect(await screen.findByText('Identidade (RG)')).toBeInTheDocument()
})
