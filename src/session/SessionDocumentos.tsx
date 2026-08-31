/*
 * Documentos enviados nesta sessão. Estado de aplicação, não de servidor: o
 * TanStack Query cuida do que a API devolve por id; aqui fica a lista do que
 * esta pessoa enviou.
 *
 * O arquivo original é guardado em `sessionStorage` (ver `persistencia.ts` e
 * ADR-0001 §5, fato d): sobrevive ao recarregar a aba, some quando a aba fecha,
 * e nunca vai para `localStorage` nem para servidor. Assim a pessoa reabre o que
 * enviou durante o expediente. Os campos extraídos continuam não persistidos.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import {
  carregarSessao,
  escreverSessao,
  limparSessao,
  serializarSessao,
} from './persistencia'

export interface DocumentoSessao {
  id: string
  nomeOriginal: string
  hash: string
  enviadoEm: string
  jaExistia: boolean
  /** Guardado em memória e em sessionStorage (fato d) — reabrir e "tentar de novo". */
  arquivo: File
}

interface Estado {
  lista: DocumentoSessao[]
}

type Acao =
  | { tipo: 'registrar'; doc: DocumentoSessao }
  | { tipo: 'limpar' }

function reducer(estado: Estado, acao: Acao): Estado {
  switch (acao.tipo) {
    case 'registrar':
      if (estado.lista.some((d) => d.id === acao.doc.id)) return estado
      return { lista: [acao.doc, ...estado.lista] }
    case 'limpar':
      return { lista: [] }
  }
}

interface Contexto {
  documentos: DocumentoSessao[]
  registrar: (doc: DocumentoSessao) => void
  /** Apaga os arquivos guardados desta sessão (storage + memória). */
  limpar: () => void
  hashesEnviados: Set<string>
}

const SessionContext = createContext<Contexto | null>(null)

export function SessionDocumentosProvider({
  children,
  documentosIniciais,
}: {
  children: ReactNode
  /** Só para testes: semeia a sessão e desliga a persistência. */
  documentosIniciais?: DocumentoSessao[]
}) {
  const modoTeste = documentosIniciais !== undefined

  const [estado, dispatch] = useReducer(reducer, undefined, () => ({
    lista: documentosIniciais ?? carregarSessao(),
  }))

  const registrar = useCallback(
    (doc: DocumentoSessao) => dispatch({ tipo: 'registrar', doc }),
    [],
  )

  const limpar = useCallback(() => {
    limparSessao()
    dispatch({ tipo: 'limpar' })
  }, [])

  // Persiste a lista sempre que muda. Serializar o arquivo é assíncrono; o token
  // descarta uma gravação que ficou para trás de outra mais recente.
  const tokenSalvar = useRef(0)
  useEffect(() => {
    if (modoTeste) return
    const meu = ++tokenSalvar.current
    void serializarSessao(estado.lista).then((json) => {
      if (meu === tokenSalvar.current) escreverSessao(json)
    })
  }, [estado.lista, modoTeste])

  const valor = useMemo<Contexto>(
    () => ({
      documentos: estado.lista,
      registrar,
      limpar,
      hashesEnviados: new Set(estado.lista.map((d) => d.hash)),
    }),
    [estado.lista, registrar, limpar],
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
