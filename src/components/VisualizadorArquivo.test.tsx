import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { VisualizadorArquivo } from './VisualizadorArquivo'

test('mostra a imagem enviada e fecha no ✕', async () => {
  const arquivo = new File(['x'], 'foto do rg.jpeg', { type: 'image/jpeg' })
  const aoFechar = vi.fn()
  render(
    <VisualizadorArquivo arquivo={arquivo} nome="foto do rg.jpeg" onFechar={aoFechar} />,
  )

  const dialogo = screen.getByRole('dialog')
  const img = within(dialogo).getByRole('img', { name: /arquivo enviado/i })
  expect(img.getAttribute('src')).toMatch(/^blob:/)

  await userEvent.click(within(dialogo).getByRole('button', { name: /fechar/i }))
  expect(aoFechar).toHaveBeenCalledTimes(1)
})

test('Esc fecha o visualizador', async () => {
  const aoFechar = vi.fn()
  render(
    <VisualizadorArquivo
      arquivo={new File(['x'], 'rg.jpeg', { type: 'image/jpeg' })}
      nome="rg.jpeg"
      onFechar={aoFechar}
    />,
  )

  await userEvent.keyboard('{Escape}')
  expect(aoFechar).toHaveBeenCalled()
})

test('formato sem pré-visualização mostra aviso, não um quadro vazio', () => {
  render(
    <VisualizadorArquivo
      arquivo={new File(['x'], 'documento.heic', { type: 'image/heic' })}
      nome="documento.heic"
      onFechar={vi.fn()}
    />,
  )

  expect(screen.getByText(/não dá para pré-visualizar/i)).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})

test('PDF vai para um iframe com o leitor do navegador', () => {
  render(
    <VisualizadorArquivo
      arquivo={new File(['%PDF-1.4'], 'contrato.pdf', { type: 'application/pdf' })}
      nome="contrato.pdf"
      onFechar={vi.fn()}
    />,
  )

  const frame = screen.getByTitle(/arquivo enviado/i)
  expect(frame.tagName).toBe('IFRAME')
  expect(frame.getAttribute('src')).toMatch(/^blob:/)
})
