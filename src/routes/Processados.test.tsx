import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { semearAcervo } from '../mocks/acervo'
import { configurarDuble } from '../mocks/duble'
import { enviarArquivoFalso, Provedores } from '../test/utils'
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

test('oferece "ver arquivo enviado" só para documento enviado nesta sessão', async () => {
  configurarDuble({ probFalha: 0 })
  const doc = await enviarArquivoFalso('rg-desta-sessao.jpeg', 'image/jpeg')

  render(<Processados />, {
    wrapper: ({ children }) => <Provedores docsSessao={[doc]}>{children}</Provedores>,
  })

  // a linha do documento da sessão (o mais recente, primeira página)
  const nomeSessao = await screen.findByText('rg-desta-sessao.jpeg')
  const linhaSessao = nomeSessao.closest('li')!
  await userEvent.click(within(linhaSessao).getByRole('button'))
  await userEvent.click(
    await within(linhaSessao).findByRole('button', { name: /ver arquivo enviado/i }),
  )
  expect(await screen.findByRole('dialog')).toBeInTheDocument()

  // uma linha do acervo semeado não tem arquivo — não oferece o botão
  await userEvent.keyboard('{Escape}')
  const linhasAcervo = screen
    .getAllByRole('listitem')
    .filter((li) => li !== linhaSessao)
  await userEvent.click(within(linhasAcervo[0]!).getByRole('button'))
  expect(
    within(linhasAcervo[0]!).queryByRole('button', { name: /ver arquivo enviado/i }),
  ).not.toBeInTheDocument()
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
