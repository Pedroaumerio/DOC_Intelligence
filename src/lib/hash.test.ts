import { expect, test } from 'vitest'
import { arquivoFalso } from '../test/utils'
import { hashArquivo, hashTexto } from './hash'

test('hashTexto bate com o vetor conhecido de SHA-256("abc")', async () => {
  expect(await hashTexto('abc')).toBe(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  )
})

test('o mesmo conteúdo de arquivo produz o mesmo hash', async () => {
  const a = await hashArquivo(arquivoFalso('rg-frente.pdf', 'bytes-iguais'))
  const b = await hashArquivo(arquivoFalso('rg-outro-nome.pdf', 'bytes-iguais'))
  const c = await hashArquivo(arquivoFalso('rg.pdf', 'bytes-diferentes'))
  expect(a).toBe(b)
  expect(a).not.toBe(c)
})
