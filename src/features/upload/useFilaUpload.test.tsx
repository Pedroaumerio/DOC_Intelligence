import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import { expect, test } from 'vitest'
import { arquivoFalso, Provedores } from '../../test/utils'
import { useFilaUpload } from './useFilaUpload'

test('detecta arquivo duplicado na fila pelo hash, antes de enviar', async () => {
  const { result } = renderHook(() => useFilaUpload(), { wrapper: Provedores })

  act(() => {
    result.current.adicionar([
      arquivoFalso('rg-frente.jpg', 'mesmos-bytes'),
      arquivoFalso('foto-again.jpg', 'mesmos-bytes'),
      arquivoFalso('cnh.jpg', 'outros-bytes'),
    ])
  })

  await waitFor(() => {
    expect(result.current.itens.every((i) => i.status !== 'lendo')).toBe(true)
  })

  const status = result.current.itens.map((i) => i.status).sort()
  expect(status).toEqual(['duplicado', 'pronto', 'pronto'])
  // só os não-duplicados contam para o botão de envio
  expect(result.current.prontosParaEnvio).toBe(2)
})

test('rejeita formato não aceito', async () => {
  const { result } = renderHook(() => useFilaUpload(), { wrapper: Provedores })

  act(() => {
    result.current.adicionar([new File(['x'], 'planilha.xlsx', { type: '' })])
  })

  await waitFor(() => {
    expect(result.current.itens[0]?.status).toBe('falhou')
  })
  expect(result.current.itens[0]?.erro).toMatch(/formato/i)
})
