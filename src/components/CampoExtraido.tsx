import { formatarValorCampo, rotuloCampo } from '../lib/documento'
import type { CampoExtraido as Campo } from '../types/contrato'
import { IndicadorConfianca } from './IndicadorConfianca'
import estilos from './CampoExtraido.module.css'

export function CampoExtraido({
  chave,
  campo,
  revisar = false,
}: {
  chave: string
  campo: Campo
  revisar?: boolean
}) {
  return (
    <div className={estilos.raiz} data-revisar={revisar || undefined}>
      <dt className={estilos.rotulo}>
        {rotuloCampo(chave)}
        {revisar && <span className={estilos.marca}> · revisar</span>}
      </dt>
      <dd className={estilos.valor}>
        <span>{formatarValorCampo(chave, campo.valor)}</span>
        <IndicadorConfianca confianca={campo.confianca} />
      </dd>
    </div>
  )
}
