import type { ItemFila } from '../features/upload/useFilaUpload'
import { StatusPill } from './StatusPill'
import estilos from './FilaUpload.module.css'

function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FilaUpload({
  itens,
  onRemover,
}: {
  itens: ItemFila[]
  onRemover: (idLocal: string) => void
}) {
  if (itens.length === 0) return null

  return (
    <ul className={estilos.lista}>
      {itens.map((item) => (
        <li key={item.idLocal} className={estilos.item}>
          <div className={estilos.info}>
            <span className={estilos.nome} title={item.nome}>
              {item.nome}
            </span>
            <span className={estilos.tamanho}>{tamanhoLegivel(item.tamanho)}</span>
          </div>
          <div className={estilos.direita}>
            <StatusPill status={item.status} />
            {item.status !== 'enviando' && item.status !== 'enviado' && (
              <button
                type="button"
                className={estilos.remover}
                onClick={() => onRemover(item.idLocal)}
                aria-label={`Remover ${item.nome} da fila`}
              >
                ×
              </button>
            )}
          </div>
          {item.erro && <p className={estilos.erro}>{item.erro}</p>}
        </li>
      ))}
    </ul>
  )
}
