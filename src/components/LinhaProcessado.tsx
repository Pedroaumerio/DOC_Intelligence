import { useState } from 'react'
import { useDocumento } from '../api/documentos'
import { dataCurta, rotuloTipo } from '../lib/documento'
import type { DocumentoResumo } from '../types/contrato'
import { EsperaProcessando } from './EsperaProcessando'
import { ResultadoLido } from './ResultadoLido'
import { StatusBadge } from './StatusBadge'
import estilos from './LinhaProcessado.module.css'

/** Uma linha da lista de processados; clicar expande o resultado ali mesmo. */
export function LinhaProcessado({ resumo }: { resumo: DocumentoResumo }) {
  const [aberto, setAberto] = useState(false)

  return (
    <li className={estilos.linha} data-conferencia={resumo.status === 'aguardando_conferencia' || undefined}>
      <button
        type="button"
        className={estilos.cabecalho}
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
      >
        <span className={estilos.principal}>
          <span className={estilos.nome} title={resumo.nome_original}>
            {resumo.nome_original}
          </span>
          <span className={estilos.meta}>
            {resumo.titular ?? 'sem titular'} · {dataCurta(resumo.recebido_em)}
          </span>
        </span>
        <span className={estilos.tags}>
          {resumo.tipo_documento && (
            <span className={estilos.tipo}>{rotuloTipo(resumo.tipo_documento)}</span>
          )}
          <StatusBadge status={resumo.status} />
          <span className={estilos.seta} data-aberto={aberto || undefined} aria-hidden="true">
            ⌄
          </span>
        </span>
      </button>

      {aberto && (
        <div className={estilos.detalhe}>
          <Detalhe id={resumo.id} nomeOriginal={resumo.nome_original} />
        </div>
      )}
    </li>
  )
}

function Detalhe({ id, nomeOriginal }: { id: string; nomeOriginal: string }) {
  const { data, isPending, isError } = useDocumento(id)

  if (isPending) return <p className={estilos.aviso}>Carregando o resultado…</p>
  if (isError || !data) {
    return <p className={estilos.aviso}>Não foi possível carregar este documento.</p>
  }
  if (data.status === 'processando') {
    return <EsperaProcessando desde={data.recebido_em} />
  }
  if (data.status === 'falhou') {
    return (
      <p className={estilos.falha} role="alert">
        {data.mensagem}
      </p>
    )
  }
  return <ResultadoLido data={data} nomeOriginal={nomeOriginal} />
}
