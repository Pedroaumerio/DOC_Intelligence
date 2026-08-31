import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import type { DocumentoSessao } from '../session/SessionDocumentos'
import { Provedores } from '../test/utils'
import { AvisoArquivosGuardados } from './AvisoArquivosGuardados'

function doc(nome: string): DocumentoSessao {
  return {
    id: `doc_${nome}`,
    nomeOriginal: nome,
    hash: nome,
    enviadoEm: '2026-08-31T12:00:00.000Z',
    jaExistia: false,
    arquivo: new File(['x'], nome, { type: 'image/jpeg' }),
  }
}

test('não aparece quando a sessão não tem arquivos', () => {
  render(<AvisoArquivosGuardados />, { wrapper: Provedores })
  expect(screen.queryByText(/guardado/i)).not.toBeInTheDocument()
})

test('mostra a contagem e "esquece" ao clicar', async () => {
  render(<AvisoArquivosGuardados />, {
    wrapper: ({ children }) => (
      <Provedores docsSessao={[doc('rg.jpeg'), doc('contracheque.jpeg')]}>
        {children}
      </Provedores>
    ),
  })

  expect(
    screen.getByText(/2 arquivos que você enviou estão guardados/i),
  ).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: /esquecer agora/i }))
  expect(screen.queryByText(/guardados nesta aba/i)).not.toBeInTheDocument()
})
