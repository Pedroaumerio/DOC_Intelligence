import { useEnviarDocumento, useDocumento } from '../api/documentos'
import { rotuloTipo } from '../lib/documento'
import type { DocumentoSessao } from '../session/SessionDocumentos'
import { CampoExtraido } from './CampoExtraido'
import { EsperaProcessando } from './EsperaProcessando'
import estilos from './CartaoResultado.module.css'

/**
 * O que o processamento devolveu para um documento enviado nesta sessão.
 * Enquanto está em "processando", faz poll (ver documentoQuery); ao concluir,
 * mostra tipo, campos com confiança individual e o nome de arquivo sugerido.
 */
export function CartaoResultado({ doc }: { doc: DocumentoSessao }) {
  const { data, isPending, isError } = useDocumento(doc.id)
  const { mutate: reenviar, isPending: reenviando } = useEnviarDocumento()

  const recebidoEm =
    data && 'recebido_em' in data ? data.recebido_em : doc.enviadoEm

  return (
    <article className={estilos.cartao}>
      <header className={estilos.cabecalho}>
        <p className={estilos.original} title={doc.nomeOriginal}>
          {doc.nomeOriginal}
        </p>
        {data?.status === 'concluido' && (
          <span className={estilos.tipo}>{rotuloTipo(data.tipo_documento)}</span>
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

      {data?.status === 'concluido' && (
        <>
          <dl className={estilos.campos}>
            {Object.entries(data.campos).map(([chave, campo]) => (
              <CampoExtraido key={chave} chave={chave} campo={campo} />
            ))}
          </dl>
          <div className={estilos.nomeSugerido}>
            <span className={estilos.rotuloNome}>Nome padronizado do arquivo</span>
            <code className={estilos.codigoNome}>{data.nome_sugerido}</code>
            <span className={estilos.trocaNome}>
              substitui <span className={estilos.riscado}>{doc.nomeOriginal}</span>
            </span>
          </div>
        </>
      )}
    </article>
  )
}
