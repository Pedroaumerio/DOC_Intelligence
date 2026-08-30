import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { semearAcervo } from '../mocks/acervo'
import { Provedores } from '../test/utils'
import { Processados } from './Processados'

beforeEach(() => semearAcervo())

test('lista os processados do acervo, paginada', async () => {
  render(<Processados />, { wrapper: Provedores })

  expect(await screen.findByText('24 documentos')).toBeInTheDocument()
  expect(await screen.findByText(/Página 1 de 3/)).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(10)
})

test('a busca filtra a lista', async () => {
  render(<Processados />, { wrapper: Provedores })
  await screen.findByText('24 documentos')

  await userEvent.type(screen.getByLabelText('Buscar documentos'), 'holerite')

  expect(await screen.findByText('1 documento', {}, { timeout: 2000 })).toBeInTheDocument()
  expect(screen.getByText(/holerite agosto\.pdf/)).toBeInTheDocument()
})

test('a paginação avança e volta', async () => {
  render(<Processados />, { wrapper: Provedores })
  await screen.findByText(/Página 1 de 3/)

  await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  expect(await screen.findByText(/Página 2 de 3/)).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
  expect(await screen.findByText(/Página 1 de 3/)).toBeInTheDocument()
})

test('clicar num item expande e mostra o resultado', async () => {
  render(<Processados />, { wrapper: Provedores })
  await screen.findByText('24 documentos')

  const primeiro = screen.getAllByRole('listitem')[0]!
  await userEvent.click(within(primeiro).getByRole('button'))

  // resultado lido (nome padronizado) ou mensagem de falha
  expect(
    await within(primeiro).findByText(
      /Nome padronizado do arquivo|não respondeu desta vez/i,
    ),
  ).toBeInTheDocument()
})
