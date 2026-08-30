/*
 * Documentos enviados nesta sessão. Estado de aplicação, não de servidor: o
 * TanStack Query cuida do que a API devolve por id; aqui fica só a lista do que
 * esta pessoa enviou desde que abriu a tela (não há histórico nesta fatia).
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'

export interface DocumentoSessao {
  id: string
  nomeOriginal: string
  hash: string
  enviadoEm: string
  jaExistia: boolean
  /** Mantido em memória (não persistido — fato d) para permitir "tentar de novo". */
  arquivo: File
}

interface Estado {
  lista: DocumentoSessao[]
}

type Acao = { tipo: 'registrar'; doc: DocumentoSessao }

function reducer(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    case 'registrar':
      if (estado.lista.some((d) => d.id === acao.doc.id)) return estado
      return { lista: [acao.doc, ...estado.lista] }
  }
}

interface Contexto {
  documentos: DocumentoSessao[]
  registrar: (doc: DocumentoSessao) => void
  hashesEnviados: Set<string>
}

const SessionContext = createContext<Contexto | null>(null)

export function SessionDocumentosProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, { lista: [] })

  const registrar = useCallback(
    (doc: DocumentoSessao) => dispatch({ tipo: 'registrar', doc }),
    [],
  )

  const valor = useMemo<Contexto>(
    () => ({
      documentos: estado.lista,
      registrar,
      hashesEnviados: new Set(estado.lista.map((d) => d.hash)),
    }),
    [estado.lista, registrar],
  )

  return <SessionContext value={valor}>{children}</SessionContext>
}

export function useSessionDocumentos(): Contexto {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSessionDocumentos precisa estar dentro de SessionDocumentosProvider')
  }
  return ctx
}
