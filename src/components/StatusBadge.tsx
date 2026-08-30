import { rotuloStatus } from '../lib/documento'
import type { StatusDocumento } from '../types/contrato'
import estilos from './StatusBadge.module.css'

export function StatusBadge({ status }: { status: StatusDocumento }) {
  return (
    <span className={estilos.badge} data-status={status}>
      {rotuloStatus(status)}
    </span>
  )
}
