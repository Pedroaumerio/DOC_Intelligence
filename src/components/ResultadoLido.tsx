import { rotuloCampo } from '../lib/documento'
import type {
  DocumentoAguardandoConferencia,
  DocumentoConcluido,
} from '../types/contrato'
import { CampoExtraido } from './CampoExtraido'
import estilos from './ResultadoLido.module.css'

/**
 * O miolo de um resultado lido: aviso de conferência (se houver), campos com
 * confiança individual e o nome de arquivo padronizado. Compartilhado entre o
 * cartão da sessão (que faz poll) e a lista de processados (que expande a linha).
 */
export function ResultadoLido({
  data,
  nomeOriginal,
}: {
  data: DocumentoConcluido | DocumentoAguardandoConferencia
  nomeOriginal: string
}) {
  const emConferencia = data.status === 'aguardando_conferencia'
  const incertos = new Set(emConferencia ? data.campos_incertos : [])

  return (
    <>
      {emConferencia && (
        <p className={estilos.conferencia} role="status">
          A leitura ficou incerta em{' '}
          <strong>{data.campos_incertos.map(rotuloCampo).join(', ')}</strong>. Este
          documento não entra como pronto — fica para conferência humana revisar.
        </p>
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
