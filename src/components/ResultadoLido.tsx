import { useState } from 'react'
import { rotuloCampo } from '../lib/documento'
import type {
  DocumentoAguardandoConferencia,
  DocumentoConcluido,
} from '../types/contrato'
import { CampoExtraido } from './CampoExtraido'
import { FormularioConferencia } from './FormularioConferencia'
import estilos from './ResultadoLido.module.css'

/**
 * O miolo de um resultado lido: aviso de conferência (se houver), campos com
 * confiança individual e o nome de arquivo padronizado. Compartilhado entre o
 * cartão da sessão (que faz poll) e a lista de processados (que expande a linha).
 *
 * Documento pendente ganha o botão "Conferir e corrigir" — a pessoa conferente
 * ajusta os campos e ele passa a pronto.
 */
export function ResultadoLido({
  data,
  nomeOriginal,
}: {
  data: DocumentoConcluido | DocumentoAguardandoConferencia
  nomeOriginal: string
}) {
  const [editando, setEditando] = useState(false)
  const emConferencia = data.status === 'aguardando_conferencia'
  const incertos = new Set(emConferencia ? data.campos_incertos : [])

  if (emConferencia && editando) {
    return (
      <FormularioConferencia doc={data} onCancelar={() => setEditando(false)} />
    )
  }

  return (
    <>
      {emConferencia && (
        <div className={estilos.conferenciaBox} role="status">
          <p className={estilos.conferencia}>
            A leitura ficou incerta em{' '}
            <strong>{data.campos_incertos.map(rotuloCampo).join(', ')}</strong>. Este
            documento não entra como pronto — a conferência humana precisa revisar.
          </p>
          <button
            type="button"
            className={estilos.corrigir}
            onClick={() => setEditando(true)}
          >
            Conferir e corrigir
          </button>
        </div>
      )}

      <dl className={estilos.campos}>
        {Object.entries(data.campos).map(([chave, campo]) => (
          <CampoExtraido
            key={chave}
            chave={chave}
            campo={campo}
            revisar={incertos.has(chave)}
          />
        ))}
      </dl>

      <div className={estilos.nomeSugerido}>
        <span className={estilos.rotuloNome}>
          Nome padronizado do arquivo{emConferencia ? ' (proposto)' : ''}
        </span>
        <code className={estilos.codigoNome}>{data.nome_sugerido}</code>
        <span className={estilos.trocaNome}>
          substitui <span className={estilos.riscado}>{nomeOriginal}</span>
        </span>
      </div>
    </>
  )
}
