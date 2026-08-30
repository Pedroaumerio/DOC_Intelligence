import { formatarValorCampo, rotuloCampo } from '../lib/documento'
import type { CampoExtraido as Campo } from '../types/contrato'
import { IndicadorConfianca } from './IndicadorConfianca'
import estilos from './CampoExtraido.module.css'

export function CampoExtraido({ chave, campo }: { chave: string; campo: Campo }) {
  return (
    <div className={estilos.raiz}>
      <dt className={estilos.rotulo}>{rotuloCampo(chave)}</dt>
      <dd className={estilos.valor}>
        <span>{formatarValorCampo(chave, campo.valor)}</span>
        <IndicadorConfianca confianca={campo.confianca} />
      </dd>
    </div>
  )
}
