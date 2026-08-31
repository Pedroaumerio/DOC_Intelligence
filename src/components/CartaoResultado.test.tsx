import { render, screen, waitFor } from '@testing-library/react'
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
    indiceDocumento: 0, // fixa no exemplo do enunciado (identidade, 5 campos)
  })
})

test('mostra o tipo, os cinco campos com confiança e o nome padronizado', async () => {
  const doc = await enviarArquivoFalso('foto do rg.jpeg')
  render(<CartaoResultado doc={doc} />, { wrapper: Provedores })

  // enquanto processa, a espera é explícita — não um spinner genérico
  expect(
    screen.getByText(/ainda estamos lendo este documento/i),
  ).toBeInTheDocument()

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

test('confiança baixa segura o documento para conferência humana', async () => {
  configurarDuble({ probQuedaCampo: 1 }) // sempre derruba um campo
  const doc = await enviarArquivoFalso('rg.jpeg')
  render(<CartaoResultado doc={doc} />, { wrapper: Provedores })

  // não entra como pronto: aparece o aviso de conferência
  expect(await screen.findByText('Aguardando conferência')).toBeInTheDocument()
  expect(screen.getByText(/não entra como pronto/i)).toBeInTheDocument()

  // os campos ainda aparecem, e pelo menos um marcado para revisar
  expect(screen.getByText('João da Silva')).toBeInTheDocument()
  expect(screen.getAllByText(/revisar/i).length).toBeGreaterThan(0)

  // e há o botão de conferir/corrigir
  expect(
    screen.getByRole('button', { name: /conferir e corrigir/i }),
  ).toBeInTheDocument()
})

test('conferir e corrigir marca o documento como pronto', async () => {
  configurarDuble({ indiceDocumento: 0, probQuedaCampo: 1 })
  const doc = await enviarArquivoFalso('rg.jpeg')
  render(<CartaoResultado doc={doc} />, { wrapper: Provedores })

  await screen.findByText('Aguardando conferência')
  await userEvent.click(screen.getByRole('button', { name: /conferir e corrigir/i }))

  const inputNome = screen.getByLabelText(/^nome/i)
  await userEvent.clear(inputNome)
  await userEvent.type(inputNome, 'João da Silva Conferido')
  await userEvent.click(screen.getByRole('button', { name: /salvar conferência/i }))

  // volta como concluído: sem o chip de conferência, com o valor corrigido
  await waitFor(() =>
    expect(screen.queryByText('Aguardando conferência')).not.toBeInTheDocument(),
  )
  expect(screen.getByText('João da Silva Conferido')).toBeInTheDocument()
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
