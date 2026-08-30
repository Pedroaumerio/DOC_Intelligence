import { useEnviarDocumento, useDocumento } from '../api/documentos'
import { rotuloCampo, rotuloTipo } from '../lib/documento'
import type { DocumentoSessao } from '../session/SessionDocumentos'
import { CampoExtraido } from './CampoExtraido'
import { EsperaProcessando } from './EsperaProcessando'
import estilos from './CartaoResultado.module.css'

/**
 * O que o processamento devolveu para um documento enviado nesta sessão.
 * Enquanto está em "processando", faz poll (ver documentoQuery); ao concluir,
 * mostra tipo, campos com confiança individual e o nome de arquivo sugerido.
 *
 * Quando a máquina não teve confiança no que produziu, o documento NÃO entra
 * como pronto: fica marcado para conferência humana (enunciado).
 */
export function CartaoResultado({ doc }: { doc: DocumentoSessao }) {
  const { data, isPending, isError } = useDocumento(doc.id)
  const { mutate: reenviar, isPending: reenviando } = useEnviarDocumento()

  const recebidoEm =
    data && 'recebido_em' in data ? data.recebido_em : doc.enviadoEm

  const lido =
    data?.status === 'concluido' || data?.status === 'aguardando_conferencia'
      ? data
      : null
  const emConferencia = data?.status === 'aguardando_conferencia'
  const incertos = new Set(emConferencia ? data.campos_incertos : [])

  return (
    <article className={estilos.cartao} data-conferencia={emConferencia || undefined}>
      <header className={estilos.cabecalho}>
        <p className={estilos.original} title={doc.nomeOriginal}>
          {doc.nomeOriginal}
        </p>
        {lido && (
          <span className={estilos.chips}>
            {emConferencia && (
              <span className={estilos.chipConferencia}>Aguardando conferência</span>
            )}
            <span className={estilos.tipo}>{rotuloTipo(lido.tipo_documento)}</span>
          </span>
        )}
      </header>

      {(isPending || data?.status === 'processando') && (
        <EsperaProcessando desde={recebidoEm} />
      )}

      {(isError || data?.status === 'falhou') && (
        <div className={estilos.falha} role="alert">
          <p>
            {data?.status === 'falhou'
              ? data.mensagem
              : 'Não conseguimos falar com o serviço de leitura agora.'}
          </p>
          <button
            type="button"
            className={estilos.botaoRetry}
            disabled={reenviando}
            onClick={() =>
              reenviar({
                arquivo: doc.arquivo,
                hash: doc.hash,
                nome_original: doc.nomeOriginal,
              })
            }
          >
            {reenviando ? 'Enviando de novo…' : 'Tentar de novo'}
          </button>
        </div>
      )}

      {lido && (
        <>
          {emConferencia && (
            <p className={estilos.conferencia} role="status">
              A leitura ficou incerta em{' '}
              <strong>
                {data.campos_incertos.map(rotuloCampo).join(', ')}
              </strong>
              . Este documento não entra como pronto — fica para conferência
              humana revisar.
            </p>
          )}

          <dl className={estilos.campos}>
            {Object.entries(lido.campos).map(([chave, campo]) => (
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
            <code className={estilos.codigoNome}>{lido.nome_sugerido}</code>
            <span className={estilos.trocaNome}>
              substitui <span className={estilos.riscado}>{doc.nomeOriginal}</span>
            </span>
          </div>
        </>
      )}
    </article>
  )
}
