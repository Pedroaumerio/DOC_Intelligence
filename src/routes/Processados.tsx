import { useState } from 'react'
import { useDocumentos } from '../api/documentos'
import { LinhaProcessado } from '../components/LinhaProcessado'
import { useDebounce } from '../lib/useDebounce'
import type { StatusDocumento } from '../types/contrato'
import estilos from './Processados.module.css'

const TAMANHO_PAGINA = 10

const STATUS_OPCOES: { valor: StatusDocumento | ''; rotulo: string }[] = [
  { valor: '', rotulo: 'Todos os status' },
  { valor: 'concluido', rotulo: 'Concluídos' },
  { valor: 'aguardando_conferencia', rotulo: 'Aguardando conferência' },
  { valor: 'falhou', rotulo: 'Falhou' },
  { valor: 'processando', rotulo: 'Processando' },
]

export function Processados() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusDocumento | ''>('')
  const [pagina, setPagina] = useState(1)

  const qBusca = useDebounce(q.trim(), 300)

  const { data, isPending, isError, isPlaceholderData } = useDocumentos({
    pagina,
    tamanho: TAMANHO_PAGINA,
    q: qBusca || undefined,
    status: status || undefined,
  })

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / data.tamanho)) : 1

  return (
    <section>
      <h1 className={estilos.titulo}>Processados</h1>
      <p className={estilos.intro}>
        Todos os documentos já processados. Busque por nome do arquivo, titular,
        tipo ou qualquer campo lido. Clique num item para ver o resultado.
      </p>

      <div className={estilos.filtros}>
        <input
          type="search"
          className={estilos.busca}
          placeholder="Buscar…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPagina(1)
          }}
          aria-label="Buscar documentos"
        />
        <select
          className={estilos.status}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusDocumento | '')
            setPagina(1)
          }}
          aria-label="Filtrar por status"
        >
          {STATUS_OPCOES.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      </div>

      {isPending ? (
        <p className={estilos.aviso}>Carregando…</p>
      ) : isError || !data ? (
        <p className={estilos.aviso}>Não foi possível carregar a lista.</p>
      ) : data.itens.length === 0 ? (
        <p className={estilos.aviso}>
          {qBusca || status
            ? 'Nenhum documento encontrado com esse filtro.'
            : 'Nenhum documento processado ainda.'}
        </p>
      ) : (
        <>
          <p className={estilos.contagem} aria-live="polite">
            {data.total} {data.total === 1 ? 'documento' : 'documentos'}
          </p>
          <ul className={estilos.lista} data-carregando={isPlaceholderData || undefined}>
            {data.itens.map((doc) => (
              <LinhaProcessado key={doc.id} resumo={doc} />
            ))}
          </ul>

          {totalPaginas > 1 && (
            <div className={estilos.paginacao}>
              <button
                type="button"
                onClick={() => setPagina((p) => p - 1)}
                disabled={pagina <= 1}
              >
                Anterior
              </button>
              <span>
                Página {pagina} de {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina((p) => p + 1)}
                disabled={!data.tem_proxima}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
