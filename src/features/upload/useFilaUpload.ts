/*
 * Fila de upload do navegador — estado local da tela "Adicionar documento".
 *
 * Cada arquivo passa por: lendo (hash SHA-256) -> pronto -> enviando -> enviado,
 * ou -> duplicado (mesmo hash já na fila ou já enviado nesta sessão), ou -> falhou.
 * O envio é em lote com concorrência limitada (fato e: pico de 800 entre 9h e 11h).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEnviarDocumento } from '../../api/documentos'
import { formatoAceito, ROTULO_FORMATOS } from '../../lib/formatosAceitos'
import { hashArquivo } from '../../lib/hash'
import { useSessionDocumentos } from '../../session/SessionDocumentos'

export type StatusItem =
  | 'lendo'
  | 'pronto'
  | 'duplicado'
  | 'enviando'
  | 'enviado'
  | 'falhou'

export interface ItemFila {
  idLocal: string
  arquivo: File
  nome: string
  tamanho: number
  hash?: string
  status: StatusItem
  erro?: string
  docId?: string
}

const CONCORRENCIA_MAX = 3

let contador = 0
const novoIdLocal = () => `f${++contador}`

export function useFilaUpload() {
  const [itens, setItens] = useState<ItemFila[]>([])
  // Espelho do estado para o envio em lote (ação sempre posterior a um render).
  const itensRef = useRef(itens)
  useEffect(() => {
    itensRef.current = itens
  }, [itens])

  const { mutateAsync } = useEnviarDocumento()
  const { registrar, hashesEnviados } = useSessionDocumentos()

  const atualizar = useCallback(
    (idLocal: string, mudanca: Partial<ItemFila>) => {
      setItens((atual) =>
        atual.map((it) => (it.idLocal === idLocal ? { ...it, ...mudanca } : it)),
      )
    },
    [],
  )

  const adicionar = useCallback(
    (arquivos: FileList | File[]) => {
      const novos: ItemFila[] = []
      for (const arquivo of Array.from(arquivos)) {
        const aceito = formatoAceito(arquivo)
        novos.push({
          idLocal: novoIdLocal(),
          arquivo,
          nome: arquivo.name,
          tamanho: arquivo.size,
          status: aceito ? 'lendo' : 'falhou',
          erro: aceito ? undefined : `Formato não aceito. Use ${ROTULO_FORMATOS}.`,
        })
      }
      setItens((atual) => [...atual, ...novos])

      // Resolve o hash de todo o lote e só então decide os status, num único
      // update — evita a corrida em que dois arquivos idênticos chegam juntos e
      // nenhum "vê" o outro ainda sem hash.
      const paraLer = novos.filter((it) => it.status === 'lendo')
      void Promise.all(
        paraLer.map(async (it) => [it.idLocal, await hashArquivo(it.arquivo)] as const),
      ).then((pares) => {
        const hashPorId = new Map(pares)
        setItens((atual) => {
          const vistos = new Set<string>(hashesEnviados)
          for (const it of atual) {
            if (it.hash && !hashPorId.has(it.idLocal)) vistos.add(it.hash)
          }
          return atual.map((it) => {
            const hash = hashPorId.get(it.idLocal)
            if (!hash) return it
            if (vistos.has(hash)) return { ...it, hash, status: 'duplicado' as StatusItem }
            vistos.add(hash)
            return { ...it, hash, status: 'pronto' as StatusItem }
          })
        })
      })
    },
    [hashesEnviados],
  )

  const remover = useCallback((idLocal: string) => {
    setItens((atual) => atual.filter((it) => it.idLocal !== idLocal))
  }, [])

  const limparConcluidos = useCallback(() => {
    setItens((atual) =>
      atual.filter((it) => it.status !== 'enviado' && it.status !== 'duplicado'),
    )
  }, [])

  const enviarUm = useCallback(
    async (item: ItemFila) => {
      atualizar(item.idLocal, { status: 'enviando', erro: undefined })
      try {
        const resposta = await mutateAsync({
          arquivo: item.arquivo,
          hash: item.hash!,
          nome_original: item.nome,
        })
        atualizar(item.idLocal, { status: 'enviado', docId: resposta.id })
        registrar({
          id: resposta.id,
          nomeOriginal: item.nome,
          hash: item.hash!,
          enviadoEm: new Date().toISOString(),
          jaExistia: resposta.ja_existia,
          arquivo: item.arquivo,
        })
      } catch {
        atualizar(item.idLocal, {
          status: 'falhou',
          erro: 'Não foi possível enviar agora. Tente de novo.',
        })
      }
    },
    [atualizar, mutateAsync, registrar],
  )

  const enviarTodos = useCallback(async () => {
    const fila = itensRef.current.filter(
      (it) => it.status === 'pronto' || it.status === 'falhou',
    )
    let cursor = 0
    async function worker() {
      while (cursor < fila.length) {
        const atual = fila[cursor++]!
        await enviarUm(atual)
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(CONCORRENCIA_MAX, fila.length) }, worker),
    )
  }, [enviarUm])

  const prontosParaEnvio = itens.filter(
    (it) => it.status === 'pronto' || it.status === 'falhou',
  ).length
  const lendo = itens.some((it) => it.status === 'lendo')

  return {
    itens,
    adicionar,
    remover,
    limparConcluidos,
    enviarTodos,
    prontosParaEnvio,
    ocupado: lendo,
  }
}
