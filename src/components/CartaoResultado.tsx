import { useState } from 'react'
import { useEnviarDocumento, useDocumento } from '../api/documentos'
import { rotuloTipo } from '../lib/documento'
import type { DocumentoSessao } from '../session/SessionDocumentos'
import { EsperaProcessando } from './EsperaProcessando'
import { ResultadoLido } from './ResultadoLido'
import { VisualizadorArquivo } from './VisualizadorArquivo'
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
  const [vendoArquivo, setVendoArquivo] = useState(false)

  const recebidoEm =
    data && 'recebido_em' in data ? data.recebido_em : doc.enviadoEm

  const lido =
    data?.status === 'concluido' || data?.status === 'aguardando_conferencia'
      ? data
      : null
  const emConferencia = data?.status === 'aguardando_conferencia'

  return (
    <article className={estilos.cartao} data-conferencia={emConferencia || undefined}>
      <header className={estilos.cabecalho}>
        <div className={estilos.identificacao}>
          <p className={estilos.original} title={doc.nomeOriginal}>
            {doc.nomeOriginal}
          </p>
          <button
            type="button"
            className={estilos.verArquivo}
            onClick={() => setVendoArquivo(true)}
          >
            Ver arquivo enviado
          </button>
        </div>
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

      {lido && <ResultadoLido data={lido} nomeOriginal={doc.nomeOriginal} />}

      {vendoArquivo && (
        <VisualizadorArquivo
          arquivo={doc.arquivo}
          nome={doc.nomeOriginal}
          onFechar={() => setVendoArquivo(false)}
        />
      )}
    </article>
  )
}
