import type { StatusItem } from '../features/upload/useFilaUpload'
import estilos from './StatusPill.module.css'

const ROTULOS: Record<StatusItem, string> = {
  lendo: 'Lendo o arquivo…',
  pronto: 'Pronto para enviar',
  duplicado: 'Já enviado nesta sessão',
  enviando: 'Enviando…',
  enviado: 'Enviado',
  falhou: 'Falhou',
}

export function StatusPill({ status }: { status: StatusItem }) {
  return (
    <span className={estilos.pill} data-status={status}>
      {ROTULOS[status]}
    </span>
  )
}
