import { expect, test } from 'vitest'
import { ACCEPT_ARQUIVOS, formatoAceito } from './formatosAceitos'

test('aceita imagem, PDF e os formatos de documento do escritório', () => {
  const aceitos = [
    { type: 'image/jpeg', name: 'foto.jpg' },
    { type: 'application/pdf', name: 'contrato.pdf' },
    {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      name: 'procuracao.docx',
    },
    { type: '', name: 'peticao.doc' }, // navegador sem type → cai na extensão
    { type: '', name: 'laudo.HEIC' }, // extensão maiúscula
    { type: 'text/plain', name: 'anotacoes.txt' },
  ]
  for (const a of aceitos) expect(formatoAceito(a)).toBe(true)
})

test('recusa o que não é documento de cliente', () => {
  for (const a of [
    { type: '', name: 'planilha.xlsx' },
    { type: 'application/zip', name: 'tudo.zip' },
    { type: '', name: 'script.exe' },
    { type: '', name: 'semextensao' },
  ]) {
    expect(formatoAceito(a)).toBe(false)
  }
})

test('o atributo accept cobre os MIME e as extensões principais', () => {
  for (const trecho of ['application/pdf', '.docx', '.jpg', 'image/heic', '.txt']) {
    expect(ACCEPT_ARQUIVOS).toContain(trecho)
  }
})
