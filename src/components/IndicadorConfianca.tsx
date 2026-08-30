import {
  nivelConfianca,
  percentualConfianca,
  rotuloConfianca,
} from '../lib/documento'
import estilos from './IndicadorConfianca.module.css'

/**
 * Confiança de um campo, na paleta semântica (verde/neutro/vermelho) — nunca no
 * âmbar da marca, para não competir com o botão primário (ver §5 do recorte).
 */
export function IndicadorConfianca({ confianca }: { confianca: number }) {
  const nivel = nivelConfianca(confianca)
  return (
    <span className={estilos.raiz} data-nivel={nivel} title={rotuloConfianca(nivel)}>
      <span className={estilos.ponto} aria-hidden="true" />
      <span className={estilos.pct}>{percentualConfianca(confianca)}</span>
      <span className="sr-only">{rotuloConfianca(nivel)}</span>
    </span>
  )
}
