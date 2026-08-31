/*
 * Persistência dos documentos enviados NESTA sessão, em `sessionStorage`.
 *
 * Decisão registrada na ADR-0001 §5 (fato d): o arquivo original é PII, então
 * fica só em `sessionStorage` — escopo da aba, apagado quando a aba fecha — e
 * nunca em `localStorage` nem em servidor. Serve para a pessoa reabrir o que
 * enviou durante o expediente sem ter que procurar o arquivo de novo. Os campos
 * extraídos (o texto lido) continuam não sendo persistidos.
 */
import type { DocumentoSessao } from './SessionDocumentos'

export const CHAVE_SESSAO = 'doc-intelligence:sessao:v1'

interface DocumentoGuardado {
  id: string
  nomeOriginal: string
  hash: string
  enviadoEm: string
  jaExistia: boolean
  tipoArquivo: string
  /** Conteúdo do arquivo em base64 (sem o prefixo `data:`). */
  base64Arquivo: string
}

/** Lê a sessão guardada. Nunca lança — storage indisponível ou corrompido → []. */
export function carregarSessao(): DocumentoSessao[] {
  try {
    const bruto = sessionStorage.getItem(CHAVE_SESSAO)
    if (!bruto) return []
    const itens = JSON.parse(bruto) as DocumentoGuardado[]
    return itens.map((it) => ({
      id: it.id,
      nomeOriginal: it.nomeOriginal,
      hash: it.hash,
      enviadoEm: it.enviadoEm,
      jaExistia: it.jaExistia,
      arquivo: base64ParaFile(it.base64Arquivo, it.nomeOriginal, it.tipoArquivo),
    }))
  } catch {
    return []
  }
}

/** Serializa a lista para JSON (a leitura do arquivo é assíncrona). */
export async function serializarSessao(docs: DocumentoSessao[]): Promise<string> {
  const itens: DocumentoGuardado[] = await Promise.all(
    docs.map(async (d) => ({
      id: d.id,
      nomeOriginal: d.nomeOriginal,
      hash: d.hash,
      enviadoEm: d.enviadoEm,
      jaExistia: d.jaExistia,
      tipoArquivo: d.arquivo.type,
      base64Arquivo: await fileParaBase64(d.arquivo),
    })),
  )
  return JSON.stringify(itens)
}

/** Grava. Nunca lança — quota estourada (~5 MB) → segue sem persistir. */
export function escreverSessao(json: string): void {
  try {
    sessionStorage.setItem(CHAVE_SESSAO, json)
  } catch {
    // QuotaExceededError ou storage bloqueado: o estado em memória continua
    // valendo para a sessão; só a sobrevivência ao reload é perdida.
  }
}

export function limparSessao(): void {
  try {
    sessionStorage.removeItem(CHAVE_SESSAO)
  } catch {
    // ignora
  }
}

async function fileParaBase64(arquivo: Blob): Promise<string> {
  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  let binario = ''
  const PEDACO = 0x8000
  for (let i = 0; i < bytes.length; i += PEDACO) {
    binario += String.fromCharCode(...bytes.subarray(i, i + PEDACO))
  }
  return btoa(binario)
}

function base64ParaFile(base64: string, nome: string, tipo: string): File {
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i)
  }
  return new File([bytes], nome, { type: tipo })
}
