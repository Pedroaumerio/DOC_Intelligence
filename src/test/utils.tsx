import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { postForm } from '../api/client'
import { hashArquivo } from '../lib/hash'
import { SessionDocumentosProvider, type DocumentoSessao } from '../session/SessionDocumentos'
import type { RespostaEnvio } from '../types/contrato'

export function Provedores({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  )
  return (
    <QueryClientProvider client={client}>
      <SessionDocumentosProvider>{children}</SessionDocumentosProvider>
    </QueryClientProvider>
  )
}

export function arquivoFalso(nome = 'rg.pdf', conteudo = `conteudo-${nome}`): File {
  return new File([conteudo], nome, { type: 'application/pdf' })
}

/** Envia um arquivo pelo mesmo caminho do app e devolve o que a sessão guardaria. */
export async function enviarArquivoFalso(nome = 'rg.pdf'): Promise<DocumentoSessao> {
  const arquivo = arquivoFalso(nome)
  const hash = await hashArquivo(arquivo)
  const form = new FormData()
  form.set('arquivo', arquivo)
  form.set('hash', hash)
  form.set('nome_original', nome)
  const resp = (await postForm('/documentos', form)) as RespostaEnvio
  return {
    id: resp.id,
    nomeOriginal: nome,
    hash,
    enviadoEm: new Date().toISOString(),
    jaExistia: resp.ja_existia,
    arquivo,
  }
}
